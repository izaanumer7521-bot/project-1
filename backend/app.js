import express from 'express'; import cors from 'cors';
import { Banner, Product, Review } from './models/index.js';
import adminRoutes from './routes/admin.js'; import crud from './routes/crud.js'; import orderRoutes from './routes/orders.js';
const app = express(); app.use(cors()); app.use(express.json({ limit: '2mb' }));
app.use('/api/admin', adminRoutes); app.use('/api/orders', orderRoutes);
app.use('/api/banners', crud(Banner)); app.use('/api/products', crud(Product)); app.use('/api/reviews', crud(Review));
export default app;
