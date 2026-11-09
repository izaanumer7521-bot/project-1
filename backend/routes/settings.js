import { Router } from 'express'; import { Setting } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js';
const r = Router();
r.get('/', wrap(async (q, s) => s.json((await Setting.findOne()) || {})));
r.put('/', auth, wrap(async (q, s) => {
  const { _id, __v, createdAt, updatedAt, ...body } = q.body;
  s.json(await Setting.findOneAndUpdate({}, body, { upsert: true, new: true, setDefaultsOnInsert: true }));
}));
export default r;
