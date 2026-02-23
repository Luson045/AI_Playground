import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import Rating from '../models/Rating.js';

const router = express.Router();

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { star, comment, source, sessionId } = req.body || {};
    const starValue = Number(star);
    if (!Number.isFinite(starValue) || starValue < 0 || starValue > 5) {
      return res.status(400).json({ error: 'star must be a number between 0 and 5' });
    }
    const doc = await Rating.create({
      star: starValue,
      comment: typeof comment === 'string' ? comment.trim() : '',
      source: typeof source === 'string' && source.trim() ? source.trim() : 'popup',
      sessionId: typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : undefined,
      userId: req.user?._id || undefined,
      userEmail: req.user?.email || undefined,
    });
    res.status(201).json({ id: doc._id });
  } catch (err) {
    console.error('Rating create error:', err);
    res.status(200).json({ ok: false });
  }
});

export default router;
