// Vendor (shop owner) API. Everything here is locked to the vendor's OWN shop:
//  - shopId always comes from the verified login, never from the request body
//  - every read/update/delete filters by { _id, shopId }, so another shop's product can never be touched
import { Router } from 'express'; import bcrypt from 'bcryptjs'; import mongoose from 'mongoose';
import { Admin, Product, Category, Order } from '../models/index.js'; import { vendorOnly, wrap } from '../middleware/auth.js'; import { diff, logAction } from '../utils/log.js';
const r = Router(); r.use(vendorOnly);
const bad = (s, m, c = 400) => s.status(c).json({ error: m });
// Vendors can only send these fields. shopId, bestSeller and hotDeal are never accepted from a vendor.
// Size / portion options, e.g. Half Rs 300 + Full Rs 550, or 1 Scoop / 2 Scoops. Rows with an empty label and price are ignored.
export function cleanOptions(raw) {
  const list = [], seen = new Set(); for (const x of Array.isArray(raw) ? raw : []) { const label = String(x?.label ?? '').trim().slice(0, 40), ps = x?.price; if (!label && (ps === '' || ps == null)) continue; const price = Number(ps);
    if (!label || ps === '' || ps == null || !Number.isFinite(price) || price < 0) return { error: 'Each size needs a name and a price' }; if (seen.has(label.toLowerCase())) return { error: 'Size names must be different' }; seen.add(label.toLowerCase()); list.push({ label, price }); }
  return { list: list.slice(0, 8) };
}
// Flavours (e.g. Mango, Vanilla): a simple list of names the customer can choose from. Duplicates and empty names are dropped.
export function cleanFlavors(raw) {
  const list = [], seen = new Set(); for (const x of Array.isArray(raw) ? raw : []) { const f = String(x ?? '').trim().slice(0, 40); if (!f || seen.has(f.toLowerCase())) continue; seen.add(f.toLowerCase()); list.push(f); }
  return list.slice(0, 30);
}
function clean(b, full) {
  const u = {}, t = (v, n) => String(v ?? '').trim().slice(0, n), num = v => { const n = Number(v); return v !== '' && v != null && Number.isFinite(n) && n >= 0 ? n : null; };
  if (full || 'name' in b) { u.name = t(b.name, 120); if (!u.name) return { error: 'Product name is required' }; }
  if (full || 'category' in b) { u.category = t(b.category, 40); if (!u.category) return { error: 'Choose a category' }; }
  if ((full || 'price' in b) && !(Array.isArray(b.options) && b.options.some(x => x?.label))) { u.price = num(b.price); if (u.price == null) return { error: 'Enter a valid price' }; }
  if ('oldPrice' in b) { if (b.oldPrice === '' || b.oldPrice == null) u.oldPrice = null; else { u.oldPrice = num(b.oldPrice); if (u.oldPrice == null) return { error: 'Old price must be a number' }; } }
  if ('unit' in b) u.unit = t(b.unit, 40); if ('description' in b) u.description = t(b.description, 500); if ('image' in b) u.image = t(b.image, 3e6);
  if ('section' in b) u.section = t(b.section, 40);
  if ('options' in b) { const o = cleanOptions(b.options); if (o.error) return o; u.options = o.list; if (o.list.length) u.price = Math.min(...o.list.map(x => x.price)); }
  if ('flavors' in b) u.flavors = cleanFlavors(b.flavors);
  if ('available' in b) u.available = !!b.available;
  return u;
}
const mine = q => ({ shopId: q.vendor.shopId });
// Reuse the spelling of an existing section of this shop (so "burger" and "Burger" become one chip)
const fixSection = async (q, u) => { if (u.section) { const ex = (await Product.distinct('section', mine(q))).find(x => x && x.toLowerCase() === u.section.toLowerCase()); if (ex) u.section = ex; } };
// Orders that contain this shop's products. A vendor only ever sees ITS OWN lines and the amount for them:
// no other shop's items, no order total, no delivery charges, and no customer phone or address.
r.get('/orders', wrap(async (q, s) => {
  const id = q.vendor.shopId, rows = await Order.find({ 'items.shopId': id }).sort({ createdAt: -1 }).limit(200);
  s.json(rows.map(o => { const items = (o.items || []).filter(i => i.shopId === id).map(i => ({ name: i.name, price: i.price, qty: i.qty })); return { _id: o._id, code: String(o._id).slice(-5).toUpperCase(), createdAt: o.createdAt, status: o.status || 'New', customer: o.name, items, subtotal: items.reduce((x, i) => x + i.price * i.qty, 0) }; }));
}));
r.get('/products', wrap(async (q, s) => s.json(await Product.find(mine(q)).sort({ createdAt: -1 }))));
r.post('/products', wrap(async (q, s) => {
  const u = clean(q.body, true); if (u.error) return bad(s, u.error);
  if (!(await Category.exists({ key: u.category }))) return bad(s, 'Unknown category');
  await fixSection(q, u); const p = await Product.create({ available: true, ...u, shopId: q.vendor.shopId });
  await logAction(q, { entity: 'Product', summary: `Vendor "${q.vendor.shopName}" added product "${p.name}"` }); s.json(p);
}));
r.put('/products/:id', wrap(async (q, s) => {
  if (!mongoose.isValidObjectId(q.params.id)) return bad(s, 'Product not found in your shop', 404);
  const old = await Product.findOne({ _id: q.params.id, ...mine(q) }); if (!old) return bad(s, 'Product not found in your shop', 404);
  const u = clean(q.body, false); if (u.error) return bad(s, u.error);
  if (u.category && !(await Category.exists({ key: u.category }))) return bad(s, 'Unknown category');
  await fixSection(q, u); const p = await Product.findOneAndUpdate({ _id: q.params.id, ...mine(q) }, { $set: u }, { new: true }); if (!p) return bad(s, 'Product not found in your shop', 404);
  const changes = diff(old.toObject(), p.toObject(), Object.keys(u)); if (changes.length) await logAction(q, { entity: 'Product', summary: `Vendor "${q.vendor.shopName}" edited product "${p.name}"`, changes });
  s.json(p);
}));
r.delete('/products/:id', wrap(async (q, s) => {
  if (!mongoose.isValidObjectId(q.params.id)) return bad(s, 'Product not found in your shop', 404);
  const p = await Product.findOneAndDelete({ _id: q.params.id, ...mine(q) }); if (!p) return bad(s, 'Product not found in your shop', 404);
  await logAction(q, { entity: 'Product', summary: `Vendor "${q.vendor.shopName}" deleted product "${p.name}"` }); s.json({ ok: true });
}));
// A vendor can change their own password
r.put('/account', wrap(async (q, s) => {
  const { currentPassword, newPassword } = q.body || {}, a = await Admin.findById(q.admin.id);
  if (!(await bcrypt.compare(currentPassword || '', a.password))) return bad(s, 'Current password is wrong');
  if (!newPassword || newPassword.length < 8) return bad(s, 'New password needs 8+ characters');
  a.password = await bcrypt.hash(newPassword, 10); await a.save(); await logAction(q, { entity: 'Account', summary: `Vendor "${q.vendor.shopName}" changed their password` }); s.json({ ok: true });
}));
export default r;
