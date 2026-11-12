// Admin only: paste a menu as plain text -> preview -> save as HIDDEN products -> publish (or undo) the whole import.
// Nothing is ever deleted except the items that this same import created (Undo), and Undo also restores any price it changed.
import { Router } from 'express'; import mongoose from 'mongoose';
import { Shop, Product, Category, ImportBatch } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js'; import { logAction } from '../utils/log.js'; import { parseMenu } from '../utils/menuParse.js';
const r = Router(), bad = (s, m, c = 400) => s.status(c).json({ error: m }); r.use(auth);
const SNAP = ['price', 'options', 'flavors', 'section', 'description'];

async function prepare(b) {
  if (!mongoose.isValidObjectId(b.shopId)) return { error: 'Choose a vendor shop' }; const shop = await Shop.findById(b.shopId); if (!shop) return { error: 'Shop not found' };
  const category = String(b.category || '').trim(); if (!category || !(await Category.exists({ key: category }))) return { error: 'Choose a category for these items' };
  const p = parseMenu(b.text); if (p.error) return { error: p.error }; if (!p.rows.length) return { error: 'Paste at least one item first' };
  const have = await Product.find({ shopId: String(shop._id) }), by = new Map(have.map(x => [String(x.name).trim().toLowerCase(), x]));
  const rows = p.rows.map(x => ({ ...x, status: by.has(x.name.toLowerCase()) ? 'update' : 'new' }));
  return { shop, category, rows, by, errors: rows.filter(x => x.error).length };
}
const counts = rows => ({ total: rows.length, created: rows.filter(x => !x.error && x.status === 'new').length, updated: rows.filter(x => !x.error && x.status === 'update').length, errors: rows.filter(x => x.error).length });

r.post('/preview', wrap(async (q, s) => { const d = await prepare(q.body || {}); if (d.error) return bad(s, d.error); s.json({ rows: d.rows, ...counts(d.rows) }); }));

async function undoBatch(batch) {
  await Product.deleteMany({ _id: { $in: batch.created } });
  for (const u of batch.updated) await Product.updateOne({ _id: u.id }, { $set: u.prev });
  batch.undone = true; await batch.save();
}
r.post('/commit', wrap(async (q, s) => {
  const d = await prepare(q.body || {}); if (d.error) return bad(s, d.error);
  if (d.errors) return bad(s, `Please fix the ${d.errors} red line${d.errors > 1 ? 's' : ''} first. Nothing was saved.`);
  const shopId = String(d.shop._id), batch = await ImportBatch.create({ shopId, shopName: d.shop.name, created: [], updated: [] });
  try {
    for (const x of d.rows) {
      const old = d.by.get(x.name.toLowerCase());
      if (old) {
        const prev = {}; for (const k of SNAP) prev[k] = old[k] === undefined ? null : JSON.parse(JSON.stringify(old[k]));
        const set = { price: x.price, options: x.options, flavors: x.flavors, ...(x.section && { section: x.section }), ...(x.description && { description: x.description }) };
        await Product.updateOne({ _id: old._id }, { $set: set }); batch.updated.push({ id: String(old._id), prev });
      } else { const p = await Product.create({ name: x.name, category: d.category, price: x.price, options: x.options, flavors: x.flavors, section: x.section, description: x.description, unit: '', image: '', shopId, available: false }); batch.created.push(String(p._id)); }
      batch.markModified('created'); batch.markModified('updated');
    }
    await batch.save();
  } catch (e) { await undoBatch(batch).catch(() => {}); throw new Error('Import stopped and was rolled back: ' + e.message); }
  await logAction(q, { entity: 'Product', summary: `Imported menu for "${d.shop.name}": ${batch.created.length} new (hidden), ${batch.updated.length} updated` });
  s.json({ batch: String(batch._id), created: batch.created.length, updated: batch.updated.length });
}));
r.get('/batches', wrap(async (q, s) => {
  const rows = await ImportBatch.find({ undone: { $ne: true } }).sort({ createdAt: -1 }).limit(15);
  s.json(await Promise.all(rows.map(async b => ({ _id: b._id, shopName: b.shopName, createdAt: b.createdAt, created: b.created.length, updated: b.updated.length, published: !!b.published, hidden: await Product.countDocuments({ _id: { $in: b.created }, available: false }) }))));
}));
r.post('/:id/publish', wrap(async (q, s) => {
  const b = mongoose.isValidObjectId(q.params.id) && await ImportBatch.findById(q.params.id); if (!b || b.undone) return bad(s, 'Import not found', 404);
  await Product.updateMany({ _id: { $in: b.created } }, { $set: { available: true } }); b.published = true; await b.save();
  await logAction(q, { entity: 'Product', summary: `Published ${b.created.length} imported items of "${b.shopName}"` }); s.json({ ok: true });
}));
r.post('/:id/undo', wrap(async (q, s) => {
  const b = mongoose.isValidObjectId(q.params.id) && await ImportBatch.findById(q.params.id); if (!b || b.undone) return bad(s, 'Import not found', 404);
  await undoBatch(b); await logAction(q, { entity: 'Product', summary: `Undid the menu import of "${b.shopName}" (${b.created.length} items removed, ${b.updated.length} restored)` }); s.json({ ok: true });
}));
export default r;
