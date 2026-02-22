import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Message from '../models/Message.js';

const router = express.Router();

/** Get inbox (received) and sent messages */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [inbox, sent] = await Promise.all([
      Message.find({ to: req.user._id })
        .populate('from', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
      Message.find({ from: req.user._id })
        .populate('to', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
    ]);
    res.json({ inbox, sent });
  } catch (err) {
    console.error('Messages list error:', err);
    res.status(200).json({ inbox: [], sent: [] });
  }
});

/** Send a message */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !body || typeof body !== 'string') {
      return res.status(400).json({ error: 'Recipient and message body required' });
    }
    const msg = await Message.create({
      from: req.user._id,
      to,
      subject: subject || '',
      body: body.trim(),
    });
    const populated = await Message.findById(msg._id)
      .populate('from', 'name email')
      .populate('to', 'name email')
      .lean();
    res.status(201).json(populated);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(200).json({ error: 'Failed to send message' });
  }
});

/** Mark message as read */
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findOne({
      _id: req.params.id,
      to: req.user._id,
    });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    msg.readAt = msg.readAt || new Date();
    await msg.save();
    res.json({ read: true });
  } catch (err) {
    res.status(200).json({ read: false });
  }
});

export default router;
