import { useEffect, useState } from 'react'; import { api, CATS } from '../utils/api.js'; import Logo from '../components/Logo.jsx';
const catOpts = CATS.map(c => [c[0], c[2]]);
const SCHEMA = {
  banners: [['title', 'Title'], ['subtitle', 'Subtitle'], ['image', 'Banner image (best size 1200×600 px, keep text in the centre)', 'image', 1200], ['showText', 'Show title on top of the image', 'bool'], ['sort', 'Order (1 = first)', 'number'], ['active', 'Show on website', 'bool']],
  products: [['name', 'Name'], ['category', 'Category', 'select', 'cats'], ['price', 'Price (Rs)', 'number'], ['oldPrice', 'Old price (optional, shows a % OFF badge)', 'number'], ['unit', 'Unit (per kg, each…)'], ['image', 'Photo', 'image', 600], ['description', 'Description'], ['bestSeller', 'Show in Best Selling', 'bool'], ['hotDeal', 'Show in Hot Deals', 'bool'], ['available', 'In stock', 'bool']],
  reviews: [['name', 'Customer name'], ['rating', 'Rating (1-5)', 'number'], ['text', 'Review', 'area']],
  categories: [['name', 'Name'], ['key', 'Short code (small letters, no spaces)'], ['emoji', 'Emoji icon (used when no photo)'], ['image', 'Photo (optional)', 'image', 500], ['sort', 'Order (1 = first)', 'number'], ['active', 'Show on website', 'bool']],
};
function ImageInput({ value, onChange, max = 800 }) {
  const pick = e => { const file = e.target.files[0]; if (!file) return; const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / im.width), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); onChange(c.toDataURL('image/jpeg', 0.78)); }; im.src = r.result; }; r.readAsDataURL(file); };
  return (<div className="imgin">{value && <img src={value} alt="" />}<input type="file" accept="image/*" onChange={pick} />
    <input placeholder="…or paste an image link" value={value && !value.startsWith('data:') ? value : ''} onChange={e => onChange(e.target.value)} />{value && <button type="button" onClick={() => onChange('')}>Remove image</button>}</div>);
}
const SET = [['area', 'Delivering to (area)'], ['deliveryTitle', 'Delivery headline (e.g. Delivery: Today)'], ['deliverySub', 'Delivery sub-text'], ['phone1', 'Phone / WhatsApp 1'], ['phone2', 'Phone 2'], ['hours', 'Opening hours'], ['deliveryFee', 'Delivery charges (Rs)'], ['helpText', 'Help Center text', 'area'], ['aboutUs', 'About Us text', 'area'], ['privacy', 'Privacy Policy text', 'area'], ['terms', 'Terms & Conditions text', 'area']];
function Settings() {
  const [f, setF] = useState(null), [m, setM] = useState(''); useEffect(() => { api('settings').then(setF); }, []);
  const save = async e => { e.preventDefault(); try { setF(await api('settings', 'PUT', f)); setM('Saved. The app shows the new settings now.'); } catch (x) { setM(x.message); } };
  if (!f) return <p>Loading…</p>;
  return (<form className="card narrow" onSubmit={save}><h3>App settings</h3>{SET.map(([k, l, t]) => <label key={k}>{l}{t === 'area' ? <textarea rows="4" value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} /> : <input value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} />}</label>)}
    {m && <p className="err">{m}</p>}<button className="btn">Save settings</button></form>);
}
function Crud({ path }) {
  const fields = SCHEMA[path], blank = Object.fromEntries(fields.map(([k, , t]) => [k, t === 'bool' ? true : '']));
  const [rows, setRows] = useState([]), [f, setF] = useState(blank), [err, setErr] = useState(''), [cats, setCats] = useState([]);
  const load = () => api(path).then(setRows); useEffect(() => { setF(blank); load(); api('categories').then(d => setCats(d.map(c => [c.key, c.name]))); }, [path]);
  const save = async e => { e.preventDefault(); try { f._id ? await api(`${path}/${f._id}`, 'PUT', f) : await api(path, 'POST', f); setF(blank); setErr(''); load(); } catch (x) { setErr(x.message); } };
  return (<div className="two"><form className="card" onSubmit={save}><h3>{f._id ? 'Edit' : 'Add new'}</h3>
    {fields.map(([k, l, t, o]) => <label key={k}>{l}{t === 'bool' ? <input type="checkbox" checked={!!f[k]} onChange={e => setF({ ...f, [k]: e.target.checked })} />
      : t === 'select' ? <select required value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })}><option value="">Choose…</option>{(o === 'cats' ? cats : o).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
      : t === 'image' ? <ImageInput value={f[k]} max={o} onChange={v => setF({ ...f, [k]: v })} />
      : t === 'area' ? <textarea value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />
      : <input type={t || 'text'} value={f[k] ?? ''} onChange={e => setF({ ...f, [k]: t === 'number' ? +e.target.value : e.target.value })} />}</label>)}
    {err && <p className="err">{err}</p>}<button className="btn">Save</button>{f._id && <button type="button" className="btn ghost" onClick={() => setF(blank)}>Cancel</button>}</form>
    <div className="list">{rows.map(r => <div key={r._id} className="li"><div className="lt">{r.image ? <img src={r.image} alt="" /> : r.emoji ? <em>{r.emoji}</em> : null}<span><b>{r.name || r.title}</b><small>{r.price ? `Rs ${r.price} · ${r.category}` : r.text || r.subtitle}</small></span></div>
      <div><button onClick={() => setF(r)}>Edit</button><button onClick={async () => { if (confirm('Delete this item?')) { await api(`${path}/${r._id}`, 'DELETE'); load(); } }}>Delete</button></div></div>)}
      {!rows.length && <p>Nothing here yet. Add your first one.</p>}</div></div>);
}
function Orders() {
  const [rows, setRows] = useState([]); const load = () => api('orders').then(setRows); useEffect(() => { load(); }, []);
  return (<div className="list">{rows.map(o => <div key={o._id} className="card"><b>{o.name} · {o.phone}</b><p>{o.address}{o.note && ` (${o.note})`}</p>
    <p>{o.items.map(i => `${i.name} ×${i.qty}`).join(', ')} — <b>Rs {o.total}</b></p>
    <select value={o.status} onChange={async e => { await api('orders/' + o._id, 'PUT', { status: e.target.value }); load(); }}>{['New', 'Confirmed', 'On the way', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}</select>
    <button onClick={async () => { await api('orders/' + o._id, 'DELETE'); load(); }}>Delete</button></div>)}{!rows.length && <p>No orders yet.</p>}</div>);
}
function Customers() {
  const [rows, setRows] = useState([]); useEffect(() => { api('customers').then(setRows); }, []);
  return (<div className="list">{rows.map(c => <div key={c._id} className="li"><b>{c.phone}</b><small>{new Date(c.createdAt).toLocaleString()}</small></div>)}{!rows.length && <p>No signups yet.</p>}</div>);
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
export default function Admin() {
  const [email, setEmail] = useState(null), [tab, setTab] = useState('orders'), [f, setF] = useState({ email: '', password: '' }), [err, setErr] = useState('');
  useEffect(() => { localStorage.getItem('bd_token') && api('admin/me').then(d => setEmail(d.email)).catch(() => localStorage.removeItem('bd_token')); }, []);
  const login = async e => { e.preventDefault(); try { const d = await api('admin/login', 'POST', f); localStorage.setItem('bd_token', d.token); setEmail(d.email); } catch (x) { setErr(x.message); } };
  if (!email) return (<div className="loginpage"><form className="login" onSubmit={login}><Logo /><h2>Admin sign in</h2>
    <input type="email" required placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
    <input type="password" required placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
    {err && <p className="err">{err}</p>}<button className="btn">Sign in</button></form></div>);
  return (<div className="adm"><aside><Logo small /><small>{email}</small>
    {[['orders', 'Orders'], ['products', 'Products'], ['banners', 'Banners'], ['categories', 'Categories'], ['reviews', 'Reviews'], ['customers', 'Customers'], ['settings', 'Settings'], ['account', 'Account']].map(([k, n]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>)}
    <button onClick={() => { localStorage.removeItem('bd_token'); setEmail(null); }}>Log out</button></aside>
    <main><h2>{tab[0].toUpperCase() + tab.slice(1)}</h2>{tab === 'orders' ? <Orders /> : tab === 'customers' ? <Customers /> : tab === 'settings' ? <Settings /> : tab === 'account' ? <Account email={email} setEmail={setEmail} /> : <Crud key={tab} path={tab} />}</main></div>);
}
