import { genAI, EMBEDDING_MODEL } from '../config/gemini.js';
import { VECTOR_SIZE } from '../config/qdrant.js';

const EMBEDDING_CACHE_TTL_MS = 10 * 60 * 1000;
const EMBEDDING_CACHE_MAX = 500;
const embeddingCache = new Map();

function getCachedEmbedding(key) {
  const item = embeddingCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > EMBEDDING_CACHE_TTL_MS) {
    embeddingCache.delete(key);
    return null;
  }
  return item.value;
}

function setCachedEmbedding(key, value) {
  embeddingCache.set(key, { value, timestamp: Date.now() });
  if (embeddingCache.size > EMBEDDING_CACHE_MAX) {
    const firstKey = embeddingCache.keys().next().value;
    embeddingCache.delete(firstKey);
  }
}

export async function embedText(text) {
  const safeText = String(text || '').trim();
  if (!safeText) return [];
  const cacheKey = `${EMBEDDING_MODEL}:${safeText.toLowerCase()}`;
  const cached = getCachedEmbedding(cacheKey);
  if (cached) return cached;

  const result = await genAI.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: safeText,
    config: { outputDimensionality: VECTOR_SIZE },
  });
  const embedding = result.embeddings?.[0]?.values ?? result.embedding?.values;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Invalid embedding response');
  }
  if (embedding.length < VECTOR_SIZE) {
    throw new Error(`Embedding length ${embedding.length} < required ${VECTOR_SIZE}. Check model or QDRANT vector size.`);
  }
  const sliced = embedding.slice(0, VECTOR_SIZE);
  setCachedEmbedding(cacheKey, sliced);
  return sliced;
}
