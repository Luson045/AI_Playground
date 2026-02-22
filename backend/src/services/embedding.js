import { genAI, EMBEDDING_MODEL } from '../config/gemini.js';
import { VECTOR_SIZE } from '../config/qdrant.js';

export async function embedText(text) {
  const result = await genAI.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { outputDimensionality: VECTOR_SIZE },
  });
  const embedding = result.embeddings?.[0]?.values ?? result.embedding?.values;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Invalid embedding response');
  }
  if (embedding.length < VECTOR_SIZE) {
    throw new Error(`Embedding length ${embedding.length} < required ${VECTOR_SIZE}. Check model or QDRANT vector size.`);
  }
  return embedding.slice(0, VECTOR_SIZE);
}
