// Activity log: records who changed what in the admin panel. Never throws (a log failure must not block the real action).
import { Admin, Log } from '../models/index.js';
const SKIP = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'password', 'notified', 'notifyError']);
const norm = v => { if (v == null || v === '') return ''; return JSON.stringify(v, (k, x) => (k === '_id' ? undefined : x)); };
const one = x => x && typeof x === 'object' ? (x.name != null && x.qty != null ? `${x.name} ×${x.qty} @ Rs ${x.price}` : Object.entries(x).filter(([k, y]) => k !== '_id' && y !== '' && y != null).map(([, y]) => y).join(' · ')) : String(x);
export const show = v => {
  if (v == null || v === '') return '—'; if (typeof v === 'string' && v.startsWith('data:image')) return '[photo]';
  const t = Array.isArray(v) ? (v.length ? v.map(one).join(' | ') : '—') : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v);
  return t.length > 220 ? t.slice(0, 217) + '…' : t;
};
// Compare the old document with the new values for the given keys -> [{field, from, to}]
export const diff = (before, after, keys = Object.keys(after || {})) => keys.filter(k => !SKIP.has(k) && norm(before?.[k]) !== norm(after?.[k])).map(field => ({ field, from: show(before?.[field]), to: show(after?.[field]) }));
export async function logAction(q, { entity, summary, changes = [] }) {
  try { let actor = 'Admin'; if (q?.admin?.id) actor = (await Admin.findById(q.admin.id))?.email || actor; else if (q?.actor) actor = q.actor; await Log.create({ actor, entity, summary, changes }); }
  catch (e) { console.error('Log failed:', e.message); }
}
