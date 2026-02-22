const HF_ROUTER_URL = 'https://router.huggingface.co/v1';
const HF_CHAT_MODEL = process.env.HF_CHAT_MODEL || 'google/gemma-3-27b-it:featherless-ai';

function getToken() {
  return process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;
}

export function isHfConfigured() {
  return !!getToken();
}

/** Detect Gemini rate limit / quota errors (429 or RESOURCE_EXHAUSTED). */
export function isGeminiRateLimit(err) {
  if (!err) return false;
  const status = err.status ?? err.code;
  if (status === 429) return true;
  const msg = (err.message && String(err.message)) || '';
  return /RESOURCE_EXHAUSTED|quota|rate limit|429/i.test(msg);
}

/**
 * OpenAI-compatible chat completions via Hugging Face router.
 * @param {Array<{ role: 'user' | 'assistant' | 'system'; content: string }>} messages
 * @returns {Promise<string>} assistant message content
 */
export async function hfChatCompletion(messages) {
  const token = getToken();
  if (!token) throw new Error('HF_TOKEN (or HUGGINGFACE_TOKEN) is required for fallback.');
  const res = await fetch(`${HF_ROUTER_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: HF_CHAT_MODEL,
      messages,
      max_tokens: 1024,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || data.message || res.statusText;
    throw new Error(`HF router: ${res.status} ${msg}`);
  }
  const content = data.choices?.[0]?.message?.content;
  if (content == null) throw new Error('HF router: no content in response');
  return typeof content === 'string' ? content : String(content);
}
