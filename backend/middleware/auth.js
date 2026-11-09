import jwt from 'jsonwebtoken';
export const wrap = fn => (q, r) => fn(q, r).catch(e => r.status(500).json({ error: e.message }));
export const auth = (q, r, n) => {
  try { q.admin = jwt.verify((q.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); if (q.admin.role === 'customer') throw 0; n(); }
  catch { r.status(401).json({ error: 'Please log in again' }); }
};
export const customerAuth = (q, r, n) => {
  try { const t = jwt.verify((q.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); if (t.role !== 'customer') throw 0; q.customer = t; n(); }
  catch { r.status(401).json({ error: 'Please sign in again' }); }
};
