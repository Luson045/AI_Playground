import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectMongo } from './config/db.js';
import { ensureCollection } from './config/qdrant.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import chatRoutes from './routes/chat.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

async function start() {
  await connectMongo();
  await ensureCollection();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
