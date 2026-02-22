import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, trim: true },
    link: { type: String, trim: true },
    qdrantId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
