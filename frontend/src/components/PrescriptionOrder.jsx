import { useRef, useState } from 'react';
import { api } from '../utils/api.js';
import '../assets/rx.css';

const rs = n => 'Rs ' + Number(n || 0).toLocaleString();
const QUICK = ['Panadol', 'Paracetamol 500mg', 'Brufen', 'ORS Sachet', 'Disprin', 'Vitamin C', 'Cough Syrup', 'Bandage'];
const MAX_PHOTOS = 3, MAX_MEDS = 20;

// Shrinks a camera photo (often 4-8 MB) to a small JPEG so it uploads fast on mobile data
const shrink = file => new Promise((ok, no) => {
  const url = URL.createObjectURL(file), im = new Image();
  im.onload = () => {
    const k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    let q = 0.78, d = c.toDataURL('image/jpeg', q); while (d.length > 900000 && q > 0.4) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
    d.length > 990000 ? no(new Error('This photo is too large. Please retake it a little further away.')) : ok(d);
  };
  im.onerror = () => { URL.revokeObjectURL(url); no(new Error('Could not read this photo. Please try a JPG or PNG picture.')); };
  im.src = url;
});

const Glyph = ({ n }) => {
  const P = { cam: ['M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'M12 17a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6z'], img: ['M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'M3 16l5-5 4 4 3-3 6 6', 'M9 9.5h.01'], pen: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'], x: ['M6 6l12 12M18 6L6 18'], plus: ['M12 5v14M5 12h14'], lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'], truck: ['M2 6h11v10H2z', 'M13 10h4l4 3v3h-8', 'M6.5 19.5h.01M17 19.5h.01'], check: ['M5 12.5l4.5 4.5L19 7.5'], shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'] }[n];
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{P.map((d, i) => <path key={i} d={d} />)}</svg>;
};

export default function PrescriptionOrder({ shop, S, user, profile, onBack, onTrack, remember }) {
  const custom = !shop.med; // not a pharmacy: typed order only (no photo), e.g. a bakery
  const [mode, setMode] = useState(custom ? 'type' : 'photo'), [images, setImages] = useState([]), [meds, setMeds] = useState([{ name: '', qty: 1 }]), [rxNote, setRxNote] = useState('');
  const [f, setF] = useState({ name: profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : '', phone: user || '', address: profile?.defaultAddress ? profile.street || '' : '' });
  const [pm, setPm] = useState('cod'), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [reading, setReading] = useState(false), [zoom, setZoom] = useState(null), [done, setDone] = useState(null);
  const camRef = useRef(), galRef = useRef(), medRefs = useRef([]);
  const fee = Number(S.deliveryFee ?? 100), riderOn = S.riderOnlineEnabled !== false, codOn = S.codEnabled !== false || !riderOn;

  const pick = async fl => {
    setErr(''); const files = [...(fl || [])].slice(0, MAX_PHOTOS - images.length); if (!files.length) return; setReading(true);
    try { const out = []; for (const x of files) out.push(await shrink(x)); setImages(a => [...a, ...out].slice(0, MAX_PHOTOS)); } catch (x) { setErr(x.message); } setReading(false);
  };
  const setMed = (i, p) => setMeds(a => a.map((m, j) => (j === i ? { ...m, ...p } : m)));
  const addMed = (name = '') => setMeds(a => {
    if (name) { const blank = a.findIndex(m => !m.name.trim()); if (a.some(m => m.name.trim().toLowerCase() === name.toLowerCase())) return a; if (blank >= 0) return a.map((m, j) => (j === blank ? { ...m, name } : m)); }
    if (a.length >= MAX_MEDS) return a; setTimeout(() => medRefs.current[a.length]?.focus(), 30); return [...a, { name, qty: 1 }];
  });
  const filled = meds.filter(m => m.name.trim());

  const submit = async e => {
    e.preventDefault(); setErr('');
    if (mode === 'photo' && !images.length) return setErr('Please add a photo of your prescription.');
    if (mode === 'type' && !filled.length) return setErr('Please type at least one medicine name.');
    setBusy(true);
    try {
      const d = await api('orders/prescription', 'POST', { shopId: shop._id, mode, images: mode === 'photo' ? images : [], medicines: mode === 'type' ? filled.map(m => ({ name: m.name.trim(), qty: m.qty })) : [], ...f, note: rxNote, paymentMethod: pm,
        ...(profile?.lat != null && f.address.trim() === (profile.street || '').trim() ? { lat: profile.lat, lng: profile.lng } : {}) });
      remember(d._id); setDone(d);
    } catch (x) { setErr(x.message); } setBusy(false);
  };

  if (done) return (
    <div className="rx rx-done">
      <div className="rx-seal"><span>℞</span><i><Glyph n="check" /></i></div>
      <h2>{custom ? 'Order request sent' : 'Prescription received'}</h2>
      <p className="rx-lead"><b>{shop.name}</b> has your {custom ? 'order' : done.rxMode === 'photo' ? 'prescription' : 'medicine list'}. {custom ? 'The shop' : 'A pharmacist'} will check it and call you on <b>{done.phone}</b> to confirm availability and the price.</p>
      <div className="rx-ticket"><div><small>Order</small><b>#{done._id.slice(-5).toUpperCase()}</b></div><div><small>Delivery</small><b>{rs(done.delivery)}</b></div><div><small>Pay</small><b>{done.paymentMethod === 'cod' ? 'On delivery' : 'Online to rider'}</b></div></div>
      <ol className="rx-steps"><li className="on"><i>1</i><span><b>Received</b><small>Sent to the pharmacy</small></span></li><li><i>2</i><span><b>{custom ? 'Shop review' : 'Pharmacist review'}</b><small>{custom ? 'Checks your order' : 'Checks the medicines'}</small></span></li><li><i>3</i><span><b>Confirmation call</b><small>Price &amp; availability</small></span></li><li><i>4</i><span><b>Delivered to your door</b><small>Pay when it arrives</small></span></li></ol>
      <div className="rx-actions"><button className="btn big" onClick={onTrack}>Track my order</button><button className="btn big ghost" onClick={onBack}>Back to store</button></div>
    </div>);

  return (
    <form className="rx" onSubmit={submit} noValidate>
      <section className="rx-hero">
        <span className="rx-mark" aria-hidden="true">{custom ? '✎' : '℞'}</span>
        <small>{custom ? 'Custom order' : 'Prescription order'}</small>
        <h2>{custom ? <>Tell <em>{shop.name}</em> what you want</> : <>Order medicines from <em>{shop.name}</em></>}</h2>
        <p>{custom ? 'Type the items you want and your address. The shop will call you to confirm the price.' : 'Share your prescription or type what you need. The pharmacist confirms the price on a quick call.'}</p>
        <ul>{custom ? <><li><Glyph n="pen" /> Made your way</li><li><Glyph n="truck" /> Home delivery</li></> : <><li><Glyph n="lock" /> Private</li><li><Glyph n="shield" /> Pharmacist checked</li><li><Glyph n="truck" /> Home delivery</li></>}</ul>
      </section>

      {!custom && <div className="rx-seg" data-pos={mode === 'photo' ? 0 : 1} role="tablist" aria-label="How do you want to order?">
        <button type="button" role="tab" aria-selected={mode === 'photo'} onClick={() => { setMode('photo'); setErr(''); }}><Glyph n="cam" />Upload prescription</button>
        <button type="button" role="tab" aria-selected={mode === 'type'} onClick={() => { setMode('type'); setErr(''); }}><Glyph n="pen" />Type medicines</button>
        <i aria-hidden="true" />
      </div>}

      {mode === 'photo' ? (
        <section className="rx-card" aria-live="polite">
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={e => { pick(e.target.files); e.target.value = ''; }} />
          <input ref={galRef} type="file" accept="image/*" multiple hidden onChange={e => { pick(e.target.files); e.target.value = ''; }} />
          {!images.length ? (
            <div className="rx-drop">
              <div className="rx-frame"><b /><b /><b /><b /><span><Glyph n="cam" /></span></div>
              <h3>Add your prescription</h3>
              <p>Take a clear photo or pick one from your gallery.</p>
              <div className="rx-pickrow">
                <button type="button" className="rx-big on" disabled={reading} onClick={() => camRef.current.click()}><Glyph n="cam" />Take photo</button>
                <button type="button" className="rx-big" disabled={reading} onClick={() => galRef.current.click()}><Glyph n="img" />From gallery</button>
              </div>
              {reading && <p className="rx-busy">Preparing photo…</p>}
            </div>
          ) : (
            <>
              <div className="rx-shots">
                {images.map((src, i) => <figure key={i} style={{ '--tilt': (i % 2 ? 1.4 : -1.4) + 'deg' }}><button type="button" className="z" aria-label={'View page ' + (i + 1)} onClick={() => setZoom(src)}><img src={src} alt={'Prescription page ' + (i + 1)} /></button><figcaption>Page {i + 1}</figcaption><button type="button" className="rm" aria-label="Remove photo" onClick={() => setImages(a => a.filter((_, j) => j !== i))}><Glyph n="x" /></button></figure>)}
                {images.length < MAX_PHOTOS && <div className="rx-add"><button type="button" disabled={reading} onClick={() => camRef.current.click()}><Glyph n="cam" />Camera</button><button type="button" disabled={reading} onClick={() => galRef.current.click()}><Glyph n="img" />Gallery</button></div>}
              </div>
              {reading && <p className="rx-busy">Preparing photo…</p>}
            </>
          )}
          <ul className="rx-tips"><li>Doctor name, date and medicine names should be readable</li><li>Use good light and keep the paper flat</li><li>You can add up to {MAX_PHOTOS} pages</li></ul>
          <label className="rx-f">Anything the pharmacist should know? <em>(optional)</em><input value={rxNote} maxLength={300} placeholder="e.g. need the generic brand" onChange={e => setRxNote(e.target.value)} /></label>
        </section>
      ) : (
        <section className="rx-card rx-pad">
          <div className="rx-padh"><span>{custom ? '✎' : '℞'}</span><div><b>{custom ? 'Your order' : 'Your medicine list'}</b><small>{filled.length ? filled.length + (custom ? ' item' : ' medicine') + (filled.length > 1 ? 's' : '') : 'Add what you need'}</small></div></div>
          <div className="rx-lines">
            {meds.map((m, i) => (
              <div className="rx-line" key={i}>
                <i>{i + 1}</i>
                <input ref={el => (medRefs.current[i] = el)} aria-label={'Item ' + (i + 1)} placeholder={custom ? 'What you want, e.g. Chocolate cake 1 kg' : 'Medicine name & strength'} maxLength={120} value={m.name} onChange={e => setMed(i, { name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (m.name.trim()) addMed(); } }} />
                <div className="rx-qty"><button type="button" aria-label="Less" onClick={() => setMed(i, { qty: Math.max(1, m.qty - 1) })}>−</button><b>{m.qty}</b><button type="button" aria-label="More" onClick={() => setMed(i, { qty: Math.min(99, m.qty + 1) })}>+</button></div>
                <button type="button" className="rx-del" aria-label="Remove item" disabled={meds.length < 2 && !m.name} onClick={() => setMeds(a => (a.length > 1 ? a.filter((_, j) => j !== i) : [{ name: '', qty: 1 }]))}><Glyph n="x" /></button>
              </div>))}
          </div>
          <button type="button" className="rx-addrow" disabled={meds.length >= MAX_MEDS} onClick={() => addMed()}><Glyph n="plus" />{custom ? 'Add another item' : 'Add another medicine'}</button>
          {!custom && <div className="rx-quick"><small>Quick add</small><div>{QUICK.map(x => <button type="button" key={x} onClick={() => addMed(x)}>{x}</button>)}</div></div>}
          <label className="rx-f">{custom ? 'Special instructions' : 'Note for the pharmacist'} <em>(optional)</em><input value={rxNote} maxLength={300} placeholder={custom ? 'e.g. write "Happy Birthday" on the cake, needed by 6 pm' : 'e.g. tablets only, no syrup'} onChange={e => setRxNote(e.target.value)} /></label>
        </section>
      )}

      <section className="rx-card">
        <h3 className="rx-h"><i>2</i>Delivery details</h3>
        <label className="rx-f">Full name<input required autoComplete="name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Your name" /></label>
        <label className="rx-f">Phone number<input required inputMode="tel" autoComplete="tel" readOnly={!!user} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="03xx xxxxxxx" /></label>
        <label className="rx-f">Delivery address<textarea required rows={2} autoComplete="street-address" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} placeholder="House, street, area" /></label>
        {codOn && riderOn && <div className="rx-pay" role="radiogroup" aria-label="Payment"><button type="button" role="radio" aria-checked={pm === 'cod'} className={pm === 'cod' ? 'on' : ''} onClick={() => setPm('cod')}><b>Cash on delivery</b><small>Pay the rider in cash</small></button><button type="button" role="radio" aria-checked={pm === 'rider_online'} className={pm === 'rider_online' ? 'on' : ''} onClick={() => setPm('rider_online')}><b>Online to rider</b><small>Bank / e-wallet on arrival</small></button></div>}
      </section>

      <section className="rx-sum">
        <div><span>{custom ? 'Items' : 'Medicines'}</span><b>Price confirmed on call</b></div>
        <div><span>Delivery charges</span><b>{rs(fee)}</b></div>
        <p>{custom ? 'You only pay once the shop has confirmed the price with you.' : 'You only pay once the pharmacist has confirmed the price with you.'} {!(codOn && riderOn) && (codOn ? 'Payment: cash on delivery.' : 'Payment: online to the rider.')}</p>
      </section>

      {err && <p className="rx-err" role="alert">{err}</p>}
      <button className="btn big rx-go" disabled={busy || reading}>{busy ? 'Sending…' : <>Send to {shop.name}<span aria-hidden="true">→</span></>}</button>
      <button type="button" className="rx-cancel" onClick={onBack}>Cancel</button>

      {zoom && <div className="rx-zoom" onClick={() => setZoom(null)} role="dialog" aria-label="Prescription preview"><img src={zoom} alt="Prescription" /><button type="button" aria-label="Close"><Glyph n="x" /></button></div>}
    </form>
  );
}
