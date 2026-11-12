import express from 'express'; import cors from 'cors';
import { Banner, Product, Review, Category } from './models/index.js';
import adminRoutes from './routes/admin.js'; import crud from './routes/crud.js'; import orderRoutes from './routes/orders.js';
import pushRoutes from './routes/push.js'; import vendorRoutes from './routes/vendor.js'; import shopRoutes from './routes/shops.js'; import logRoutes from './routes/logs.js'; import customerRoutes from './routes/customers.js'; import settingRoutes from './routes/settings.js'; import importRoutes from './routes/import.js'; import imgRoutes from './routes/img.js';
const app = express(); app.use(cors()); app.use(express.json({ limit: '4mb' }));
app.use('/api/admin', adminRoutes); app.use('/api/orders', orderRoutes); app.use('/api/customers', customerRoutes); app.use('/api/settings', settingRoutes); app.use('/api/logs', logRoutes); app.use('/api/push', pushRoutes); app.use('/api/vendor', vendorRoutes); app.use('/api/shops', shopRoutes); app.use('/api/import', importRoutes); app.use('/api/img', imgRoutes);
app.use('/api/banners', crud(Banner, { sort: 1, createdAt: -1 }, 'Banner')); // Category "short code" is optional: when it is left empty we make a unique one from the name (fixes E11000 duplicate key { key: "" })
const slug = t => String(t || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'cat';
const uniqueKey = async (base, selfId) => { let k = base, n = 1; while (await Category.exists({ key: k, ...(selfId && { _id: { $ne: selfId } }) })) k = base + '-' + ++n; return k; };
app.use('/api/categories', async (q, s, next) => { try {
  if (q.method === 'POST' || q.method === 'PUT') {
    if (q.method === 'POST') for (const c of await Category.find({ $or: [{ key: '' }, { key: null }, { key: { $exists: false } }] })) await Category.updateOne({ _id: c._id }, { $set: { key: await uniqueKey(slug(c.name), c._id) } }); // repair old rows saved without a code
    if (q.body && ('key' in q.body || q.method === 'POST')) { const k = slug(q.body.key); q.body.key = k === 'cat' && !String(q.body.key || '').trim() ? await uniqueKey(slug(q.body.name), q.params?.id || (q.url.match(/^\/([a-f0-9]{24})/) || [])[1]) : k; }
  } next(); } catch (e) { next(e); } });
app.use('/api/categories', crud(Category, { sort: 1 }, 'Category'));
app.use('/api/products', crud(Product, undefined, 'Product')); app.use('/api/reviews', crud(Review, undefined, 'Review'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found: ' + req.method + ' ' + req.originalUrl }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
export default app;
