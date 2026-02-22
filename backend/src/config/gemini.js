import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY not set; LLM and embeddings will fail.');
}

export const genAI = new GoogleGenAI({ apiKey: apiKey || 'dummy' });

export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const CHAT_MODEL = 'gemini-2.5-flash';
