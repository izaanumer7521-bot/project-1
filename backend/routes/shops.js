// Platform admin only: create and manage vendor shops and their logins
import { Router } from 'express'; import bcrypt from 'bcryptjs'; import mongoose from 'mongoose';
import { Admin, Shop, Product, AdminSubscription } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js'; import { logAction } from '../utils/log.js';
const r = Router(), bad = (s, m, c = 400) => s.status(c).json({ error: m }), t = (v, n) => String(v ?? '').trim().slice(0, n), okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), img = v => { v = String(v || ''); return v.length <= 900000 && (v.startsWith('data:image/') || /^https?:\/\//.test(v)) ? v : ''; };
// Public: active vendor shops for the customer home page (no login, no private fields)
r.get('/public', wrap(async (q, s) => { const [shops, counts] = await Promise.all([Shop.find({ active: { $ne: false } }).sort({ createdAt: -1 }), Product.aggregate([{ $match: { shopId: { $ne: '' }, available: { $ne: false } } }, { $group: { _id: '$shopId', n: { $sum: 1 } } }])]); const cnt = Object.fromEntries(counts.map(c => [c._id, c.n])); s.json(shops.map(x => ({ _id: x._id, name: x.name, phone: x.phone || '', image: x.image || '', medical: !!x.medical, products: cnt[String(x._id)] || 0 }))); }));
r.get('/', auth, wrap(async (q, s) => {
  const [shops, vendors, counts] = await Promise.all([Shop.find().sort({ createdAt: -1 }), Admin.find({ role: 'vendor' }), Product.aggregate([{ $match: { shopId: { $ne: '' } } }, { $group: { _id: '$shopId', n: { $sum: 1 } } }])]);
  const cnt = Object.fromEntries(counts.map(c => [c._id, c.n]));
  s.json(shops.map(x => ({ _id: x._id, name: x.name, phone: x.phone || '', image: x.image || '', medical: !!x.medical, active: x.active !== false, email: vendors.find(v => v.shopId === String(x._id))?.email || '', products: cnt[String(x._id)] || 0, createdAt: x.createdAt })));
}));
r.post('/', auth, wrap(async (q, s) => {
  const name = t(q.body.name, 100), phone = t(q.body.phone, 30), email = t(q.body.email, 120).toLowerCase(), password = String(q.body.password || '');
  if (!name) return bad(s, 'Shop name is required'); if (!okEmail(email)) return bad(s, 'Enter a valid vendor login email'); if (password.length < 8) return bad(s, 'Password needs 8+ characters');
  if (await Admin.findOne({ email })) return bad(s, 'That email is already used by another account');
  const shop = await Shop.create({ name, phone, image: img(q.body.image), medical: !!q.body.medical, active: true });
  try { await Admin.create({ email, password: await bcrypt.hash(password, 10), role: 'vendor', shopId: String(shop._id) }); } catch (e) { await Shop.findByIdAndDelete(shop._id); throw e; }
  await logAction(q, { entity: 'Vendor', summary: `Created vendor shop "${name}" (login: ${email})` }); s.json({ ok: true, _id: shop._id });
}));
r.put('/:id', auth, wrap(async (q, s) => {
  if (!mongoose.isValidObjectId(q.params.id)) return bad(s, 'Shop not found', 404);
  const shop = await Shop.findById(q.params.id); if (!shop) return bad(s, 'Shop not found', 404);
  const v = await Admin.findOne({ role: 'vendor', shopId: String(shop._id) }), b = q.body, changes = [], ch = (field, from, to) => from !== to && changes.push({ field, from: String(from ?? '—'), to: String(to ?? '—') });
  if ('name' in b) { const n = t(b.name, 100); if (!n) return bad(s, 'Shop name is required'); ch('shop name', shop.name, n); shop.name = n; }
  if ('phone' in b) { ch('phone', shop.phone || '', t(b.phone, 30)); shop.phone = t(b.phone, 30); }
  if ('image' in b) { const im = img(b.image); if ((shop.image || '') !== im) changes.push({ field: 'store picture', from: shop.image ? '[photo]' : '—', to: im ? '[photo]' : '—' }); shop.image = im; }
  if ('medical' in b) { ch('medical store (prescription orders)', shop.medical ? 'Yes' : 'No', b.medical ? 'Yes' : 'No'); shop.medical = !!b.medical; }
  if ('active' in b) { ch('active', shop.active !== false ? 'Yes' : 'No', b.active ? 'Yes' : 'No'); shop.active = !!b.active; }
  if (v && 'email' in b) { const e = t(b.email, 120).toLowerCase(); if (!okEmail(e)) return bad(s, 'Enter a valid vendor login email'); if (e !== v.email) { const clash = await Admin.findOne({ email: e, _id: { $ne: v._id } }); if (clash) return bad(s, 'That email is already used by another account'); ch('login email', v.email, e); v.email = e; } }
  if (v && b.password) { if (String(b.password).length < 8) return bad(s, 'Password needs 8+ characters'); v.password = await bcrypt.hash(String(b.password), 10); changes.push({ field: 'password', from: '—', to: 'reset' }); }
  await shop.save(); if (v) await v.save();
  if (changes.length) await logAction(q, { entity: 'Vendor', summary: `Edited vendor shop "${shop.name}"`, changes }); s.json({ ok: true });
}));
// Deleting a vendor removes the shop, the login and their phones. Their products stay in the database but are switched to "out of stock".
r.delete('/:id', auth, wrap(async (q, s) => {
  if (!mongoose.isValidObjectId(q.params.id)) return bad(s, 'Shop not found', 404);
  const shop = await Shop.findByIdAndDelete(q.params.id); if (!shop) return bad(s, 'Shop not found', 404); const id = String(shop._id);
  await Promise.all([Admin.deleteMany({ role: 'vendor', shopId: id }), AdminSubscription.deleteMany({ shopId: id }), Product.updateMany({ shopId: id }, { $set: { available: false } })]);
  await logAction(q, { entity: 'Vendor', summary: `Deleted vendor shop "${shop.name}" (its products were set out of stock)` }); s.json({ ok: true });
}));
export default r;
