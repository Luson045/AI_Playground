import express from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Product from '../models/Product.js';

const router = express.Router();

/** List users for Explore (public fields only). Optionally include isFollowing for current user. */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('name email bio avatar createdAt')
      .sort({ createdAt: -1 })
      .lean();
    const productCounts = await Product.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(productCounts.map((r) => [String(r._id), r.count]));
    let followingSet = new Set();
    if (req.user) {
      const follows = await Follow.find({ followerId: req.user._id }).lean();
      followingSet = new Set(follows.map((f) => String(f.followingId)));
    }
    const list = users.map((u) => ({
      _id: u._id,
      name: u.name || u.email,
      email: u.email,
      bio: u.bio || '',
      avatar: u.avatar || '',
      productCount: countMap.get(String(u._id)) || 0,
      isFollowing: req.user ? followingSet.has(String(u._id)) : false,
    }));
    res.json(list);
  } catch (err) {
    console.error('Users list error:', err);
    res.status(200).json([]);
  }
});

/** Get one user's public profile by id */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email bio avatar createdAt')
      .lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const productCount = await Product.countDocuments({ userId: user._id });
    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({
        followerId: req.user._id,
        followingId: user._id,
      });
      isFollowing = !!follow;
    }
    res.json({
      _id: user._id,
      name: user.name || user.email,
      email: user.email,
      bio: user.bio || '',
      avatar: user.avatar || '',
      productCount,
      isFollowing,
    });
  } catch (err) {
    console.error('User profile error:', err);
    res.status(200).json({ error: 'User not found' });
  }
});

/** Follow a user */
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const followingId = req.params.id;
    if (String(followingId) === String(req.user._id)) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    const target = await User.findById(followingId);
    if (!target) return res.status(404).json({ error: 'User not found' });
    await Follow.findOneAndUpdate(
      { followerId: req.user._id, followingId },
      {},
      { upsert: true }
    );
    res.json({ followed: true });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(200).json({ followed: false });
  }
});

/** Unfollow a user */
router.delete('/:id/follow', authMiddleware, async (req, res) => {
  try {
    await Follow.deleteOne({
      followerId: req.user._id,
      followingId: req.params.id,
    });
    res.json({ unfollowed: true });
  } catch (err) {
    res.status(200).json({ unfollowed: false });
  }
});

export default router;
