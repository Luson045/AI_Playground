import express from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import Product from '../models/Product.js';
import Click from '../models/Click.js';
import { qdrant, COLLECTION_NAME } from '../config/qdrant.js';
import { embedText } from '../services/embedding.js';
import { randomUUID } from 'crypto';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, q, seller } = req.query;
    let query = {};
    if (category && String(category).trim()) {
      query.category = new RegExp(String(category).trim(), 'i');
    }
    if (seller && String(seller).trim()) {
      query.userId = String(seller).trim();
    }
    let products = await Product.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    if (q && String(q).trim()) {
      const searchTerm = String(q).trim();
      const textLower = searchTerm.toLowerCase();
      let byText = products.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(textLower)) ||
          (p.description && p.description.toLowerCase().includes(textLower)) ||
          (p.category && p.category.toLowerCase().includes(textLower)) ||
          (p.userId && (p.userId.name || '').toLowerCase().includes(textLower)) ||
          (p.userId && (p.userId.email || '').toLowerCase().includes(textLower))
      );
      try {
        const { searchProductsByQuery } = await import('../services/chat.js');
        const semantic = await searchProductsByQuery(searchTerm, 50);
        const semanticIds = new Set(semantic.map((p) => String(p._id)));
        byText = products.filter(
          (p) =>
            semanticIds.has(String(p._id)) ||
            (p.name && p.name.toLowerCase().includes(textLower)) ||
            (p.description && p.description.toLowerCase().includes(textLower)) ||
            (p.category && p.category.toLowerCase().includes(textLower)) ||
            (p.userId && (p.userId.name || '').toLowerCase().includes(textLower)) ||
            (p.userId && (p.userId.email || '').toLowerCase().includes(textLower))
        );
        const orderMap = new Map(semantic.map((p, i) => [String(p._id), i]));
        if (byText.length > 0) {
          byText.sort((a, b) => (orderMap.get(String(a._id)) ?? 999) - (orderMap.get(String(b._id)) ?? 999));
        }
      } catch (_) {
        /* semantic search failed; byText already has text-matched results */
      }
      if (byText.length > 0) products = byText;
    }
    res.json(products);
  } catch (err) {
    console.error('Products list error:', err);
    res.status(200).json([]);
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, price, imageUrl, link } = req.body;
    if (!name || !description || price == null) {
      return res.status(400).json({ error: 'Name, description, and price required' });
    }
    const textForEmbedding = [name, description, category].filter(Boolean).join(' ');
    const vector = await embedText(textForEmbedding);
    const qdrantId = randomUUID();
    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: qdrantId,
          vector,
          payload: { productId: '' },
        },
      ],
    });
    const product = await Product.create({
      userId: req.user._id,
      name,
      description,
      category: category || '',
      price: Number(price),
      imageUrl: imageUrl || '',
      link: link || '',
      qdrantId,
    });
    await qdrant.setPayload(COLLECTION_NAME, {
      wait: true,
      points: [qdrantId],
      payload: { productId: String(product._id) },
    });
    const doc = product.toObject();
    res.status(201).json(doc);
  } catch (err) {
    console.error('Product create error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/click', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await Click.create({
      productId: product._id,
      userId: req.user?._id || undefined,
      source: 'market',
    });
    res.json({ recorded: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.qdrantId) {
      await qdrant.delete(COLLECTION_NAME, {
        points: [product.qdrantId],
      });
    }
    await Product.deleteOne({ _id: product._id });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
