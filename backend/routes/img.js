// Serves a picture that is stored in the database as its own small, browser-cacheable file.
// Why: the lists (banners, stores, products, categories) used to carry every picture inside the JSON (huge, never cached).
// Now the lists only carry a link like /api/img/product/<id>?v=<version>; the browser downloads each picture once, lazily, and keeps it for a year.
import { Router } from 'express'; import mongoose from 'mongoose'; import { Banner, Product, Category, Shop } from '../models/index.js';
const MODELS = { banner: Banner, product: Product, category: Category, shop: Shop }, r = Router();
r.get('/:kind/:id', async (q, s) => {
  try {
    const M = MODELS[q.params.kind]; if (!M || !mongoose.isValidObjectId(q.params.id)) return s.status(404).end();
    const d = await M.findById(q.params.id).select('image').lean(), img = String(d?.image || ''); if (!img) return s.status(404).end();
    if (/^https?:\/\//.test(img)) return s.redirect(302, img);
    const m = img.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is); if (!m) return s.status(404).end();
    s.set({ 'Content-Type': m[1], 'Cache-Control': q.query.v ? 'public, max-age=31536000, immutable' : 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' }).send(Buffer.from(m[2], 'base64'));
  } catch { s.status(500).end(); }
});
export default r;
