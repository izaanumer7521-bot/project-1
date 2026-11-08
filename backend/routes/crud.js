import { Router } from 'express'; import { auth, wrap } from '../middleware/auth.js';
export default M => {
  const r = Router();
  r.get('/', wrap(async (q, s) => s.json(await M.find().sort({ createdAt: -1 }))));
  r.post('/', auth, wrap(async (q, s) => s.json(await M.create(q.body))));
  r.put('/:id', auth, wrap(async (q, s) => s.json(await M.findByIdAndUpdate(q.params.id, q.body, { new: true }))));
  r.delete('/:id', auth, wrap(async (q, s) => { await M.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));
  return r;
};
