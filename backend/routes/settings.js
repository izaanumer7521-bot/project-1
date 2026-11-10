import { Router } from 'express'; import { Setting } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js'; import { diff, logAction } from '../utils/log.js';
const r = Router();
r.get('/', wrap(async (q, s) => s.json((await Setting.findOne()) || {})));
r.put('/', auth, wrap(async (q, s) => {
  const { _id, __v, createdAt, updatedAt, ...body } = q.body;
  const old = (await Setting.findOne())?.toObject() || {}, d = await Setting.findOneAndUpdate({}, body, { upsert: true, new: true, setDefaultsOnInsert: true });
  const changes = diff(old, d.toObject(), Object.keys(body)); if (changes.length) await logAction(q, { entity: 'Settings', summary: 'Changed app settings', changes });
  s.json(d);
}));
export default r;
