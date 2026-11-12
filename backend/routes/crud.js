import { Router } from 'express'; import { auth, wrap } from '../middleware/auth.js'; import { diff, logAction } from '../utils/log.js'; import { liteImage, PUBLIC_CACHE } from '../utils/lite.js';
export default (M, sort = { createdAt: -1 }, entity = 'Item') => {
  const r = Router(), label = d => d?.name || d?.title || String(d?._id).slice(-5);
  // ?lite=1 is used by the customer website: pictures become cacheable links and the answer is cached for a few seconds. The admin panel still gets the full data.
  r.get('/', wrap(async (q, s) => { if (q.query.lite) { s.set('Cache-Control', PUBLIC_CACHE); return s.json((await M.find().sort(sort).lean()).map(d => liteImage(entity.toLowerCase(), d))); } s.json(await M.find().sort(sort)); }));
  r.post('/', auth, wrap(async (q, s) => { const d = await M.create(q.body); await logAction(q, { entity, summary: `Added ${entity.toLowerCase()} "${label(d)}"` }); s.json(d); }));
  r.put('/:id', auth, wrap(async (q, s) => {
    const old = await M.findById(q.params.id), d = await M.findByIdAndUpdate(q.params.id, q.body, { new: true });
    if (old && d) { const changes = diff(old.toObject(), d.toObject(), Object.keys(q.body)); if (changes.length) await logAction(q, { entity, summary: `Edited ${entity.toLowerCase()} "${label(d)}"`, changes }); }
    s.json(d);
  }));
  r.delete('/:id', auth, wrap(async (q, s) => { const d = await M.findByIdAndDelete(q.params.id); if (d) await logAction(q, { entity, summary: `Deleted ${entity.toLowerCase()} "${label(d)}"` }); s.json({ ok: true }); }));
  return r;
};
