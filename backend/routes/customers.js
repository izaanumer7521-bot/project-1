import { Router } from 'express'; import { Customer } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js';
const r = Router();
const norm = p => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('92')) d = d.slice(2); if (d.startsWith('0')) d = d.slice(1); return /^3\d{9}$/.test(d) ? '0' + d : null; };
r.post('/signup', wrap(async (q, s) => {
  const phone = norm(q.body.phone); if (!phone) return s.status(400).json({ error: 'Enter a valid mobile number, e.g. 03xx xxxxxxx' });
  await Customer.findOneAndUpdate({ phone }, { phone }, { upsert: true }); s.json({ phone });
}));
r.post('/login', wrap(async (q, s) => {
  const phone = norm(q.body.phone); if (!phone) return s.status(400).json({ error: 'Enter a valid mobile number, e.g. 03xx xxxxxxx' });
  if (!(await Customer.findOne({ phone }))) return s.status(404).json({ error: 'No account found for this number. Please sign up first.' });
  s.json({ phone });
}));
r.get('/', auth, wrap(async (q, s) => s.json(await Customer.find().sort({ createdAt: -1 }))));
export default r;
