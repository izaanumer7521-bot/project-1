import { Router } from 'express'; import mongoose from 'mongoose'; import { Order } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js';
const r = Router();
r.post('/', wrap(async (q, s) => {
  const { name, phone, address, items } = q.body;
  if (!name || !phone || !address || !items?.length) return s.status(400).json({ error: 'Name, phone, address and items are required' });
  s.json(await Order.create({ ...q.body, total: items.reduce((t, i) => t + i.price * i.qty, 0) }));
}));
r.get('/', auth, wrap(async (q, s) => s.json(await Order.find().sort({ createdAt: -1 }))));
r.put('/:id', auth, wrap(async (q, s) => s.json(await Order.findByIdAndUpdate(q.params.id, { status: q.body.status }, { new: true }))));
r.delete('/:id', auth, wrap(async (q, s) => { await Order.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));
r.post('/lookup', wrap(async (q, s) => {
  const ids = (q.body.ids || []).filter(i => mongoose.isValidObjectId(i)).slice(0, 30);
  s.json(await Order.find({ _id: { $in: ids } }).sort({ createdAt: -1 }));
}));
export default r;
