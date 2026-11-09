import { Router } from 'express'; import jwt from 'jsonwebtoken'; import { Customer } from '../models/index.js'; import { auth, customerAuth, wrap } from '../middleware/auth.js';
const r = Router();
const norm = p => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('92')) d = d.slice(2); if (d.startsWith('0')) d = d.slice(1); return /^3\d{9}$/.test(d) ? '0' + d : null; };
const token = c => jwt.sign({ id: c._id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '90d' });
const pub = c => ({ phone: c.phone, firstName: c.firstName || '', lastName: c.lastName || '', email: c.email || '', street: c.street || '', lat: c.lat ?? null, lng: c.lng ?? null, defaultAddress: !!c.defaultAddress });

r.post('/signup', wrap(async (q, s) => {
  const phone = norm(q.body.phone); if (!phone) return s.status(400).json({ error: 'Enter a valid mobile number, e.g. 03xx xxxxxxx' });
  const c = await Customer.findOneAndUpdate({ phone }, { phone }, { upsert: true, new: true, setDefaultsOnInsert: true }); s.json({ phone, token: token(c) });
}));
r.post('/login', wrap(async (q, s) => {
  const phone = norm(q.body.phone); if (!phone) return s.status(400).json({ error: 'Enter a valid mobile number, e.g. 03xx xxxxxxx' });
  const c = await Customer.findOne({ phone }); if (!c) return s.status(404).json({ error: 'No account found for this number. Please sign up first.' });
  s.json({ phone, token: token(c) });
}));

// The signed-in customer's own profile
r.get('/me', customerAuth, wrap(async (q, s) => {
  const c = await Customer.findById(q.customer.id); if (!c) return s.status(401).json({ error: 'Please sign in again' }); s.json(pub(c));
}));
r.put('/me', customerAuth, wrap(async (q, s) => {
  const b = q.body, t = v => String(v ?? '').trim();
  const firstName = t(b.firstName), lastName = t(b.lastName), email = t(b.email).toLowerCase(), street = t(b.street), lat = Number(b.lat), lng = Number(b.lng);
  if (!firstName || !lastName) return s.status(400).json({ error: 'First name and last name are required' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return s.status(400).json({ error: 'Enter a valid email address or leave it empty' });
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (!lat && !lng)) return s.status(400).json({ error: 'Please pin your delivery location' });
  if (!street) return s.status(400).json({ error: 'Street address is required' });
  const c = await Customer.findByIdAndUpdate(q.customer.id, { firstName, lastName, name: firstName + ' ' + lastName, email, street, lat, lng, defaultAddress: !!b.defaultAddress }, { new: true });
  if (!c) return s.status(401).json({ error: 'Please sign in again' }); s.json(pub(c));
}));

r.get('/', auth, wrap(async (q, s) => s.json(await Customer.find().sort({ createdAt: -1 }))));
export default r;
