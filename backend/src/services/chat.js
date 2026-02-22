import { genAI, CHAT_MODEL } from '../config/gemini.js';
import { qdrant, COLLECTION_NAME } from '../config/qdrant.js';
import { embedText } from './embedding.js';
import Product from '../models/Product.js';
import { isGeminiRateLimit, isHfConfigured, hfChatCompletion } from './hfRouter.js';

const SYSTEM_PROMPT = `You are a warm, persuasive product recommendation assistant. Your goal is to make the user curious and drawn to the products—without being pushy or explicitly selling.

- Write in an inviting, confident tone. Hint at why each product stands out (quality, value, vibe) in one short line. Mention the seller by name when you recommend a product (e.g. "from [Seller Name]" or "by [Seller Name]").
- Never use generic phrases like "Here are the products I found" or "Yeah, these are the options." Instead, open with something that fits the request (e.g. "A few picks that fit what you're after:", "These could hit the spot:", "Worth a look:").
- Plain text only. No markdown (no *, **, or product IDs).
- Product cards are shown below—don't repeat IDs or codes. One line per product: name, one compelling benefit, and the seller name. Use line breaks between items.

Example style:
"A few picks that fit what you're after:

Cheese Margherita Pizza — classic and cheesy, great for sharing. From Mario's Kitchen.

Black Forest Pastry — rich and indulgent if you're in the mood for something sweet. By Sweet Delights."

Never invent products; only recommend from the list. If nothing matches, say so kindly and suggest trying different words.`;

const FALLBACK_PROMPT_EXTRA = `The user asked for something we don't have in stock. Reply with a short friendly line like: "We don't have [what they asked for] right now—but here are some picks you might like:" and briefly mention the listed product names and their sellers. Keep it warm and concise.`;

/** Generate 2–3 search query variations from the user message (for semantic search). */
export async function generateQueryVariations(userMessage) {
  const prompt = `Generate 2 to 3 short product-search query variations for the following user request. Return ONLY a JSON array of strings, no other text. Example: ["wireless headphones", "bluetooth earphones", "noise cancelling earbuds"]. User request: ${userMessage}`;
  let text = '';
  try {
    const result = await genAI.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
    });
    text = (result?.text ?? '').trim();
  } catch (err) {
    if (isGeminiRateLimit(err) && isHfConfigured()) {
      text = await hfChatCompletion([{ role: 'user', content: prompt }]);
      text = text.trim();
    } else throw err;
  }
  const queries = [userMessage];
  try {
    const match = text.match(/\[[\s\S]*?\]/);
    const jsonStr = match ? match[0] : text;
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const extra = parsed
        .filter((q) => typeof q === 'string' && q.trim() && q.trim() !== userMessage.trim())
        .slice(0, 3);
      if (extra.length) queries.push(...extra);
    }
  } catch (_) {}
  return [...new Set(queries)];
}

/** Search Qdrant for one query; returns list of { qdrantId, score } (score from search). */
async function searchOne(query, limit = 5) {
  const vector = await embedText(query);
  const searchResult = await qdrant.search(COLLECTION_NAME, {
    vector,
    limit,
    with_payload: true,
  });
  return searchResult.map((r) => ({ id: r.id, score: r.score ?? 0 }));
}

const RELEVANCE_THRESHOLD = 0.48;

/** Run search with query variations, merge by best score. Return only products above relevance threshold: if n>5 return top 5, else n. If none found, return latest 5. */
export async function searchWithVariations(userMessage, limit = 5) {
  const thinking = [];
  const variations = await generateQueryVariations(userMessage);
  thinking.push({ type: 'variations', queries: variations });

  const seen = new Map();
  for (const q of variations) {
    const hits = await searchOne(q, limit * 2);
    thinking.push({ type: 'search', query: q, count: hits.length });
    for (const { id, score } of hits) {
      if (!seen.has(id) || seen.get(id).score < score) {
        seen.set(id, { id, score });
      }
    }
  }

  const withScores = [...seen.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .filter(([, data]) => data.score >= RELEVANCE_THRESHOLD);
  const sorted = (withScores.length > limit ? withScores.slice(0, limit) : withScores).map(([id]) => id);

  let products = [];
  let isFallback = false;
  if (sorted.length > 0) {
    products = await Product.find({ qdrantId: { $in: sorted } })
      .populate('userId', 'name email')
      .lean();
    const order = new Map(sorted.map((id, i) => [id, i]));
    products.sort((a, b) => (order.get(a.qdrantId) ?? 99) - (order.get(b.qdrantId) ?? 99));
  } else {
    thinking.push({ type: 'fallback', message: 'No matches found, showing latest products.' });
    isFallback = true;
    products = await Product.find().sort({ createdAt: -1 }).limit(limit).lean();
  }
  thinking.push({ type: 'done', totalFound: products.length });

  return { products, thinking, isFallback };
}

/** Normalize frontend history: Gemini expects "user" | "model", not "assistant". */
function normalizeHistory(history) {
  return (history || []).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    text: m.text,
  }));
}

export async function chatWithRecommendations(userMessage, productContext, history = [], isFallback = false) {
  const productList =
    productContext.length > 0
      ? productContext
          .map(
            (p) =>
              `- [${p._id}] ${p.name}: ${p.description} (Category: ${p.category || 'N/A'}, Price: $${p.price}, Seller: ${p.userId?.name || p.userId?.email || 'Unknown'})`
          )
          .join('\n')
      : 'No matching products in the database.';
  const contextBlock = `Available products to recommend (use the ID in brackets when suggesting):\n${productList}`;
  const systemExtra = isFallback ? '\n\n' + FALLBACK_PROMPT_EXTRA : '';
  const systemContent = SYSTEM_PROMPT + '\n\n' + contextBlock + systemExtra;
  const normalized = normalizeHistory(history);
  const contents = [
    { role: 'user', parts: [{ text: systemContent }] },
    { role: 'model', parts: [{ text: 'I will recommend only from the list and keep responses clear and helpful.' }] },
    ...normalized.slice(-8).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];
  const hfMessages = [
    { role: 'user', content: systemContent },
    { role: 'assistant', content: 'I will recommend only from the list and keep responses clear and helpful.' },
    ...normalized.slice(-8).map((m) => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text,
    })),
    { role: 'user', content: userMessage },
  ];
  try {
    const result = await genAI.models.generateContent({
      model: CHAT_MODEL,
      contents,
    });
    return result?.text ?? '';
  } catch (err) {
    if (isGeminiRateLimit(err) && isHfConfigured()) {
      return await hfChatCompletion(hfMessages);
    }
    throw err;
  }
}

export async function searchProductsByQuery(query, limit = 5) {
  const vector = await embedText(query);
  const searchResult = await qdrant.search(COLLECTION_NAME, {
    vector,
    limit,
    with_payload: true,
  });
  const ids = searchResult.map((r) => r.id);
  if (ids.length === 0) return [];
  const products = await Product.find({ qdrantId: { $in: ids } })
    .populate('userId', 'name email')
    .lean();
  const order = new Map(ids.map((id, i) => [id, i]));
  products.sort((a, b) => (order.get(a.qdrantId) ?? 99) - (order.get(b.qdrantId) ?? 99));
  return products;
}
