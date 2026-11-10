import { api } from './api.js';
// Browser side of Web Push: ask permission, create this phone's PushSubscription, send it to the server.
const key64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const getSub = async () => { const reg = await navigator.serviceWorker.getRegistration('/'); return reg ? reg.pushManager.getSubscription() : null; };

// 'unsupported' | 'denied' | 'default' (not enabled yet) | 'on'
export async function pushState() {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted') { const sub = await getSub().catch(() => null); if (sub) { api('push/subscribe', 'POST', sub.toJSON()).catch(() => {}); return 'on'; } }
  return 'default';
}
export async function enablePush() {
  if (!pushSupported()) throw new Error('This browser cannot receive push notifications. On iPhone, add this site to your Home Screen first and open it from there.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications are blocked. Allow notifications for this site in your browser settings, then try again.');
  const reg = await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready;
  const { key } = await api('push/public-key'); if (!key) throw new Error('The server has no VAPID keys yet. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel, then redeploy.');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key64(key) });
  await api('push/subscribe', 'POST', sub.toJSON()); return sub;
}
export async function disablePush() { const sub = await getSub(); if (sub) { await api('push/unsubscribe', 'POST', { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); } }
export const testPush = () => api('push/test', 'POST');
