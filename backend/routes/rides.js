// Bike / rickshaw ride booking. The fare is agreed on a phone call, so there is no price here (the admin can write the agreed fare on the ride).
// RULE: only ONE ride can be active per vehicle. While a ride is Requested / Accepted / On the way, nobody else can book that vehicle;
// it is free again when the admin marks the ride Completed (or Cancelled).
import { Router } from 'express'; import mongoose from 'mongoose';
import { Ride } from '../models/index.js'; import { auth, wrap } from '../middleware/auth.js'; import { cleanPhone } from './orders.js'; import { logAction } from '../utils/log.js'; import { notifyRide } from '../utils/push.js';
export const VEHICLES = { bike: 'Bike', rickshaw: 'Rickshaw' }, STATUSES = ['Requested', 'Accepted', 'On the way', 'Completed', 'Cancelled'];
const r = Router(), t = (v, n) => String(v ?? '').trim().slice(0, n), code = x => '#' + String(x._id).slice(-5).toUpperCase(), bad = (s, m, c = 400) => s.status(c).json({ error: m });
const busyMsg = v => `Our ${VEHICLES[v].toLowerCase()} is already booked by another customer right now. Please try again when that ride is finished.`;
// What a customer may see about a ride (no other customer's data is ever sent)
const pub = x => ({ _id: x._id, code: String(x._id).slice(-5).toUpperCase(), vehicle: x.vehicle, status: x.status, active: !!x.active, pickup: x.pickup, dropoff: x.dropoff, fare: x.fare ?? null, createdAt: x.createdAt, updatedAt: x.updatedAt });
// Public: is each vehicle free right now? (only yes / no, nothing about who booked)
r.get('/status', wrap(async (q, s) => { const live = await Ride.find({ active: true }).select('vehicle').lean(); s.set('Cache-Control', 'no-store'); s.json(Object.fromEntries(Object.keys(VEHICLES).map(v => [v, { busy: live.some(x => x.vehicle === v) }]))); }));
r.post('/', wrap(async (q, s) => {
  const b = q.body || {}, vehicle = VEHICLES[b.vehicle] ? b.vehicle : '', name = t(b.name, 100), phone = cleanPhone(b.phone), pickup = t(b.pickup, 300), dropoff = t(b.dropoff, 300), note = t(b.note, 300);
  if (!vehicle) return bad(s, 'Please choose Bike or Rickshaw'); if (!String(b.phone ?? '').trim()) return bad(s, 'Phone number is required so the rider can call you with the fare.');
  if (!phone) return bad(s, 'Please enter a valid phone number (for example 03001234567).'); if (!name) return bad(s, 'Please enter your name');
  if (!pickup) return bad(s, 'Please tell us where to pick you up'); if (!dropoff) return bad(s, 'Please tell us where you want to go');
  const lat = Number(b.lat), lng = Number(b.lng), geo = b.lat != null && Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng) ? { pickupLat: lat, pickupLng: lng } : {};
  try { await Ride.init(); } catch {} // makes sure the one-active-ride-per-vehicle index exists
  if (await Ride.exists({ vehicle, active: true })) return bad(s, busyMsg(vehicle), 409);
  let ride; try { ride = await Ride.create({ name, phone, vehicle, pickup, dropoff, note, ...geo }); } catch (e) { if (e.code === 11000) return bad(s, busyMsg(vehicle), 409); throw e; } // two customers at the same second: the database lets only one through
  await logAction({ actor: 'Customer (' + phone + ')' }, { entity: 'Ride', summary: `New ${vehicle} ride ${code(ride)} from ${name}: ${pickup} → ${dropoff}` });
  await notifyRide(ride); // awaited on purpose: Vercel stops the function right after the response is sent
  s.json(pub(ride));
}));
// The customer's own rides (ids are saved on their phone)
r.post('/lookup', wrap(async (q, s) => { const ids = (q.body?.ids || []).filter(i => mongoose.isValidObjectId(i)).slice(0, 30); s.json((await Ride.find({ _id: { $in: ids } }).sort({ createdAt: -1 })).map(pub)); }));
// The customer can cancel until the ride has started; that frees the vehicle for others
r.post('/:id/cancel', wrap(async (q, s) => {
  if (!mongoose.isValidObjectId(q.params.id)) return bad(s, 'Ride not found', 404); const x = await Ride.findById(q.params.id); if (!x) return bad(s, 'Ride not found', 404);
  if (!['Requested', 'Accepted'].includes(x.status)) return bad(s, x.status === 'Cancelled' ? 'This ride is already cancelled.' : 'This ride has already started or finished, so it can no longer be cancelled. Please call us.');
  x.status = 'Cancelled'; x.active = false; x.cancelledBy = 'Customer'; x.endedAt = new Date(); await x.save();
  await logAction({ actor: 'Customer (' + x.phone + ')' }, { entity: 'Ride', summary: `Customer cancelled ${x.vehicle} ride ${code(x)}` }); await notifyRide(x, true); s.json(pub(x));
}));
// ---- Admin
r.get('/', auth, wrap(async (q, s) => s.json(await Ride.find().sort({ createdAt: -1 }).limit(300).lean())));
r.put('/:id', auth, wrap(async (q, s) => {
  if (!mongoose.isValidObjectId(q.params.id)) return bad(s, 'Ride not found', 404); const old = await Ride.findById(q.params.id); if (!old) return bad(s, 'Ride not found', 404);
  const b = q.body || {}, u = {}, changes = [];
  if ('fare' in b) { if (b.fare === '' || b.fare == null) u.fare = null; else { const n = Number(b.fare); if (!Number.isFinite(n) || n < 0) return bad(s, 'Fare must be a number'); u.fare = Math.round(n * 100) / 100; } if ((old.fare ?? null) !== u.fare) changes.push({ field: 'fare', from: old.fare == null ? '—' : String(old.fare), to: u.fare == null ? '—' : String(u.fare) }); }
  if ('status' in b) { if (!STATUSES.includes(b.status)) return bad(s, 'Invalid status'); u.status = b.status; u.active = !['Completed', 'Cancelled'].includes(b.status);
    if (!u.active && old.active) { u.endedAt = new Date(); if (b.status === 'Cancelled') u.cancelledBy = 'Admin'; } if (u.active && !old.active) { u.endedAt = null; u.cancelledBy = ''; }
    if (old.status !== b.status) changes.push({ field: 'status', from: old.status, to: b.status }); }
  let d; try { d = await Ride.findByIdAndUpdate(old._id, { $set: u }, { new: true }); } catch (e) { if (e.code === 11000) return bad(s, `Another ${old.vehicle} ride is still active. Complete or cancel it first.`, 409); throw e; }
  if (changes.length) await logAction(q, { entity: 'Ride', summary: changes.length === 1 && changes[0].field === 'status' ? `Ride ${code(d)} (${d.name}, ${d.vehicle}) is now ${d.status}` : `Edited ride ${code(d)} (${d.name})`, changes }); s.json(d);
}));
r.delete('/:id', auth, wrap(async (q, s) => { const x = await Ride.findByIdAndDelete(q.params.id); if (x) await logAction(q, { entity: 'Ride', summary: `Deleted ${x.vehicle} ride ${code(x)} (${x.name})` }); s.json({ ok: true }); }));
export default r;
