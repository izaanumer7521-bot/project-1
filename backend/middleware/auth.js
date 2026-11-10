import jwt from 'jsonwebtoken'; import { Admin, Shop } from '../models/index.js';
export const wrap = fn => (q, r) => fn(q, r).catch(e => r.status(500).json({ error: e.message }));
const tok = q => (q.headers.authorization || '').replace('Bearer ', '');
// PLATFORM ADMIN ONLY. Customers and vendors are rejected, so every existing admin route is automatically closed to vendors.
export const auth = (q, r, n) => {
  try { q.admin = jwt.verify(tok(q), process.env.JWT_SECRET); if (q.admin.role === 'customer' || q.admin.role === 'vendor') throw 0; n(); }
  catch { r.status(401).json({ error: 'Please log in again' }); }
};
// ADMIN OR VENDOR. The account is re-read from the database every time, so a deleted account or a disabled shop is locked out at once.
// Sets q.role ('admin' | 'vendor') and, for vendors, q.vendor = { shopId, shopName }.
export const vendorAuth = async (q, r, n) => {
  let t, a; try { t = jwt.verify(tok(q), process.env.JWT_SECRET); if (t.role === 'customer') throw 0; a = await Admin.findById(t.id); if (!a) throw 0; } catch { return r.status(401).json({ error: 'Please log in again' }); }
  try {
    q.admin = { id: String(a._id), role: a.role || 'admin' }; q.role = q.admin.role;
    if (q.role === 'vendor') {
      if (t.role !== 'vendor') return r.status(401).json({ error: 'Please log in again' }); // an admin-looking token can never act as a vendor
      const shop = a.shopId && await Shop.findById(a.shopId); if (!shop) return r.status(403).json({ error: 'Your shop no longer exists' });
      if (!shop.active) return r.status(403).json({ error: 'This shop account is disabled. Please contact the platform admin.' });
      q.vendor = { shopId: String(shop._id), shopName: shop.name };
    } else if (t.role === 'vendor') return r.status(401).json({ error: 'Please log in again' });
    n();
  } catch (e) { r.status(500).json({ error: e.message }); }
};
// Vendors only (the product-management API)
export const vendorOnly = [vendorAuth, (q, r, n) => q.vendor ? n() : r.status(403).json({ error: 'Vendor accounts only' })];
export const customerAuth = (q, r, n) => {
  try { const t = jwt.verify(tok(q), process.env.JWT_SECRET); if (t.role !== 'customer') throw 0; q.customer = t; n(); }
  catch { r.status(401).json({ error: 'Please sign in again' }); }
};
