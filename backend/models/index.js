import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const mk = (n, f) => model(n, new Schema(f, { timestamps: true }));
export const Admin = mk('Admin', { email: String, password: String });
export const Banner = mk('Banner', { title: String, subtitle: String, image: String, showText: { type: Boolean, default: false }, sort: { type: Number, default: 0 }, active: { type: Boolean, default: true } });
export const Product = mk('Product', { name: String, category: String, price: Number, unit: String, image: String, description: String, oldPrice: Number, bestSeller: { type: Boolean, default: false }, hotDeal: { type: Boolean, default: false }, available: { type: Boolean, default: true } });
export const Review = mk('Review', { name: String, rating: { type: Number, default: 5 }, text: String });
export const Order = mk('Order', { name: String, phone: String, address: String, note: String, items: [{ name: String, price: Number, qty: Number }], notified: { type: Boolean, default: false }, notifyError: String, subtotal: Number, delivery: Number, total: Number, lat: Number, lng: Number, status: { type: String, default: 'New' }, paymentMethod: { type: String, default: 'cod' }, paymentStatus: { type: String, default: 'Unpaid' }, paymentRef: String, paymentAccount: String });
export const Customer = mk('Customer', { phone: { type: String, unique: true }, name: String, firstName: String, lastName: String, email: String, street: String, lat: Number, lng: Number, defaultAddress: { type: Boolean, default: false } });
export const Category = mk('Category', { key: { type: String, unique: true }, name: String, emoji: String, image: String, sort: { type: Number, default: 0 }, active: { type: Boolean, default: true } });
export const Setting = mk('Setting', { area: String, deliveryTitle: String, deliverySub: String, phone1: String, phone2: String, hours: String, helpText: String, aboutUs: String, privacy: String, terms: String, deliveryFee: { type: Number, default: 100 },
  codEnabled: { type: Boolean, default: true }, codNote: String, advanceEnabled: { type: Boolean, default: false }, advanceNote: String,
  paymentAccounts: [new Schema({ kind: { type: String, default: 'bank' }, provider: String, accountTitle: String, accountNumber: String, note: String }, { _id: false })] });
export const Log = mk('Log', { actor: String, entity: String, action: String, summary: String, changes: [new Schema({ field: String, from: String, to: String }, { _id: false })] });
