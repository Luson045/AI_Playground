import express from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import Product from '../models/Product.js';
import Click from '../models/Click.js';
import User from '../models/User.js';
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
    if (q && String(q).trim()) {
      const searchTerm = String(q).trim();
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const users = await User.find({
        $or: [{ name: regex }, { email: regex }],
      }).select('_id');
      const userIds = users.map((u) => u._id);
      query.$or = [
        { name: regex },
        { description: regex },
        { category: regex },
        ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
      ];
    }
    const products = await Product.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
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
    const sellerLocation = (req.user?.location || '').trim();
    const textForEmbedding = [name, description, category].filter(Boolean).join(' ');
    const vector = await embedText(textForEmbedding);
    let locationEmbedding = [];
    if (sellerLocation) {
      try {
        locationEmbedding = await embedText(sellerLocation);
      } catch (_) {
        locationEmbedding = [];
      }
    }
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
      location: sellerLocation,
      locationEmbedding,
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
