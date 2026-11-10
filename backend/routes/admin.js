import { Router } from 'express'; import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js'; import { auth, vendorAuth, wrap } from '../middleware/auth.js'; import { logAction } from '../utils/log.js'; import { Order, Customer, Shop } from '../models/index.js';
const r = Router();
r.post('/login', wrap(async (q, s) => {
  const a = await Admin.findOne({ email: (q.body.email || '').toLowerCase().trim() });
  if (!a || !(await bcrypt.compare(q.body.password || '', a.password))) return s.status(401).json({ error: 'Wrong email or password' });
  if (a.role === 'vendor') { // shop owner: only works while their shop exists and is active
    const shop = a.shopId && await Shop.findById(a.shopId); if (!shop) return s.status(403).json({ error: 'Your shop no longer exists' }); if (!shop.active) return s.status(403).json({ error: 'This shop account is disabled. Please contact the platform admin.' });
    return s.json({ token: jwt.sign({ id: a._id, role: 'vendor', shopId: String(shop._id) }, process.env.JWT_SECRET, { expiresIn: '7d' }), email: a.email, role: 'vendor', shopName: shop.name });
  }
  s.json({ token: jwt.sign({ id: a._id }, process.env.JWT_SECRET, { expiresIn: '7d' }), email: a.email, role: 'admin' });
}));
r.get('/me', vendorAuth, wrap(async (q, s) => s.json({ email: (await Admin.findById(q.admin.id)).email, role: q.role, shopName: q.vendor?.shopName || '' })));
r.put('/account', auth, wrap(async (q, s) => {
  const { currentPassword, email, newPassword } = q.body; const a = await Admin.findById(q.admin.id);
  if (!(await bcrypt.compare(currentPassword || '', a.password))) return s.status(400).json({ error: 'Current password is wrong' });
  if (email) a.email = email.toLowerCase().trim();
  if (newPassword) { if (newPassword.length < 8) return s.status(400).json({ error: 'New password needs 8+ characters' }); a.password = await bcrypt.hash(newPassword, 10); }
  const was = a.email; await a.save(); await logAction(q, { entity: 'Account', summary: 'Updated admin account' + (newPassword ? ' (password changed)' : ''), changes: was !== a.email ? [{ field: 'email', from: was, to: a.email }] : [] }); s.json({ email: a.email });
}));

// Dashboard numbers. Cancelled orders are not counted as money earned.
r.get('/stats', auth, wrap(async (q, s) => {
  const range = ['today', '7d', '30d', 'all'].includes(q.query.range) ? q.query.range : '30d', days = { today: 1, '7d': 7, '30d': 30 }[range], TZ = 'Asia/Karachi', DAY = 864e5;
  let from = null; if (days) { const k = new Date(Date.now() + 5 * 36e5); k.setUTCHours(0, 0, 0, 0); from = new Date(k.getTime() - 5 * 36e5 - (days - 1) * DAY); } // Pakistan has no daylight saving (UTC+5)
  const all = from ? { createdAt: { $gte: from } } : {}, live = { ...all, status: { $ne: 'Cancelled' } }, n0 = x => ({ $ifNull: [x, 0] }), del = { $eq: ['$status', 'Delivered'] };
  const [tot, byStatus, daily, top, pay, customers, newCustomers] = await Promise.all([
    Order.aggregate([{ $match: live }, { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: n0('$total') }, delivery: { $sum: n0('$delivery') }, goods: { $sum: n0('$subtotal') },
      dOrders: { $sum: { $cond: [del, 1, 0] } }, dRevenue: { $sum: { $cond: [del, n0('$total'), 0] } }, dDelivery: { $sum: { $cond: [del, n0('$delivery'), 0] } } } }]),
    Order.aggregate([{ $match: all }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: live }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, orders: { $sum: 1 }, revenue: { $sum: n0('$total') }, delivery: { $sum: n0('$delivery') } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([{ $match: live }, { $unwind: '$items' }, { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, money: { $sum: { $multiply: [n0('$items.price'), n0('$items.qty')] } } } }, { $sort: { qty: -1 } }, { $limit: 5 }]),
    Order.aggregate([{ $match: live }, { $group: { _id: { $ifNull: ['$paymentMethod', 'cod'] }, count: { $sum: 1 }, total: { $sum: n0('$total') }, paid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } } } }]),
    Customer.countDocuments(), Customer.countDocuments(all),
  ]);
  const map = Object.fromEntries(daily.map(d => [d._id, d])), series = [];
  if (days) for (let i = 0; i < days; i++) { const day = new Date(from.getTime() + i * DAY + 5 * 36e5).toISOString().slice(0, 10), d = map[day]; series.push({ day, orders: d?.orders || 0, revenue: d?.revenue || 0, delivery: d?.delivery || 0 }); }
  else daily.slice(-60).forEach(d => series.push({ day: d._id, orders: d.orders, revenue: d.revenue, delivery: d.delivery }));
  const T = tot[0] || {}, st = Object.fromEntries(byStatus.map(x => [x._id || 'New', x.count]));
  s.json({ range, orders: T.orders || 0, revenue: T.revenue || 0, delivery: T.delivery || 0, goods: T.goods || 0, delivered: { orders: T.dOrders || 0, revenue: T.dRevenue || 0, delivery: T.dDelivery || 0 },
    avgOrder: T.orders ? Math.round(T.revenue / T.orders) : 0, status: st, totalOrders: Object.values(st).reduce((a, b) => a + b, 0), series, topProducts: top.map(x => ({ name: x._id, qty: x.qty, money: x.money })),
    payments: pay.map(x => ({ method: x._id, count: x.count, total: x.total, paid: x.paid })), customers, newCustomers });
}));
export default r;
