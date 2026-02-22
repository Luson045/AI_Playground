import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, enum: ['chat', 'market'], default: 'chat' },
    sessionId: { type: String },
  },
  { timestamps: true }
);

clickSchema.index({ productId: 1, createdAt: -1 });
clickSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Click', clickSchema);
