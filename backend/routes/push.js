import { Router } from 'express'; import { Admin, AdminSubscription } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js'; import { sendToAdmins } from '../utils/push.js';
const r = Router();
// The public key is safe to share; the browser needs it to create a subscription
r.get('/public-key', (q, s) => s.json({ key: (process.env.VAPID_PUBLIC_KEY || '').trim() }));
// Save this phone/browser as an admin device
r.post('/subscribe', auth, wrap(async (q, s) => {
  const { endpoint, keys } = q.body || {};
  if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !keys?.p256dh || !keys?.auth) return s.status(400).json({ error: 'Invalid push subscription' });
  const adminId = String(q.admin.id), a = await Admin.findById(adminId);
  await AdminSubscription.findOneAndUpdate({ endpoint }, { adminId, email: a?.email, keys: { p256dh: String(keys.p256dh).slice(0, 200), auth: String(keys.auth).slice(0, 100) }, userAgent: String(q.headers['user-agent'] || '').slice(0, 200) }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const extra = await AdminSubscription.find({ adminId }).sort({ updatedAt: -1 }).skip(10).select('_id'); // keep the 10 newest devices
  if (extra.length) await AdminSubscription.deleteMany({ _id: { $in: extra.map(x => x._id) } });
  s.json({ ok: true });
}));
r.post('/unsubscribe', auth, wrap(async (q, s) => { await AdminSubscription.deleteOne({ endpoint: String(q.body?.endpoint || ''), adminId: String(q.admin.id) }); s.json({ ok: true }); }));
r.post('/test', auth, wrap(async (q, s) => s.json(await sendToAdmins({ title: '🛒 Test notification', body: 'Order alerts are working on this phone.', orderId: 'TEST', total: 0, url: '/bd-admin' }))));
export default r;
