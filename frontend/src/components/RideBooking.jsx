import { useEffect, useState } from 'react'; import { api } from '../utils/api.js';
// Book a bike or rickshaw. The fare is agreed on a phone call. Only ONE ride per vehicle can be active at a time:
// while someone's ride is open, the vehicle shows "Busy" and nobody else can book it, until the admin marks that ride complete.
const VEH = { bike: ['🏍️', 'Bike'], rickshaw: ['🛺', 'Rickshaw'], car: ['🚗', 'Car'] };
const STEXT = { Requested: 'Waiting for the rider to call you', Accepted: 'Accepted. The rider will call you with the fare', 'On the way': 'Your ride is on the way', Completed: 'Ride completed', Cancelled: 'Cancelled' };
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const rs = n => 'Rs ' + Number(n || 0).toLocaleString();
function useMyRides() {
  const [rides, setRides] = useState(null);
  const load = () => { const ids = jget('bd_rides', []); if (!ids.length) { setRides([]); return; } return api('rides/lookup', 'POST', { ids }).then(setRides).catch(() => {}); };
  useEffect(() => { load(); const id = setInterval(load, 20000); return () => clearInterval(id); }, []);
  return [rides, load];
}
function RideCard({ r, onCancel }) {
  return (<div className={'ridec' + (r.active ? ' live' : '')}><div className="rh"><b>{VEH[r.vehicle]?.[0]} {VEH[r.vehicle]?.[1] || r.vehicle} ride #{r.code}</b><span className="chip2" data-s={r.status === 'Requested' ? 'New' : r.status === 'Accepted' ? 'Confirmed' : r.status === 'Completed' ? 'Delivered' : r.status}>{r.status}</span></div>
    <p className="rto"><span>From</span> {r.pickup}</p><p className="rto"><span>To</span> {r.dropoff}</p>
    <p className="rst">{STEXT[r.status] || r.status}{r.fare != null && r.status !== 'Cancelled' && <> · <b>Fare: {rs(r.fare)}</b></>}</p><small>{new Date(r.createdAt).toLocaleString()}</small>
    {['Requested', 'Accepted'].includes(r.status) && <button type="button" className="cancelbtn" onClick={() => onCancel(r)}>✕ Cancel ride</button>}</div>);
}
const cancel = (r, load) => { if (confirm('Cancel this ride?')) api(`rides/${r._id}/cancel`, 'POST').then(load).catch(x => alert(x.message)); };
// Small list of my rides (used on the My Orders page)
export function MyRides() {
  const [rides, load] = useMyRides(); if (!rides?.length) return null;
  return (<section className="myrides"><div className="sh"><h3>🛺 My rides</h3></div>{rides.map(r => <RideCard key={r._id} r={r} onCancel={x => cancel(x, load)} />)}</section>);
}
export default function RideBooking({ user, profile, phone }) {
  const [avail, setAvail] = useState(null), [veh, setVeh] = useState('bike'), [f, setF] = useState({ name: '', phone: '', pickup: '', dropoff: '', note: '' }), [geo, setGeo] = useState(null), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState(false), [rides, load] = useMyRides();
  const poll = () => api('rides/status').then(setAvail).catch(() => {});
  useEffect(() => { poll(); const id = setInterval(poll, 15000); return () => clearInterval(id); }, []);
  useEffect(() => { if (profile) setF(x => ({ ...x, name: x.name || [profile.firstName, profile.lastName].filter(Boolean).join(' ') })); }, [profile]);
  const mine = v => (rides || []).find(r => r.active && r.vehicle === v), taken = v => !!avail?.[v]?.busy, [ico, vn] = VEH[veh], mineNow = mine(veh), blocked = taken(veh);
  const here = () => { if (!navigator.geolocation) return setMsg('Location is not available on this phone. Please type your pickup place.');
    navigator.geolocation.getCurrentPosition(p => { setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }); setF(x => ({ ...x, pickup: x.pickup || 'My current location' })); setMsg(''); }, () => setMsg('Could not get your location. Please allow location access, or type your pickup place.'), { enableHighAccuracy: true, timeout: 10000 }); };
  const home = () => { setF(x => ({ ...x, pickup: profile.street })); setGeo(profile.lat != null && profile.lng != null ? { lat: profile.lat, lng: profile.lng } : null); };
  const submit = async e => { e.preventDefault(); setMsg(''); setDone(false); const ph = (user || f.phone || '').trim();
    if (!ph) return setMsg('Phone number is required so the rider can call you with the fare.'); if (!/^\+?\d{10,15}$/.test(ph.replace(/[\s\-()]/g, ''))) return setMsg('Please enter a valid phone number (for example 03001234567).');
    setBusy(true); try { const d = await api('rides', 'POST', { vehicle: veh, name: f.name, phone: ph, pickup: f.pickup, dropoff: f.dropoff, note: f.note, ...(geo ? { lat: geo.lat, lng: geo.lng } : {}) });
      localStorage.setItem('bd_rides', JSON.stringify([d._id, ...jget('bd_rides', [])].slice(0, 30))); setF(x => ({ ...x, pickup: '', dropoff: '', note: '' })); setGeo(null); setDone(true); load(); } catch (x) { setMsg(x.message); }
    poll(); setBusy(false); };
  return (<div className="ride">
    <div className="rhead"><h3>🛺 Book a Bike, Rickshaw or Car</h3><p>Tell us where to pick you up and where you want to go. The rider will call you to agree on the fare.</p></div>
    <div className="vehs" role="radiogroup" aria-label="Choose a vehicle">{Object.entries(VEH).map(([k, [ic, n]]) => <button type="button" role="radio" aria-checked={veh === k} key={k} className={'veh' + (veh === k ? ' on' : '') + (taken(k) ? ' busy' : '')} onClick={() => { setVeh(k); setMsg(''); setDone(false); }}><span className="vi">{ic}</span><b>{n}</b><em>{avail === null ? '…' : taken(k) ? '🔴 Busy right now' : '🟢 Available'}</em></button>)}</div>
    {mineNow ? <div className="closedbar" role="status">✅ <b>You already have a {vn.toLowerCase()} ride booked.</b> Status: {mineNow.status}. You can book again when it is finished.</div>
      : blocked ? <div className="closedbar" role="status">🔴 <b>Our {vn.toLowerCase()} is on another ride right now.</b> It can be booked again as soon as that ride is finished. This page updates by itself.</div>
      : <form className="rideform" onSubmit={submit}>
        <input required placeholder="Your name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input required inputMode="tel" autoComplete="tel" minLength={10} placeholder="Phone number (required)" value={user || f.phone || ''} readOnly={!!user} onChange={e => setF({ ...f, phone: e.target.value })} />
        <label className="rl">Pick-up place (from)</label>
        <input required placeholder="House, street or any place" maxLength={300} value={f.pickup} onChange={e => setF({ ...f, pickup: e.target.value })} />
        <div className="rquick">{!!profile?.street && <button type="button" onClick={home}>🏠 From my house</button>}<button type="button" onClick={here}>📍 Use my current location</button></div>
        {geo && <small className="rgeo">📍 Your location is attached for the rider.</small>}
        <label className="rl">Where do you want to go?</label>
        <input required placeholder="Destination" maxLength={300} value={f.dropoff} onChange={e => setF({ ...f, dropoff: e.target.value })} />
        <input placeholder="Note for the rider (optional)" maxLength={300} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        <p className="rfare">💬 No price is shown here. The rider will call you and tell the fare before the ride starts.</p>
        {msg && <p className="err">{msg}</p>}<button className="btn big" disabled={busy}>{busy ? 'Booking…' : `${ico} Book ${vn.toLowerCase()}`}</button></form>}
    {msg && (mineNow || blocked) && <p className="err">{msg}</p>}
    {done && <div className="rdone">✅ <b>Ride requested!</b> The rider will call you shortly{phone ? <>. Need help? <a href={`tel:${phone}`}>{phone}</a></> : ''}.</div>}
    {!!rides?.length && <section className="myrides"><div className="sh"><h3>My rides</h3></div>{rides.map(r => <RideCard key={r._id} r={r} onCancel={x => cancel(x, load)} />)}</section>}
  </div>);
}
