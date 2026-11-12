// Web Push (VAPID). One new order -> ONE lock-screen alert for the platform admin AND one for each shop owner whose products are in the order.
import * as webpush from 'web-push'; import mongoose from 'mongoose'; import { AdminSubscription, Shop } from '../models/index.js';
let ready;
const init = () => {
  if (ready !== undefined) return ready; const pub = (process.env.VAPID_PUBLIC_KEY || '').trim(), priv = (process.env.VAPID_PRIVATE_KEY || '').trim();
  if (pub && priv) { webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@bydoor.com', pub, priv); ready = true; } else ready = false; return ready;
};
const money = n => 'Rs ' + Number(n || 0).toLocaleString('en-US');
// jobs = [{ sub, payload }]. Everything is sent in parallel (fast enough for Vercel). Dead phones (404/410) are removed. Never throws.
async function deliver(jobs) {
  if (!jobs.length) return { sent: 0, failed: 0, removed: 0, devices: 0 };
  if (!init()) return { sent: 0, failed: 0, removed: 0, devices: jobs.length, reason: 'VAPID keys are not set on the server' };
  const res = await Promise.allSettled(jobs.map(j => webpush.sendNotification({ endpoint: j.sub.endpoint, keys: { p256dh: j.sub.keys?.p256dh, auth: j.sub.keys?.auth } }, JSON.stringify(j.payload), { TTL: 86400, urgency: 'high', timeout: 6000 })));
  const dead = []; let sent = 0;
  res.forEach((r, i) => { if (r.status === 'fulfilled') sent++; else if ([404, 410].includes(r.reason?.statusCode)) dead.push(jobs[i].sub._id); else console.error('Push failed:', r.reason?.statusCode, r.reason?.body || r.reason?.message); });
  if (dead.length) await AdminSubscription.deleteMany({ _id: { $in: dead } });
  return { sent, failed: jobs.length - sent - dead.length, removed: dead.length, devices: jobs.length };
}
// "Send test alert" button: only the devices that match the filter (the logged-in person's own phones)
export const sendTest = async filter => deliver((await AdminSubscription.find(filter)).map(sub => ({ sub, payload: { title: '🛒 Test notification', body: 'Order alerts are working on this phone.', orderId: 'TEST', total: 0, url: '/bd-admin' } })));
// Called right after a customer order is saved (cancelled = true when the customer cancels it: the same admin + shop owners get a cancel alert).
export async function notifyOrder(o, cancelled = false) {
  try {
    const code = String(o._id).slice(-5).toUpperCase(), items = o.items || [];
    // shops that own at least one ordered item (and are still active)
    const ids = [...new Set(items.map(i => i.shopId).filter(id => id && mongoose.isValidObjectId(id)))];
    const live = ids.length ? (await Shop.find({ _id: { $in: ids }, active: true }).select('_id')).map(x => String(x._id)) : [];
    // admin devices (role 'admin', or older devices saved before roles existed) + devices of the shops in this order
    const subs = await AdminSubscription.find({ $or: [{ role: { $ne: 'vendor' } }, ...(live.length ? [{ shopId: { $in: live } }] : [])] });
    const rx = o.kind === 'prescription', head = cancelled ? `❌ Order #${code} cancelled` : rx ? `💊 New prescription #${code}` : `🛒 New order #${code}`, toAdmin = { title: head, body: cancelled ? `${o.name} cancelled the order · ${money(o.total)}` : rx ? `${o.name} · ${o.rxMode === 'photo' ? 'Prescription photo' : (o.medicines || []).length + ' medicine(s) typed'} · price to confirm` : `${o.name} · ${money(o.total)} · ${o.paymentMethod === 'advance' ? 'Advance payment' : 'Cash on Delivery'}`, orderId: code, total: o.total, url: '/bd-admin' };
    const toShop = {}; // each shop only sees ITS OWN items (no customer phone or address)
    for (const id of live) { const mine = items.filter(i => i.shopId === id), sum = mine.reduce((x, i) => x + i.price * i.qty, 0); toShop[id] = { title: head, body: (mine.map(i => `${i.name} ×${i.qty}`).join(', ') + (rx ? ' · price to confirm' : ' · ' + money(sum)) + (cancelled ? ' · cancelled by customer' : '')).slice(0, 180), orderId: code, total: sum, url: '/bd-admin' }; }
    return await deliver(subs.map(sub => ({ sub, payload: sub.role === 'vendor' ? toShop[sub.shopId] : toAdmin })).filter(j => j.payload));
  } catch (e) { console.error('Push error:', e.message); return { sent: 0, reason: e.message }; }
}
