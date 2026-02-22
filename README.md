# AdBot — Online Advertisement Chatbot

A sleek product recommendation chatbot. Users can log in, upload products, and chat to get AI-powered product recommendations. Clicks from chat and market are tracked; sellers get an analytics dashboard.

## Tech stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Qdrant (vector DB), Gemini API (LLM + embeddings)
- **Frontend:** React, Vite, React Router

## Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas URL)
- Qdrant (local or Qdrant Cloud with API key)
- [Gemini API key](https://aistudio.google.com/apikey)

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI, QDRANT_URL, GEMINI_API_KEY, JWT_SECRET
npm install
npm run dev
```

Runs at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000` and proxies `/api` to the backend.

## Features

1. **Auth** — Register / log in (JWT).
2. **Upload** — Sellers add products (name, description, category, price, image URL, link). Stored in MongoDB and embedded in Qdrant for semantic search.
3. **Chat (primary page)** — Users describe what they need; the bot recommends products from the vector search and uses Gemini for natural replies. Product cards in chat are clickable; clicks are recorded.
4. **Market** — Browse all products; “View” opens the product link and records a market click.
5. **Dashboard** — Logged-in users see analytics: total products, total clicks, and per-product breakdown (from chat vs market).

## Environment (backend `.env`)

| Variable           | Description |
|--------------------|-------------|
| PORT               | Server port (default 5000) |
| MONGODB_URI        | MongoDB connection URL |
| QDRANT_URL         | Qdrant URL (e.g. Cloud URL) |
| QDRANT_API_KEY     | Qdrant API key (for Cloud) |
| GEMINI_API_KEY     | Google Gemini API key |
| JWT_SECRET         | Secret for JWT signing |
