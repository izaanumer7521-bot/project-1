import { Router } from 'express'; import mongoose from 'mongoose'; import { Order, Product, Setting } from '../models/index.js'; import { notifyOwner } from '../utils/whatsapp.js'; import { auth, wrap } from '../middleware/auth.js';
const r = Router();
r.post('/', wrap(async (q, s) => {
  const t = (v, n) => String(v ?? '').trim().slice(0, n), { items } = q.body, name = t(q.body.name, 100), phone = t(q.body.phone, 20), address = t(q.body.address, 400), note = t(q.body.note, 300);
  if (!name || !phone || !address || !Array.isArray(items) || !items.length) return s.status(400).json({ error: 'Name, phone, address and items are required' });
  // Prices always come from the database, never from the browser
  const prods = await Product.find({ _id: { $in: items.map(i => i?._id).filter(id => mongoose.isValidObjectId(id)) } }), by = Object.fromEntries(prods.map(p => [String(p._id), p])), lines = [];
  for (const i of items) {
    const p = by[String(i?._id)], qty = Math.floor(Number(i?.qty));
    if (!p || p.available === false) return s.status(400).json({ error: `"${i?.name || 'An item'}" is no longer available. Please remove it from your cart.` });
    if (!(qty >= 1 && qty <= 99)) return s.status(400).json({ error: 'Invalid quantity for ' + p.name });
    lines.push({ name: p.name, price: p.price, qty });
  }
  const subtotal = lines.reduce((x, i) => x + i.price * i.qty, 0), fee = Number((await Setting.findOne())?.deliveryFee ?? 100), delivery = Number.isFinite(fee) && fee >= 0 ? fee : 100;
  const lat = Number(q.body.lat), lng = Number(q.body.lng), geo = Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng) ? { lat, lng } : {};
  const order = await Order.create({ name, phone, address, note, items: lines, subtotal, delivery, total: subtotal + delivery, ...geo });
  const notified = await notifyOwner(order); // awaited so it also works on Vercel serverless
  s.json({ ...order.toObject(), notified });
}));
r.get('/', auth, wrap(async (q, s) => s.json(await Order.find().sort({ createdAt: -1 }))));
r.put('/:id', auth, wrap(async (q, s) => s.json(await Order.findByIdAndUpdate(q.params.id, { status: q.body.status }, { new: true }))));
r.delete('/:id', auth, wrap(async (q, s) => { await Order.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));
r.post('/lookup', wrap(async (q, s) => {
  const ids = (q.body.ids || []).filter(i => mongoose.isValidObjectId(i)).slice(0, 30);
  s.json(await Order.find({ _id: { $in: ids } }).sort({ createdAt: -1 }));
}));
export default r;
