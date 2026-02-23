import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    star: { type: Number, required: true, min: 0, max: 5 },
    comment: { type: String, trim: true, default: '' },
    source: { type: String, trim: true, default: 'popup' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String, trim: true, lowercase: true },
    sessionId: { type: String, trim: true },
  },
  { timestamps: true }
);

ratingSchema.index({ createdAt: -1 });
ratingSchema.index({ userId: 1, createdAt: -1 });
ratingSchema.index({ source: 1, createdAt: -1 });

export default mongoose.model('Rating', ratingSchema);
