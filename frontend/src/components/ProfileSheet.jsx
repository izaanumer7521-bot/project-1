import { useEffect, useState } from 'react'; import { api } from '../utils/api.js';

// Bottom sheet: "Update Profile Info" (shown after sign-up and from Profile > Personal Details)
export default function ProfileSheet({ profile, onClose, onSaved }) {
  const [f, setF] = useState({ firstName: profile?.firstName || '', lastName: profile?.lastName || '', email: profile?.email || '', street: profile?.street || '', lat: profile?.lat ?? null, lng: profile?.lng ?? null, defaultAddress: !!profile?.defaultAddress });
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [locating, setLocating] = useState(false), [hint, setHint] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const pinned = f.lat != null && f.lng != null;

  const pin = () => {
    if (!navigator.geolocation) return setErr('Location is not supported on this device. Please use a phone with GPS.');
    setLocating(true); setErr(''); setHint('');
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords; setF(x => ({ ...x, lat, lng }));
      try { // try to read the street name from the pin; the customer can always type it
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`), d = await r.json(), a = d.address || {};
        const st = [a.house_number, a.road || a.neighbourhood || a.suburb].filter(Boolean).join(' ');
        if (st) setF(x => ({ ...x, street: x.street || st })); else setHint("We couldn't read a street for this spot — type it in.");
      } catch { setHint("We couldn't read a street for this spot — type it in."); }
      setLocating(false);
    }, e => { setLocating(false); setErr(e.code === 1 ? 'Location permission was denied. Allow location access in your browser settings and try again.' : 'Could not get your location. Please try again.'); }, { enableHighAccuracy: true, timeout: 15000 });
  };

  const save = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { onSaved(await api('customers/me', 'PUT', f)); } catch (x) { setErr(x.message); } setBusy(false);
  };

  return (<div className="psheet-wrap">
    <div className="dbg" onClick={onClose} />
    <form className="psheet" onSubmit={save}>
      <i className="grab" />
      <div className="phd"><h3>Update Profile Info</h3><button type="button" className="x" aria-label="Close" onClick={onClose}>✕</button></div>
      <div className="two-in">
        <label>First name <span className="req">*</span><input required placeholder="Enter first name" value={f.firstName} onChange={e => set('firstName', e.target.value)} /></label>
        <label>Last name <span className="req">*</span><input required placeholder="Enter last name" value={f.lastName} onChange={e => set('lastName', e.target.value)} /></label>
      </div>
      <label>Email<input type="email" placeholder="Enter your email" value={f.email} onChange={e => set('email', e.target.value)} /></label>
      <p className="help">Optional — used for order receipts.</p>
      <label>Delivery location <span className="req">*</span></label>
      {pinned
        ? <div className="locbox on"><span className="pin">📍</span><div><b>Pinned at {Number(f.lat).toFixed(5)}, {Number(f.lng).toFixed(5)}</b><small>Your saved location</small></div><button type="button" className="chg" disabled={locating} onClick={pin}>{locating ? '…' : 'Change'}</button></div>
        : <div className="locbox"><span className="pin">📍</span><div><b>No location pinned</b><small>Tap to use your current location</small></div><button type="button" className="chg" disabled={locating} onClick={pin}>{locating ? 'Locating…' : 'Pin'}</button></div>}
      <label>Street address <span className="req">*</span><input required placeholder="House no, street or area" value={f.street} onChange={e => set('street', e.target.value)} /></label>
      {hint && <p className="help">{hint}</p>}
      <div className="defrow"><span><b>Default delivery address</b><small>Preselect this address at checkout</small></span>
        <button type="button" role="switch" aria-checked={f.defaultAddress} className={'switch' + (f.defaultAddress ? ' on' : '')} onClick={() => set('defaultAddress', !f.defaultAddress)}><i /></button></div>
      {err && <p className="err">{err}</p>}
      <button className="btn big" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    </form></div>);
}
