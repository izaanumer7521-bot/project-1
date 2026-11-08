import mongoose from 'mongoose';
// Cached connection: reused between requests on Vercel serverless
let cached = global._bd || (global._bd = { conn: null });
export default async () => {
  if (!cached.conn) cached.conn = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  await cached.conn; return mongoose;
};
