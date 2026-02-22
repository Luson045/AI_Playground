import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri || typeof uri !== 'string') {
    throw new Error('MONGODB_URI is required. Copy backend/.env.example to backend/.env and set your MongoDB URL.');
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}
