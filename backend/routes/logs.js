import { Router } from 'express'; import { Log } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js';
const r = Router();
// Newest first. ?entity=Order  ?page=1 (50 per page)
r.get('/', auth, wrap(async (q, s) => {
  const page = Math.max(1, parseInt(q.query.page) || 1), per = 50, filter = q.query.entity ? { entity: String(q.query.entity) } : {};
  const [rows, total] = await Promise.all([Log.find(filter).sort({ createdAt: -1 }).skip((page - 1) * per).limit(per), Log.countDocuments(filter)]);
  s.json({ rows, total, page, pages: Math.max(1, Math.ceil(total / per)) });
}));
export default r;
