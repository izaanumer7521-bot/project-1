import { Router } from 'express'; import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js';
const r = Router();
r.post('/login', wrap(async (q, s) => {
  const a = await Admin.findOne({ email: (q.body.email || '').toLowerCase().trim() });
  if (!a || !(await bcrypt.compare(q.body.password || '', a.password))) return s.status(401).json({ error: 'Wrong email or password' });
  s.json({ token: jwt.sign({ id: a._id }, process.env.JWT_SECRET, { expiresIn: '7d' }), email: a.email });
}));
r.get('/me', auth, wrap(async (q, s) => s.json({ email: (await Admin.findById(q.admin.id)).email })));
r.put('/account', auth, wrap(async (q, s) => {
  const { currentPassword, email, newPassword } = q.body; const a = await Admin.findById(q.admin.id);
  if (!(await bcrypt.compare(currentPassword || '', a.password))) return s.status(400).json({ error: 'Current password is wrong' });
  if (email) a.email = email.toLowerCase().trim();
  if (newPassword) { if (newPassword.length < 8) return s.status(400).json({ error: 'New password needs 8+ characters' }); a.password = await bcrypt.hash(newPassword, 10); }
  await a.save(); s.json({ email: a.email });
}));
export default r;
