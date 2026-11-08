import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const mk = (n, f) => model(n, new Schema(f, { timestamps: true }));
export const Admin = mk('Admin', { email: String, password: String });
export const Banner = mk('Banner', { title: String, subtitle: String, image: String, active: { type: Boolean, default: true } });
export const Product = mk('Product', { name: String, category: String, price: Number, unit: String, image: String, description: String, available: { type: Boolean, default: true } });
export const Review = mk('Review', { name: String, rating: { type: Number, default: 5 }, text: String });
export const Order = mk('Order', { name: String, phone: String, address: String, note: String, items: [{ name: String, price: Number, qty: Number }], total: Number, status: { type: String, default: 'New' } });
