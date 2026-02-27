import { QdrantClient } from '@qdrant/js-client-rest';

const url = process.env.QDRANT_URL;
const apiKey = process.env.QDRANT_API_KEY;
export const qdrant = new QdrantClient({
  url,
  apiKey,
  checkCompatibility: false,
  timeout: 60_000,
});

export const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'products';
export const VECTOR_SIZE = 768; // Gemini embedding dimension for text-embedding-004

export async function ensureCollection() {
  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);
    if (!exists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      console.log('Qdrant collection created:', COLLECTION_NAME);
    }
    return { ok: true };
  } catch (err) {
    console.error('Qdrant unavailable, continuing without vector search:', err.message || err);
    return { ok: false, error: err };
  }
}
