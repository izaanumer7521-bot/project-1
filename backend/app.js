import express from 'express'; import cors from 'cors';
import { Banner, Product, Review } from './models/index.js';
import adminRoutes from './routes/admin.js'; import crud from './routes/crud.js'; import orderRoutes from './routes/orders.js'; import customerRoutes from './routes/customers.js';
const app = express(); app.use(cors()); app.use(express.json({ limit: '2mb' }));
app.use('/api/admin', adminRoutes); app.use('/api/orders', orderRoutes); app.use('/api/customers', customerRoutes);
app.use('/api/banners', crud(Banner)); app.use('/api/products', crud(Product)); app.use('/api/reviews', crud(Review));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found: ' + req.method + ' ' + req.originalUrl }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
export default app;
