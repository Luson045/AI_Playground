import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Product from '../models/Product.js';
import Click from '../models/Click.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).lean();
    const productIds = products.map((p) => p._id);
    const clicks = await Click.find({ productId: { $in: productIds } })
      .sort({ createdAt: -1 })
      .lean();
    const byProduct = {};
    for (const p of products) {
      byProduct[p._id] = {
        _id: p._id,
        name: p.name,
        totalClicks: 0,
        fromChat: 0,
        fromMarket: 0,
        recentClicks: [],
      };
    }
    for (const c of clicks) {
      const key = String(c.productId);
      if (byProduct[key]) {
        byProduct[key].totalClicks += 1;
        if (c.source === 'chat') byProduct[key].fromChat += 1;
        else if (c.source === 'market') byProduct[key].fromMarket += 1;
        if (byProduct[key].recentClicks.length < 10) {
          byProduct[key].recentClicks.push({
            source: c.source,
            createdAt: c.createdAt,
          });
        }
      }
    }
    const summary = {
      totalProducts: products.length,
      totalClicks: clicks.length,
      byProduct: Object.values(byProduct),
    };
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
