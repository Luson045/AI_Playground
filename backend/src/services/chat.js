import { genAI, CHAT_MODEL } from '../config/gemini.js';
import { qdrant, COLLECTION_NAME } from '../config/qdrant.js';
import { embedText } from './embedding.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { isGeminiRateLimit, isHfConfigured, hfChatCompletion } from './hfRouter.js';

const SYSTEM_PROMPT = `You are a confident, persuasive product recommendation assistant. Your job is to match the user's request and sell the best fitting products.

- Use the full conversation context. If the user gives follow-up constraints (budget, size, skin type, color, location), apply them.
- Be specific and promotional without being pushy. Highlight 1-2 concrete benefits from the product details that match the user's needs.
- Mention the seller by name. Include price in INR using the symbol "₹" when it helps confirm budget.
- Avoid generic openings like "Here are the products I found." Start with a line tailored to the request.
- Use **bold** for product names and add a blank line between products. Plain text with simple markdown (bold only), no IDs. One short paragraph per product: product name, benefit, seller, and optionally price.

Example style:
"Picks that match your request:

Cheese Margherita Pizza - classic and cheesy, great for sharing. From Mario's Kitchen. ₹299.

Black Forest Pastry - rich and indulgent if you're in the mood for something sweet. By Sweet Delights. ₹220."

Never invent products; only recommend from the list. If nothing matches, say so politely and suggest trying different words.`;

const FALLBACK_PROMPT_EXTRA = `The user asked for something we don't have in stock. Reply with a short friendly line like: "We don't have [what they asked for] right now - but here are some picks you might like:" and briefly mention the listed product names and their sellers. Keep it warm and concise.`;

/** Generate 2-3 search query variations from the user message (for semantic search). */
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

const FOLLOWUP_HINTS = [
  /cheapest|cheaper|lowest|low price|budget|under|below|within|less than|more than|above|between/i,
  /\b(rs|inr|₹)\b/i,
  /\bthis|that|those|them|one|ones\b/i,
];

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'so', 'to', 'for', 'of', 'in', 'on', 'at', 'by',
  'with', 'without', 'from', 'into', 'over', 'under', 'below', 'above', 'between', 'within', 'near', 'around',
  'this', 'that', 'these', 'those', 'them', 'it', 'its', 'i', 'me', 'my', 'you', 'your', 'we', 'our', 'us',
  'show', 'find', 'give', 'get', 'need', 'want', 'looking', 'search', 'best', 'good', 'great', 'nice', 'cool',
  'cheap', 'cheaper', 'cheapest', 'budget', 'price', 'low', 'high', 'most', 'least', 'one', 'ones',
  'some', 'any', 'anything', 'something', 'stuff', 'items', 'product', 'products'
]);

function normalizeToken(token) {
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function extractKeywords(text) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9â‚¹\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map(normalizeToken);
  return [...new Set(tokens)];
}

function keywordOverlapCount(queryKeywords, product) {
  if (!queryKeywords.length) return 0;
  const blob = `${product?.name || ''} ${product?.category || ''} ${product?.description || ''}`.toLowerCase();
  const productTokens = new Set(
    blob
      .replace(/[^a-z0-9â‚¹\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(normalizeToken)
  );
  let count = 0;
  for (const kw of queryKeywords) {
    const norm = normalizeToken(kw);
    if (productTokens.has(norm)) count += 1;
  }
  return count;
}

function isFollowUpOnly(userMessage) {
  const words = userMessage.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 4) return true;
  return FOLLOWUP_HINTS.some((r) => r.test(userMessage));
}

function lastMeaningfulUserQuery(history = []) {
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m?.role !== 'user') continue;
    const text = String(m.text || '').trim();
    if (!text) continue;
    if (!isFollowUpOnly(text)) return text;
  }
  return '';
}

function buildSearchSeed(userMessage, history = []) {
  const base = userMessage.trim();
  if (!isFollowUpOnly(base)) return base;
  const prev = lastMeaningfulUserQuery(history);
  return prev ? `${prev} ${base}` : base;
}

function buildKeywordBoostQuery(text) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9₹\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const keywords = tokens.filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  if (keywords.length === 0) return '';
  keywords.sort((a, b) => b.length - a.length);
  const primary = keywords[0];
  const secondary = keywords[1] || '';
  const boost = [primary, primary, secondary].filter(Boolean).join(' ');
  return `${boost} ${text}`.trim();
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
const LOCATION_SIM_THRESHOLD = 0.62;
const SCORE_MARGIN_FACTOR = 0.9;

function cosineSimilarity(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function rankByLocation(products, userLocationVector, relevanceOrder) {
  if (!userLocationVector || !userLocationVector.length) return products;
  const scored = products.map((p) => {
    const score = p.locationEmbedding?.length
      ? cosineSimilarity(userLocationVector, p.locationEmbedding)
      : 0;
    return {
      ...p,
      _locationScore: score,
      _isNearby: score >= LOCATION_SIM_THRESHOLD,
      _relevanceRank: relevanceOrder.get(p.qdrantId) ?? 999,
    };
  });
  scored.sort((a, b) => {
    if (a._isNearby !== b._isNearby) return a._isNearby ? -1 : 1;
    if (a._isNearby && b._isNearby) return (b._locationScore || 0) - (a._locationScore || 0);
    return (a._relevanceRank || 999) - (b._relevanceRank || 999);
  });
  return scored.map(({ _locationScore, _isNearby, _relevanceRank, ...rest }) => rest);
}

/** Run search with query variations, merge by best score. Return only products above relevance threshold: if n>5 return top 5, else n. If none found, return latest 5. */
export async function searchWithVariations(userMessage, limit = 5, userId = null, history = []) {
  const thinking = [];
  const seedMessage = buildSearchSeed(userMessage, history);
  const variations = await generateQueryVariations(seedMessage);
  const boosted = buildKeywordBoostQuery(seedMessage);
  if (boosted && !variations.includes(boosted)) variations.push(boosted);
  thinking.push({ type: 'variations', queries: variations });

  let userLocationVector = null;
  if (userId) {
    try {
      const user = await User.findById(userId).select('location').lean();
      if (user?.location) {
        userLocationVector = await embedText(String(user.location).trim());
      }
    } catch (_) {
      userLocationVector = null;
    }
  }

  const seen = new Map();
  let qdrantFailed = false;
  for (const q of variations) {
    try {
      const hits = await searchOne(q, limit * 2);
      thinking.push({ type: 'search', query: q, count: hits.length });
      for (const { id, score } of hits) {
        if (!seen.has(id) || seen.get(id).score < score) {
          seen.set(id, { id, score });
        }
      }
    } catch (err) {
      qdrantFailed = true;
      thinking.push({ type: 'fallback', message: 'Search service unavailable, showing latest products.' });
      break;
    }
  }

  const withScores = [...seen.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .filter(([, data]) => data.score >= RELEVANCE_THRESHOLD);
  const topScores = withScores.slice(0, Math.min(5, withScores.length)).map(([, data]) => data.score);
  const minTopScore = topScores.length ? Math.min(...topScores) : RELEVANCE_THRESHOLD;
  const dynamicCutoff = Math.max(RELEVANCE_THRESHOLD, minTopScore * SCORE_MARGIN_FACTOR);
  const filteredByScore = withScores.filter(([, data]) => data.score >= dynamicCutoff);
  const sorted = (filteredByScore.length > limit ? filteredByScore.slice(0, limit) : filteredByScore).map(([id]) => id);
  const scoreById = new Map(filteredByScore.map(([id, data]) => [id, data.score]));
  const queryKeywords = extractKeywords(seedMessage);

  let products = [];
  let isFallback = false;
  if (sorted.length > 0 && !qdrantFailed) {
    products = await Product.find({ qdrantId: { $in: sorted } })
      .populate('userId', 'name email')
      .lean();
    const order = new Map(sorted.map((id, i) => [id, i]));
    products = rankByLocation(products, userLocationVector, order);
    if (queryKeywords.length) {
      const filtered = products.filter((p) => {
        const overlap = keywordOverlapCount(queryKeywords, p);
        const score = scoreById.get(p.qdrantId) ?? 0;
        return overlap > 0 && score >= dynamicCutoff;
      });
      if (filtered.length === 0) {
        isFallback = true;
        products = [];
      } else if (filtered.length < products.length) {
        thinking.push({ type: 'filter', message: 'Removed low-relevance results.' });
        products = filtered;
      }
    }
  } else {
    if (!qdrantFailed) {
      thinking.push({ type: 'fallback', message: 'No matches found, showing latest products.' });
    }
    isFallback = true;
    const fallback = await Product.find().sort({ createdAt: -1 }).limit(limit * 2).lean();
    const fallbackOrder = new Map(fallback.map((p, i) => [p.qdrantId, i]));
    products = rankByLocation(fallback, userLocationVector, fallbackOrder);
  }
  if (products.length === 0 && isFallback) {
    if (!qdrantFailed) {
      thinking.push({ type: 'fallback', message: 'No matches found, showing latest products.' });
    }
    const fallback = await Product.find().sort({ createdAt: -1 }).limit(limit * 2).lean();
    const fallbackOrder = new Map(fallback.map((p, i) => [p.qdrantId, i]));
    products = rankByLocation(fallback, userLocationVector, fallbackOrder);
  }
  if (products.length > limit) products = products.slice(0, limit);
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
              `- [${p._id}] ${p.name}: ${p.description} (Category: ${p.category || 'N/A'}, Price: ₹${p.price}, Seller: ${p.userId?.name || p.userId?.email || 'Unknown'})`
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
