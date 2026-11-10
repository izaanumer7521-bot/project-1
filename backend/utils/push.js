// Web Push (VAPID): wakes the admin's phone when a new order arrives, even if the browser is closed.
import * as webpush from 'web-push'; import { AdminSubscription } from '../models/index.js';
let ready;
const init = () => {
  if (ready !== undefined) return ready; const pub = (process.env.VAPID_PUBLIC_KEY || '').trim(), priv = (process.env.VAPID_PRIVATE_KEY || '').trim();
  if (pub && priv) { webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@bydoor.com', pub, priv); ready = true; } else ready = false; return ready;
};
// Sends one payload to every saved admin device. Dead devices (404/410) are removed. Never throws.
export async function sendToAdmins(payload) {
  if (!init()) return { sent: 0, failed: 0, removed: 0, reason: 'VAPID keys are not set on the server' };
  const subs = await AdminSubscription.find(), body = JSON.stringify(payload);
  const res = await Promise.allSettled(subs.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.keys?.p256dh, auth: s.keys?.auth } }, body, { TTL: 86400, urgency: 'high', timeout: 6000 })));
  const dead = []; let sent = 0;
  res.forEach((r, i) => { if (r.status === 'fulfilled') sent++; else if ([404, 410].includes(r.reason?.statusCode)) dead.push(subs[i]._id); else console.error('Push failed:', r.reason?.statusCode, r.reason?.body || r.reason?.message); });
  if (dead.length) await AdminSubscription.deleteMany({ _id: { $in: dead } });
  return { sent, failed: subs.length - sent - dead.length, removed: dead.length, devices: subs.length };
}
export const notifyAdmins = async o => {
  try { const code = String(o._id).slice(-5).toUpperCase();
    return await sendToAdmins({ title: `🛒 New order #${code}`, body: `${o.name} · Rs ${Number(o.total || 0).toLocaleString('en-US')} · ${o.paymentMethod === 'advance' ? 'Advance payment' : 'Cash on Delivery'}`, orderId: code, total: o.total, url: '/bd-admin' });
  } catch (e) { console.error('Push error:', e.message); return { sent: 0, reason: e.message }; }
};
