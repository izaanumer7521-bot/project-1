import { Router } from 'express'; import mongoose from 'mongoose'; import { Order, Product, Setting, Shop } from '../models/index.js'; import { notifyOrder } from '../utils/push.js'; import { auth, wrap } from '../middleware/auth.js'; import { diff, logAction } from '../utils/log.js';
const code = o => '#' + String(o._id).slice(-5).toUpperCase(), STATUSES = ['New', 'Confirmed', 'On the way', 'Delivered', 'Cancelled'];
const r = Router();
r.post('/', wrap(async (q, s) => {
  const t = (v, n) => String(v ?? '').trim().slice(0, n), { items } = q.body, name = t(q.body.name, 100), phone = t(q.body.phone, 20), address = t(q.body.address, 400), note = t(q.body.note, 300);
  if (!name || !phone || !address || !Array.isArray(items) || !items.length) return s.status(400).json({ error: 'Name, phone, address and items are required' });
  // Prices always come from the database, never from the browser
  const prods = await Product.find({ _id: { $in: items.map(i => i?._id).filter(id => mongoose.isValidObjectId(id)) } }), by = Object.fromEntries(prods.map(p => [String(p._id), p])), lines = [];
  for (const i of items) {
    const p = by[String(i?._id)], qty = Math.floor(Number(i?.qty));
    if (!p || p.available === false) return s.status(400).json({ error: `"${i?.name || 'An item'}" is no longer available. Please remove it from your cart.` });
    if (!(qty >= 1 && qty <= 99)) return s.status(400).json({ error: 'Invalid quantity for ' + p.name });
    // Products with sizes (Half/Full, Small/Large, scoops…): the customer must pick one, and its price comes from the database
    const opts = p.options || []; let opt = null;
    if (opts.length) { opt = opts.find(o => o.label === String(i?.option ?? '')); if (!opt) return s.status(400).json({ error: `Please choose a size for "${p.name}".` }); }
    // Products with flavours (ice cream etc.): the customer must pick one of the flavours the shop listed
    const fls = p.flavors || []; let flavor = '';
    if (fls.length) { flavor = fls.find(f => f === String(i?.flavor ?? '')) || ''; if (!flavor) return s.status(400).json({ error: `Please choose a flavour for \"${p.name}\".` }); }
    const tag = [opt?.label, flavor].filter(Boolean).join(', ');
    lines.push({ name: tag ? `${p.name} (${tag})` : p.name, price: opt ? opt.price : p.price, qty, shopId: p.shopId || '', ...(opt && { option: opt.label }), ...(flavor && { flavor }) });
  }
  const subtotal = lines.reduce((x, i) => x + i.price * i.qty, 0), fee = Number((await Setting.findOne())?.deliveryFee ?? 100), delivery = Number.isFinite(fee) && fee >= 0 ? fee : 100;
  const lat = Number(q.body.lat), lng = Number(q.body.lng), geo = Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng) ? { lat, lng } : {};
  const set = (await Setting.findOne())?.toObject() || {}, accts = (set.paymentAccounts || []).filter(a => a.accountNumber), advOn = !!set.advanceEnabled && accts.length > 0, codOn = set.codEnabled !== false || !advOn;
  const method = q.body.paymentMethod === 'advance' ? 'advance' : q.body.paymentMethod === 'rider_online' ? 'rider_online' : 'cod', riderOn = set.riderOnlineEnabled !== false;
  if (method === 'rider_online' && !riderOn) return s.status(400).json({ error: 'Online payment to rider is not available right now. Please choose another method.' });
  if (method === 'advance' && !advOn) return s.status(400).json({ error: 'Advance payment is not available right now. Please choose Cash on Delivery.' });
  if (method === 'cod' && !codOn) return s.status(400).json({ error: 'Cash on Delivery is not available right now. Please pay in advance.' });
  const paymentRef = t(q.body.paymentRef, 80); if (method === 'advance' && !paymentRef) return s.status(400).json({ error: 'Please enter your transaction ID after sending the payment.' });
  const order = await Order.create({ name, phone, address, note, items: lines, subtotal, delivery, total: subtotal + delivery, paymentMethod: method, paymentStatus: 'Unpaid', paymentRef: method === 'advance' ? paymentRef : '', paymentAccount: method === 'advance' ? t(q.body.paymentAccount, 80) : '', ...geo });
  await logAction({ actor: 'Customer' + ' (' + phone + ')' }, { entity: 'Order', summary: `New order ${code(order)} from ${name} – Rs ${order.total}` });
  await notifyOrder(order); // awaited on purpose: Vercel stops the function right after the response is sent (admin + the shop owner(s) are alerted together)
  s.json(order.toObject());
}));

// ---- Prescription orders (medical stores): the customer uploads / captures a prescription photo OR types the medicines. The store confirms the price on a call. ----
const okImg = v => typeof v === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length <= 1000000;
r.post('/prescription', wrap(async (q, s) => {
  const t = (v, n) => String(v ?? '').trim().slice(0, n), b = q.body || {}, bad = m => s.status(400).json({ error: m });
  const name = t(b.name, 100), phone = t(b.phone, 20), address = t(b.address, 400), note = t(b.note, 300), mode = b.mode === 'type' ? 'type' : 'photo';
  if (!name || !phone || !address) return bad('Name, phone and delivery address are required');
  if (!mongoose.isValidObjectId(b.shopId)) return bad('Medical store not found');
  const shop = await Shop.findById(b.shopId); if (!shop || shop.active === false || !shop.medical) return bad('This store is not taking prescription orders right now.');
  const shopId = String(shop._id); let lines = [], images = [], medicines = [];
  if (mode === 'photo') {
    images = (Array.isArray(b.images) ? b.images : []).slice(0, 3); if (!images.length) return bad('Please add a photo of your prescription.');
    if (!images.every(okImg)) return bad('One of the photos is not valid or is too large. Please retake it.');
    lines = [{ name: 'Prescription (see photo) – price to be confirmed', price: 0, qty: 1, shopId }];
  } else {
    medicines = (Array.isArray(b.medicines) ? b.medicines : []).map(m => ({ name: t(m?.name, 120), qty: Math.floor(Number(m?.qty)) })).filter(m => m.name).slice(0, 30);
    if (!medicines.length) return bad('Please type at least one medicine name.'); if (medicines.some(m => !(m.qty >= 1 && m.qty <= 99))) return bad('Quantity must be between 1 and 99.');
    lines = medicines.map(m => ({ name: m.name, price: 0, qty: m.qty, shopId }));
  }
  const set = (await Setting.findOne())?.toObject() || {}, fee = Number(set.deliveryFee ?? 100), delivery = Number.isFinite(fee) && fee >= 0 ? fee : 100;
  const riderOn = set.riderOnlineEnabled !== false, codOn = set.codEnabled !== false || !riderOn; // prices are not known yet, so advance payment is not offered for prescriptions
  const method = b.paymentMethod === 'rider_online' && riderOn ? 'rider_online' : codOn ? 'cod' : 'rider_online';
  const lat = Number(b.lat), lng = Number(b.lng), geo = Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng) ? { lat, lng } : {};
  const order = await Order.create({ name, phone, address, note, items: lines, subtotal: 0, delivery, total: delivery, paymentMethod: method, paymentStatus: 'Unpaid', kind: 'prescription', rxShopId: shopId, rxMode: mode, prescription: images, medicines, ...geo });
  await logAction({ actor: 'Customer (' + phone + ')' }, { entity: 'Order', summary: `New prescription order ${code(order)} from ${name} for "${shop.name}" (${mode === 'photo' ? images.length + ' photo(s)' : medicines.length + ' medicine(s) typed'})` });
  await notifyOrder(order);
  const o = order.toObject(); delete o.prescription; s.json({ ...o, hasRx: images.length > 0 });
}));
// Admin: the prescription photos of one order (kept out of the big order list so that stays fast)
r.get('/:id/prescription', auth, wrap(async (q, s) => { if (!mongoose.isValidObjectId(q.params.id)) return s.status(404).json({ error: 'Order not found' }); const o = await Order.findById(q.params.id).select('prescription'); if (!o) return s.status(404).json({ error: 'Order not found' }); s.json({ images: o.prescription || [] }); }));
r.get('/', auth, wrap(async (q, s) => { const [rows, withRx] = await Promise.all([Order.find().select('-prescription').sort({ createdAt: -1 }).lean(), Order.find({ 'prescription.0': { $exists: true } }).select('_id').lean()]), has = new Set(withRx.map(x => String(x._id))); s.json(rows.map(o => ({ ...o, hasRx: has.has(String(o._id)) }))); }));
// Admin can edit every part of an order (customer details, location, items, delivery charges, total, payment)
r.put('/:id', auth, wrap(async (q, s) => {
  const o = await Order.findById(q.params.id); if (!o) return s.status(404).json({ error: 'Order not found' });
  const b = q.body, u = {}, t = (v, n) => String(v ?? '').trim().slice(0, n), money = v => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null; }, bad = m => s.status(400).json({ error: m });
  for (const [k, n] of [['name', 100], ['phone', 20], ['address', 400]]) if (k in b) { u[k] = t(b[k], n); if (!u[k]) return bad(`${k[0].toUpperCase() + k.slice(1)} cannot be empty`); }
  for (const [k, n] of [['note', 300], ['paymentRef', 80], ['paymentAccount', 80]]) if (k in b) u[k] = t(b[k], n);
  if ('status' in b) { if (!STATUSES.includes(b.status)) return bad('Invalid status'); u.status = b.status; }
  if ('paymentMethod' in b) { if (!['cod', 'advance', 'rider_online'].includes(b.paymentMethod)) return bad('Invalid payment method'); u.paymentMethod = b.paymentMethod; }
  if ('paymentStatus' in b) { if (!['Unpaid', 'Paid'].includes(b.paymentStatus)) return bad('Invalid payment status'); u.paymentStatus = b.paymentStatus; }
  for (const k of ['lat', 'lng']) if (k in b) { if (b[k] === '' || b[k] == null) u[k] = undefined; else { const n = Number(b[k]); if (!Number.isFinite(n)) return bad('Location must be numbers'); u[k] = n; } }
  if ('items' in b) {
    if (!Array.isArray(b.items) || !b.items.length) return bad('An order needs at least one item');
    u.items = []; for (const i of b.items) { const name = t(i?.name, 120), price = money(i?.price), qty = Math.floor(Number(i?.qty)); if (!name || price == null || !(qty >= 1 && qty <= 999)) return bad('Each item needs a name, a price and a quantity of 1 or more'); const shopId = t(i?.shopId, 40); u.items.push({ name, price, qty, ...(shopId && { shopId }), ...(t(i?.option, 40) && { option: t(i.option, 40) }), ...(t(i?.flavor, 40) && { flavor: t(i.flavor, 40) }) }); }
  }
  const items = u.items || o.items; u.subtotal = items.reduce((x, i) => x + i.price * i.qty, 0);
  if ('delivery' in b) { const d = money(b.delivery); if (d == null) return bad('Delivery charges must be a number'); u.delivery = d; }
  if ('total' in b && b.total !== '' && b.total != null) { const n = money(b.total); if (n == null) return bad('Total must be a number'); u.total = n; }
  else if ('items' in b || 'delivery' in b) u.total = u.subtotal + (u.delivery ?? o.delivery ?? 0);
  const set = {}, unset = {}; for (const [k, v] of Object.entries(u)) (v === undefined ? unset : set)[k] = v === undefined ? 1 : v;
  const before = o.toObject(), d = await Order.findByIdAndUpdate(q.params.id, { ...(Object.keys(set).length && { $set: set }), ...(Object.keys(unset).length && { $unset: unset }) }, { new: true });
  const changes = diff(before, d.toObject(), Object.keys(u)); if (changes.length) await logAction(q, { entity: 'Order', summary: (changes.length === 1 && changes[0].field === 'status' ? `Changed status of order ${code(d)} (${d.name}) to ${d.status}` : `Edited order ${code(d)} (${d.name})`), changes });
  s.json(d);
}));
r.delete('/:id', auth, wrap(async (q, s) => { const o = await Order.findByIdAndDelete(q.params.id); if (o) await logAction(q, { entity: 'Order', summary: `Deleted order ${code(o)} (${o.name}, Rs ${o.total})` }); s.json({ ok: true }); }));
// Customer cancels their own order (only before it is on the way). The id comes from the order list saved on the customer's device.
r.post('/:id/cancel', wrap(async (q, s) => {
  if (!mongoose.isValidObjectId(q.params.id)) return s.status(404).json({ error: 'Order not found' });
  const o = await Order.findById(q.params.id); if (!o) return s.status(404).json({ error: 'Order not found' });
  if (o.status === 'Cancelled') return s.status(400).json({ error: 'This order is already cancelled.' });
  if (!['New', 'Confirmed'].includes(o.status)) return s.status(400).json({ error: 'This order is already on the way or delivered, so it can no longer be cancelled. Please call us.' });
  o.status = 'Cancelled'; await o.save();
  await logAction({ actor: 'Customer (' + o.phone + ')' }, { entity: 'Order', summary: `Customer cancelled order ${code(o)} (${o.name}, Rs ${o.total})` + (o.paymentStatus === 'Paid' ? ' – advance was paid, refund needed' : '') });
  await notifyOrder(o, true); // admin + the shop owner(s) of this order get a cancel alert (awaited: Vercel stops right after the response)
  s.json(o.toObject());
}));
r.post('/lookup', wrap(async (q, s) => {
  const ids = (q.body.ids || []).filter(i => mongoose.isValidObjectId(i)).slice(0, 30);
  s.json(await Order.find({ _id: { $in: ids } }).select('-prescription').sort({ createdAt: -1 }));
}));
export default r;
