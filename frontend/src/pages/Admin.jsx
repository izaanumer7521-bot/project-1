import { useEffect, useState } from 'react'; import { api, CATS } from '../utils/api.js'; import Logo from '../components/Logo.jsx'; import { pushState, enablePush, disablePush, testPush } from '../utils/push.js';
const catOpts = CATS.map(c => [c[0], c[2]]);
const SCHEMA = {
  banners: [['title', 'Title'], ['subtitle', 'Subtitle'], ['image', 'Banner image (best size 1200×600 px, keep text in the centre)', 'image', 1200], ['showText', 'Show title on top of the image', 'bool'], ['sort', 'Order (1 = first)', 'number'], ['active', 'Show on website', 'bool']],
  products: [['name', 'Name'], ['category', 'Category', 'select', 'cats'], ['shopId', 'Vendor shop (leave empty for your own product)', 'select', 'shops'], ['price', 'Price (Rs)', 'number'], ['oldPrice', 'Old price (optional, shows a % OFF badge)', 'number'], ['unit', 'Unit (per kg, each…)'], ['image', 'Photo', 'image', 600], ['description', 'Description'], ['bestSeller', 'Show in Best Selling', 'bool'], ['hotDeal', 'Show in Hot Deals', 'bool'], ['available', 'In stock', 'bool']],
  vendorProducts: [['name', 'Product name'], ['category', 'Category', 'select', 'cats'], ['price', 'Price (Rs)', 'number'], ['oldPrice', 'Old price (optional, shows a % OFF badge)', 'number'], ['unit', 'Unit (per kg, each…)'], ['image', 'Photo', 'image', 600], ['description', 'Description'], ['available', 'In stock', 'bool']],
  reviews: [['name', 'Customer name'], ['rating', 'Rating (1-5)', 'number'], ['text', 'Review', 'area']],
  categories: [['name', 'Name'], ['key', 'Short code (small letters, no spaces)'], ['emoji', 'Emoji icon (used when no photo)'], ['image', 'Photo (optional)', 'image', 500], ['sort', 'Order (1 = first)', 'number'], ['active', 'Show on website', 'bool']],
};
function ImageInput({ value, onChange, max = 800 }) {
  const pick = e => { const file = e.target.files[0]; if (!file) return; const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / im.width), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); onChange(c.toDataURL('image/jpeg', 0.78)); }; im.src = r.result; }; r.readAsDataURL(file); };
  return (<div className="imgin">{value && <img src={value} alt="" />}<input type="file" accept="image/*" onChange={pick} />
    <input placeholder="…or paste an image link" value={value && !value.startsWith('data:') ? value : ''} onChange={e => onChange(e.target.value)} />{value && <button type="button" onClick={() => onChange('')}>Remove image</button>}</div>);
}
const rs = n => 'Rs ' + Number(n || 0).toLocaleString('en-US');
const PAY = { cod: 'Cash on Delivery', advance: 'Advance payment' };
const dt = d => new Date(d).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
function PushSetup() {
  const [st, setSt] = useState('loading'), [m, setM] = useState(''), [busy, setBusy] = useState(false); useEffect(() => { pushState().then(setSt); }, []);
  const run = async (fn, ok) => { setBusy(true); setM(''); try { const r = await fn(); setM(typeof ok === 'function' ? ok(r) : ok || ''); } catch (x) { setM(x.message); } setSt(await pushState().catch(() => 'default')); setBusy(false); };
  if (st === 'loading') return null;
  return (<div className={'card pushcard' + (st === 'on' ? ' on' : '')}><div><b>{st === 'on' ? '🔔 Order alerts are ON for this device' : '🔔 Get a phone alert for every new order'}</b>
    <small>{st === 'on' ? 'You will get a sound + vibration + lock-screen banner when a customer orders, even when this page is closed.' : st === 'unsupported' ? 'This browser cannot receive push notifications. On iPhone: open this site in Safari → Share → Add to Home Screen, then open it from the Home Screen icon.' : st === 'denied' ? 'Notifications are blocked for this site. Allow them in your browser / phone site settings, then reload this page.' : 'Tap the button on the phone you want alerts on. Your phone will ask permission once.'}</small></div>
    <div className="prow">{st === 'default' && <button className="btn" disabled={busy} onClick={() => run(enablePush, 'Alerts turned on for this device.')}>Enable order alerts</button>}
      {st === 'on' && <><button className="btn ghost" disabled={busy} onClick={() => run(testPush, r => r.sent ? 'Test sent. Your phone should buzz in a few seconds.' : r.reason || 'Nothing was delivered. Try “Turn off”, then enable again.')}>Send test alert</button><button className="btn ghost" disabled={busy} onClick={() => run(disablePush, 'Alerts turned off for this device.')}>Turn off</button></>}</div>{m && <p className="err">{m}</p>}</div>);
}
function Dashboard() {
  const [range, setRange] = useState('30d'), [d, setD] = useState(null), [err, setErr] = useState('');
  useEffect(() => { setD(null); setErr(''); api('admin/stats?range=' + range).then(setD).catch(x => setErr(x.message)); }, [range]);
  const max = d ? Math.max(1, ...d.series.map(x => x.revenue)) : 1, st = d?.status || {}, label = x => new Date(x + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return (<div className="dash"><PushSetup /><div className="rangebar">{[['today', 'Today'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['all', 'All time']].map(([k, n]) => <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{n}</button>)}</div>
    {err && <p className="err">{err}</p>}{!d && !err && <p>Loading…</p>}
    {d && <><div className="stats">
      <div className="stat"><small>Total orders</small><b>{d.orders}</b><em>{st.New || 0} new · {st.Cancelled || 0} cancelled (not counted)</em></div>
      <div className="stat g"><small>Total money generated</small><b>{rs(d.revenue)}</b><em>From delivered orders: {rs(d.delivered.revenue)}</em></div>
      <div className="stat o"><small>Delivery fee earned</small><b>{rs(d.delivery)}</b><em>From delivered orders: {rs(d.delivered.delivery)}</em></div>
      <div className="stat"><small>Products sold (without delivery fee)</small><b>{rs(d.goods)}</b></div>
      <div className="stat"><small>Average order</small><b>{rs(d.avgOrder)}</b></div>
      <div className="stat"><small>Customers</small><b>{d.customers}</b><em>{d.newCustomers} new in this period</em></div></div>
      <div className="card"><h3>Sales per day</h3>{d.series.length ? <><div className="bars">{d.series.map(x => <div key={x.day} className="bar" title={`${label(x.day)}: ${x.orders} orders · ${rs(x.revenue)} (delivery ${rs(x.delivery)})`}><div className="col" style={{ height: (x.revenue / max * 100) + '%' }}><i style={{ flex: x.delivery }} /><i className="gd" style={{ flex: Math.max(0, x.revenue - x.delivery) }} /></div></div>)}</div>
        <div className="axis"><span>{label(d.series[0].day)}</span><span>{label(d.series[d.series.length - 1].day)}</span></div>
        <p className="legend"><span className="k gd" /> Products <span className="k" /> Delivery fee · hover a bar for the exact numbers</p></> : <p>No sales in this period yet.</p>}</div>
      <div className="two3"><div className="card"><h3>Orders by status</h3>{['New', 'Confirmed', 'On the way', 'Delivered', 'Cancelled'].map(k => <div key={k} className="row2"><span>{k}</span><b>{st[k] || 0}</b></div>)}</div>
        <div className="card"><h3>Payments</h3>{d.payments.length ? d.payments.map(x => <div key={x.method} className="row2"><span>{PAY[x.method] || x.method}<small> · {x.count} orders{x.method === 'advance' ? `, ${x.paid} marked paid` : ''}</small></span><b>{rs(x.total)}</b></div>) : <p>No orders yet.</p>}</div>
        <div className="card"><h3>Top products</h3>{d.topProducts.length ? d.topProducts.map(x => <div key={x.name} className="row2"><span>{x.name}<small> · {x.qty} sold</small></span><b>{rs(x.money)}</b></div>) : <p>No orders yet.</p>}</div></div></>}</div>);
}
const FL = { name: 'Name', phone: 'Phone', address: 'Address', note: 'Note', lat: 'Latitude', lng: 'Longitude', items: 'Items', delivery: 'Delivery charges', subtotal: 'Subtotal', total: 'Total', status: 'Status', paymentMethod: 'Payment method', paymentStatus: 'Payment status', paymentRef: 'Transaction ID', paymentAccount: 'Paid to', deliveryFee: 'Delivery fee', codEnabled: 'Cash on Delivery on', advanceEnabled: 'Advance payment on', paymentAccounts: 'Bank / e-wallet accounts', codNote: 'Cash on Delivery note', advanceNote: 'Advance payment instructions' };
const fl = k => FL[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
function Logs() {
  const [d, setD] = useState(null), [page, setPage] = useState(1), [ent, setEnt] = useState(''), [err, setErr] = useState('');
  useEffect(() => { setErr(''); api(`logs?page=${page}${ent ? '&entity=' + ent : ''}`).then(setD).catch(x => setErr(x.message)); }, [page, ent]);
  return (<div><select className="filt" value={ent} onChange={e => { setEnt(e.target.value); setPage(1); }}><option value="">All changes</option>{['Order', 'Customer', 'Product', 'Banner', 'Category', 'Review', 'Settings', 'Account'].map(x => <option key={x}>{x}</option>)}</select>
    {err && <p className="err">{err}</p>}{!d && !err && <p>Loading…</p>}
    {d && <><div className="list">{d.rows.map(l => <div key={l._id} className="card logrow"><div className="lh"><b>{l.summary}</b><small>{dt(l.createdAt)} · by {l.actor}</small></div>
      {l.changes?.map((c, k) => <div key={k} className="chg"><span>{fl(c.field)}</span><s>{c.field === 'paymentMethod' ? PAY[c.from] || c.from : c.from}</s><em>→</em><u>{c.field === 'paymentMethod' ? PAY[c.to] || c.to : c.to}</u></div>)}</div>)}{!d.rows.length && <p>No activity recorded yet. Changes you make from now on will show here.</p>}</div>
      {d.pages > 1 && <div className="pager"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Newer</button><span>Page {d.page} of {d.pages}</span><button disabled={page >= d.pages} onClick={() => setPage(page + 1)}>Older →</button></div>}</>}</div>);
}
const SET = [['area', 'Delivering to (area)'], ['deliveryTitle', 'Delivery headline (e.g. Delivery: Today)'], ['deliverySub', 'Delivery sub-text'], ['phone1', 'Phone / WhatsApp 1'], ['phone2', 'Phone 2'], ['hours', 'Opening hours'], ['deliveryFee', 'Delivery charges (Rs)'], ['helpText', 'Help Center text', 'area'], ['aboutUs', 'About Us text', 'area'], ['privacy', 'Privacy Policy text', 'area'], ['terms', 'Terms & Conditions text', 'area']];
function Settings() {
  const [f, setF] = useState(null), [m, setM] = useState(''); useEffect(() => { api('settings').then(setF); }, []);
  const save = async e => { e.preventDefault(); try { setF(await api('settings', 'PUT', f)); setM('Saved. The app shows the new settings now.'); } catch (x) { setM(x.message); } };
  if (!f) return <p>Loading…</p>;
  return (<form className="card narrow wide" onSubmit={save}><h3>App settings</h3>{SET.map(([k, l, t]) => <label key={k}>{l}{t === 'area' ? <textarea rows="4" value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} /> : <input value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} />}</label>)}
    <h3 className="sub">Payment methods at checkout</h3>
    <label>Cash on Delivery<input type="checkbox" checked={f.codEnabled !== false} onChange={e => setF({ ...f, codEnabled: e.target.checked })} /></label>
    <label>Cash on Delivery note (optional, shown to customer)<input value={f.codNote || ''} onChange={e => setF({ ...f, codNote: e.target.value })} /></label>
    <label>Advance payment (customer pays first by bank / e-wallet)<input type="checkbox" checked={!!f.advanceEnabled} onChange={e => setF({ ...f, advanceEnabled: e.target.checked })} /></label>
    <label>Instructions for advance payment<textarea rows="3" placeholder="e.g. Send the full amount, then enter the transaction ID at checkout." value={f.advanceNote || ''} onChange={e => setF({ ...f, advanceNote: e.target.value })} /></label>
    <p className="muted2">Your accounts (customers see these when they choose Advance payment):</p>
    {(f.paymentAccounts || []).map((a, k) => { const ch = p => setF({ ...f, paymentAccounts: f.paymentAccounts.map((x, j) => j === k ? { ...x, ...p } : x) }); return (<div key={k} className="acct">
      <select value={a.kind || 'bank'} onChange={e => ch({ kind: e.target.value })}><option value="bank">Bank account</option><option value="ewallet">E-wallet</option></select>
      <input placeholder={a.kind === 'ewallet' ? 'Wallet name (Easypaisa, JazzCash…)' : 'Bank name (HBL, Meezan…)'} value={a.provider || ''} onChange={e => ch({ provider: e.target.value })} />
      <input placeholder="Account title (name)" value={a.accountTitle || ''} onChange={e => ch({ accountTitle: e.target.value })} />
      <input placeholder={a.kind === 'ewallet' ? 'Wallet number' : 'Account number / IBAN'} value={a.accountNumber || ''} onChange={e => ch({ accountNumber: e.target.value })} />
      <input placeholder="Extra note (optional, e.g. branch)" value={a.note || ''} onChange={e => ch({ note: e.target.value })} />
      <button type="button" onClick={() => setF({ ...f, paymentAccounts: f.paymentAccounts.filter((_, j) => j !== k) })}>Remove this account</button></div>); })}
    <button type="button" className="btn ghost" onClick={() => setF({ ...f, paymentAccounts: [...(f.paymentAccounts || []), { kind: 'bank', provider: '', accountTitle: '', accountNumber: '', note: '' }] })}>+ Add bank / e-wallet</button>
    {m && <p className="err">{m}</p>}<button className="btn">Save settings</button></form>);
}
function Crud({ path, schema, base = path }) {
  const fields = SCHEMA[schema || path], blank = Object.fromEntries(fields.map(([k, , t]) => [k, t === 'bool' ? true : '']));
  const [rows, setRows] = useState([]), [f, setF] = useState(blank), [err, setErr] = useState(''), [cats, setCats] = useState([]), [shops, setShops] = useState([]);
  const load = () => api(base).then(setRows); useEffect(() => { setF(blank); load(); api('categories').then(d => setCats(d.map(c => [c.key, c.name]))); if (path === 'products') api('shops').then(d => setShops(d.map(x => [x._id, x.name]))).catch(() => {}); }, [path]);
  const save = async e => { e.preventDefault(); try { f._id ? await api(`${base}/${f._id}`, 'PUT', f) : await api(base, 'POST', f); setF(blank); setErr(''); load(); } catch (x) { setErr(x.message); } };
  return (<div className="two"><form className="card" onSubmit={save}><h3>{f._id ? 'Edit' : 'Add new'}</h3>
    {fields.map(([k, l, t, o]) => <label key={k}>{l}{t === 'bool' ? <input type="checkbox" checked={!!f[k]} onChange={e => setF({ ...f, [k]: e.target.checked })} />
      : t === 'select' ? <select required={o !== 'shops'} value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })}><option value="">{o === 'shops' ? 'None (my own product)' : 'Choose…'}</option>{(o === 'cats' ? cats : o === 'shops' ? shops : o).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
      : t === 'image' ? <ImageInput value={f[k]} max={o} onChange={v => setF({ ...f, [k]: v })} />
      : t === 'area' ? <textarea value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />
      : <input type={t || 'text'} value={f[k] ?? ''} onChange={e => setF({ ...f, [k]: t === 'number' ? +e.target.value : e.target.value })} />}</label>)}
    {err && <p className="err">{err}</p>}<button className="btn">Save</button>{f._id && <button type="button" className="btn ghost" onClick={() => setF(blank)}>Cancel</button>}</form>
    <div className="list">{rows.map(r => <div key={r._id} className="li"><div className="lt">{r.image ? <img src={r.image} alt="" /> : r.emoji ? <em>{r.emoji}</em> : null}<span><b>{r.name || r.title}</b><small>{r.price ? `Rs ${r.price} · ${r.category}${r.shopId && path === 'products' ? ' · Shop: ' + ((shops.find(x => x[0] === r.shopId) || [])[1] || 'vendor') : ''}` : r.text || r.subtitle}</small></span></div>
      <div><button onClick={() => setF(r)}>Edit</button><button onClick={async () => { if (confirm('Delete this item?')) { await api(`${base}/${r._id}`, 'DELETE'); load(); } }}>Delete</button></div></div>)}
      {!rows.length && <p>Nothing here yet. Add your first one.</p>}</div></div>);
}
function OrderEditor({ o, onDone }) {
  const [f, setF] = useState({ name: o.name || '', phone: o.phone || '', address: o.address || '', note: o.note || '', lat: o.lat ?? '', lng: o.lng ?? '', status: o.status || 'New', paymentMethod: o.paymentMethod || 'cod', paymentStatus: o.paymentStatus || 'Unpaid', paymentRef: o.paymentRef || '', paymentAccount: o.paymentAccount || '', items: o.items.map(i => ({ name: i.name, price: i.price, qty: i.qty, shopId: i.shopId || '' })), delivery: o.delivery ?? 0, total: o.total ?? 0 }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const sum = it => it.reduce((x, i) => x + (Number(i.price) || 0) * (Number(i.qty) || 0), 0), sub = sum(f.items);
  const up = p => setF(x => { const n = { ...x, ...p }; if (!('total' in p)) n.total = sum(n.items) + (Number(n.delivery) || 0); return n; });
  const item = (k, p) => up({ items: f.items.map((i, j) => j === k ? { ...i, ...p } : i) }), inp = (k, l, t) => <label>{l}<input type={t || 'text'} value={f[k]} onChange={e => up({ [k]: e.target.value })} /></label>;
  const save = async e => { e.preventDefault(); setBusy(true); setErr(''); try { await api('orders/' + o._id, 'PUT', { ...f, delivery: Number(f.delivery), total: Number(f.total), items: f.items.map(i => ({ ...i, price: Number(i.price), qty: Number(i.qty) })) }); onDone(true); } catch (x) { setErr(x.message); } setBusy(false); };
  return (<form className="oedit" onSubmit={save}><h4>Edit order #{o._id.slice(-5).toUpperCase()}</h4>
    <div className="g2">{inp('name', 'Customer name')}{inp('phone', 'Phone')}</div>{inp('address', 'Address')}{inp('note', 'Note')}
    <div className="g2">{inp('lat', 'Location latitude', 'number')}{inp('lng', 'Location longitude', 'number')}</div>
    {f.lat !== '' && f.lng !== '' && <a className="maplink" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${f.lat},${f.lng}`}>Open this location in Google Maps</a>}
    <b className="lbl">Items</b>{f.items.map((i, k) => <div key={k} className="irow"><input placeholder="Item" value={i.name} onChange={e => item(k, { name: e.target.value })} /><input type="number" min="0" step="any" placeholder="Price" value={i.price} onChange={e => item(k, { price: e.target.value })} /><input type="number" min="1" placeholder="Qty" value={i.qty} onChange={e => item(k, { qty: e.target.value })} /><button type="button" disabled={f.items.length < 2} onClick={() => up({ items: f.items.filter((_, j) => j !== k) })}>✕</button></div>)}
    <button type="button" className="mini" onClick={() => up({ items: [...f.items, { name: '', price: 0, qty: 1 }] })}>+ Add item</button>
    <div className="g2"><label>Items subtotal<input value={rs(sub)} readOnly /></label>{inp('delivery', 'Delivery charges (Rs)', 'number')}</div>
    <label>Total (auto-calculated; you can overwrite it, e.g. for a discount)<input type="number" min="0" step="any" value={f.total} onChange={e => up({ total: e.target.value })} /></label>
    <div className="g2"><label>Order status<select value={f.status} onChange={e => up({ status: e.target.value })}>{['New', 'Confirmed', 'On the way', 'Delivered', 'Cancelled'].map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Payment method<select value={f.paymentMethod} onChange={e => up({ paymentMethod: e.target.value })}><option value="cod">Cash on Delivery</option><option value="advance">Advance payment</option></select></label></div>
    <div className="g2"><label>Payment status<select value={f.paymentStatus} onChange={e => up({ paymentStatus: e.target.value })}><option>Unpaid</option><option>Paid</option></select></label>{inp('paymentRef', 'Transaction ID')}</div>
    {inp('paymentAccount', 'Paid to (account)')}
    {err && <p className="err">{err}</p>}<div className="row"><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save order'}</button><button type="button" className="btn ghost" onClick={() => onDone(false)}>Cancel</button></div></form>);
}
function Orders() {
  const [rows, setRows] = useState([]), [edit, setEdit] = useState(null); const load = () => api('orders').then(setRows); useEffect(() => { load(); }, []);
  return (<div className="list">{rows.map(o => <div key={o._id} className="card"><b>{o.name} · {o.phone}</b><small className="when">#{o._id.slice(-5).toUpperCase()} · {dt(o.createdAt)}</small><p>{o.address}{o.note && ` (${o.note})`}{o.lat != null && o.lng != null && <> · <a className="maplink" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${o.lat},${o.lng}`}>map</a></>}</p>
    <p>{o.items.map(i => `${i.name} ×${i.qty}`).join(', ')} — <b>{rs(o.total)}</b>{o.delivery != null && <small> (incl. {rs(o.delivery)} delivery)</small>}</p>
    <p><span className={'pill ' + (o.paymentStatus === 'Paid' ? 'ok' : o.paymentMethod === 'advance' ? 'warn' : '')}>{PAY[o.paymentMethod || 'cod']} · {o.paymentStatus || 'Unpaid'}</span>{o.paymentRef && <small> TID: {o.paymentRef}{o.paymentAccount && ' → ' + o.paymentAccount}</small>}</p>
    {edit === o._id ? <OrderEditor o={o} onDone={ch => { setEdit(null); ch && load(); }} /> : <>
      <button onClick={() => setEdit(o._id)}>Edit order</button>
      {o.paymentStatus !== 'Paid' && <button onClick={async () => { await api('orders/' + o._id, 'PUT', { paymentStatus: 'Paid' }); load(); }}>Mark as paid</button>}
      <select value={o.status} onChange={async e => { await api('orders/' + o._id, 'PUT', { status: e.target.value }); load(); }}>{['New', 'Confirmed', 'On the way', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}</select>
      <button onClick={async () => { if (confirm('Delete this order? This cannot be undone.')) { await api('orders/' + o._id, 'DELETE'); load(); } }}>Delete</button></>}</div>)}{!rows.length && <p>No orders yet.</p>}</div>);
}
function Customers() {
  const [rows, setRows] = useState([]), [err, setErr] = useState(''); const load = () => api('customers').then(setRows); useEffect(() => { load(); }, []);
  return (<div className="list">{err && <p className="err">{err}</p>}{rows.map(c => <div key={c._id} className="li"><div><b>{c.phone}{(c.name || c.firstName) && ' · ' + (c.name || c.firstName)}</b>{(c.street || c.email) && <small>{[c.street, c.email].filter(Boolean).join(' · ')}</small>}<small>Joined {dt(c.createdAt)}</small></div>
    <div><button onClick={async () => { if (confirm(`Delete customer ${c.phone}? Their past orders stay in Orders.`)) { try { await api('customers/' + c._id, 'DELETE'); load(); } catch (x) { setErr(x.message); } } }}>Delete</button></div></div>)}{!rows.length && <p>No signups yet.</p>}</div>);
}
function Account({ email, setEmail }) {
  const [f, setF] = useState({ currentPassword: '', email, newPassword: '' }), [m, setM] = useState('');
  const save = async e => { e.preventDefault(); try { const d = await api('admin/account', 'PUT', f); setEmail(d.email); setM('Saved. Use the new details next time you log in.'); setF({ ...f, currentPassword: '', newPassword: '' }); } catch (x) { setM(x.message); } };
  return (<form className="card narrow" onSubmit={save}><h3>Admin email & password</h3>
    <label>Admin Gmail / email<input type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
    <label>New password (leave empty to keep)<input type="password" value={f.newPassword} onChange={e => setF({ ...f, newPassword: e.target.value })} /></label>
    <label>Current password (required)<input type="password" required value={f.currentPassword} onChange={e => setF({ ...f, currentPassword: e.target.value })} /></label>
    {m && <p className="err">{m}</p>}<button className="btn">Save changes</button></form>);
}
function Shops() {
  const blank = { name: '', phone: '', email: '', password: '', active: true }, [rows, setRows] = useState([]), [f, setF] = useState(blank), [err, setErr] = useState(''), [ok, setOk] = useState('');
  const load = () => api('shops').then(setRows).catch(x => setErr(x.message)); useEffect(() => { load(); }, []);
  const save = async e => { e.preventDefault(); setErr(''); setOk(''); try { f._id ? await api('shops/' + f._id, 'PUT', f) : await api('shops', 'POST', f); setOk(f._id ? 'Saved.' : 'Vendor created. Give them the email and password: they sign in at the same /bd-admin page and only see their own products.'); setF(blank); load(); } catch (x) { setErr(x.message); } };
  return (<div className="two"><form className="card" onSubmit={save}><h3>{f._id ? 'Edit vendor' : 'Add vendor shop'}</h3>
    <label>Shop name<input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
    <label>Shop phone (optional)<input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></label>
    <label>Vendor login email<input type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
    <label>{f._id ? 'New password (leave empty to keep)' : 'Password (8+ characters)'}<input autoComplete="off" required={!f._id} minLength={f._id && !f.password ? 0 : 8} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>
    {f._id && <label>Shop is active (untick to block login and alerts)<input type="checkbox" checked={!!f.active} onChange={e => setF({ ...f, active: e.target.checked })} /></label>}
    {err && <p className="err">{err}</p>}{ok && <p className="okmsg">{ok}</p>}<button className="btn">{f._id ? 'Save' : 'Create vendor'}</button>{f._id && <button type="button" className="btn ghost" onClick={() => setF(blank)}>Cancel</button>}</form>
    <div className="list">{rows.map(r => <div key={r._id} className="li"><div><b>{r.name}</b><small>{r.email} · {r.products} products{r.phone && ' · ' + r.phone}</small><small>{r.active ? '🟢 Active' : '🔴 Disabled'}</small></div>
      <div><button onClick={() => { setOk(''); setF({ _id: r._id, name: r.name, phone: r.phone, email: r.email, password: '', active: r.active }); }}>Edit</button>
        <button onClick={async () => { if (confirm(`Delete "${r.name}" and its login? Its products stay but are set out of stock.`)) { await api('shops/' + r._id, 'DELETE'); load(); } }}>Delete</button></div></div>)}{!rows.length && <p>No vendors yet. Add your first shop.</p>}</div></div>);
}
function VendorAccount() {
  const [f, setF] = useState({ currentPassword: '', newPassword: '' }), [m, setM] = useState('');
  const save = async e => { e.preventDefault(); try { await api('vendor/account', 'PUT', f); setM('Password changed.'); setF({ currentPassword: '', newPassword: '' }); } catch (x) { setM(x.message); } };
  return (<form className="card narrow" onSubmit={save}><h3>Change my password</h3>
    <label>Current password<input type="password" required value={f.currentPassword} onChange={e => setF({ ...f, currentPassword: e.target.value })} /></label>
    <label>New password (8+ characters)<input type="password" required minLength={8} value={f.newPassword} onChange={e => setF({ ...f, newPassword: e.target.value })} /></label>
    {m && <p className="err">{m}</p>}<button className="btn">Save</button></form>);
}
const ADMIN_TABS = [['dashboard', 'Dashboard'], ['orders', 'Orders'], ['products', 'Products'], ['shops', 'Vendors'], ['banners', 'Banners'], ['categories', 'Categories'], ['reviews', 'Reviews'], ['customers', 'Customers'], ['logs', 'Activity log'], ['settings', 'Settings'], ['account', 'Account']];
const VENDOR_TABS = [['vproducts', 'My products'], ['vaccount', 'Account']];
export default function Admin() {
  const [email, setEmail] = useState(null), [role, setRole] = useState('admin'), [shopName, setShopName] = useState(''), [tab, setTab] = useState('dashboard'), [f, setF] = useState({ email: '', password: '' }), [err, setErr] = useState('');
  const who = d => { setEmail(d.email); setRole(d.role || 'admin'); setShopName(d.shopName || ''); };
  useEffect(() => { localStorage.getItem('bd_token') && api('admin/me').then(who).catch(() => localStorage.removeItem('bd_token')); }, []);
  const login = async e => { e.preventDefault(); try { const d = await api('admin/login', 'POST', f); localStorage.setItem('bd_token', d.token); who(d); setErr(''); } catch (x) { setErr(x.message); } };
  const logout = () => { localStorage.removeItem('bd_token'); setEmail(null); setRole('admin'); setTab('dashboard'); };
  if (!email) return (<div className="loginpage"><form className="login" onSubmit={login}><Logo /><h2>Sign in</h2>
    <input type="email" required placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
    <input type="password" required placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
    {err && <p className="err">{err}</p>}<button className="btn">Sign in</button></form></div>);
  // VENDOR: the ONLY things rendered are their own products and password. No admin component is even created for them (and the server refuses them anyway).
  if (role === 'vendor') { const t = tab === 'vaccount' ? 'vaccount' : 'vproducts';
    return (<div className="adm"><aside><Logo small /><b>{shopName}</b><small>{email}</small>{VENDOR_TABS.map(([k, n]) => <button key={k} className={t === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>)}<button onClick={logout}>Log out</button></aside>
      <main><h2>{t === 'vaccount' ? 'Account' : 'My products'}</h2>{t === 'vaccount' ? <VendorAccount /> : <><PushSetup /><Crud key="vp" path="vproducts" schema="vendorProducts" base="vendor/products" /></>}</main></div>); }
  return (<div className="adm"><aside><Logo small /><small>{email}</small>
    {ADMIN_TABS.map(([k, n]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>)}
    <button onClick={logout}>Log out</button></aside>
    <main><h2>{(ADMIN_TABS.find(x => x[0] === tab) || [, tab])[1]}</h2>{tab === 'dashboard' ? <Dashboard /> : tab === 'logs' ? <Logs /> : tab === 'orders' ? <Orders /> : tab === 'customers' ? <Customers /> : tab === 'shops' ? <Shops /> : tab === 'settings' ? <Settings /> : tab === 'account' ? <Account email={email} setEmail={setEmail} /> : <Crud key={tab} path={tab} />}</main></div>);
}
