import app from '../backend/app.js';
import connectDB from '../backend/config/db.js';
import seed from '../backend/utils/seed.js';

let ready;
export default async function handler(req, res) {
  try { ready ||= connectDB().then(seed); await ready; }
  catch (e) {
    ready = null;
    const seen = (process.env.MONGO_URI || 'MISSING').replace(/\/\/([^:]+):[^@]*@/, '//$1:***@');
    return res.status(500).json({ error: 'Database connection failed: ' + e.message, usingLink: seen });
  }
  return app(req, res);
}
