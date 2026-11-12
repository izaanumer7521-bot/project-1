import { useEffect, useState } from 'react';
import { api, CATS, PHONES, waLink } from '../utils/api.js'; import { WaIcon } from '../components/WhatsApp.jsx';
import ProfileSheet from '../components/ProfileSheet.jsx'; import Logo from '../components/Logo.jsx'; import Welcome from '../components/Welcome.jsx'; import ThemeToggle from '../components/ThemeToggle.jsx'; import BannerSlider from '../components/BannerSlider.jsx'; import CurveCats from '../components/CurveCats.jsx'; import PrescriptionOrder from '../components/PrescriptionOrder.jsx';

const DEF = { area: 'Vihari City', deliveryTitle: 'Delivery: Today', deliverySub: 'Fast & safe delivery', phone1: PHONES[0], phone2: PHONES[1], hours: '7 AM – 12 AM', helpText: '', aboutUs: '', privacy: '', terms: '', deliveryFee: 100, codEnabled: true, codNote: '', advanceEnabled: false, advanceNote: '', riderOnlineEnabled: true, riderOnlineNote: '', paymentAccounts: [] };
const ICON = { orders: ['M6 2h12v20l-3-2-3 2-3-2-3 2z', 'M9 7h6M9 11h6'], heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z'], pin: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'], user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'], bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'], help: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01'], info: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 16v-4M12 8h.01'], shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'], file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6M16 13H8M16 17H8'], logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5M21 12H9'], down: ['M12 3v12M7 10l5 5 5-5M5 21h14'], home: ['M3 10.5L12 3l9 7.5V21H3z', 'M9 21v-7h6v7'], grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'], cart: ['M6 6h15l-1.5 9h-12z', 'M6 6L5 3H2', 'M9 20.5h.01', 'M18 20.5h.01'], search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M21 21l-4.3-4.3'], filter: ['M4 6h16', 'M7 12h10', 'M10 18h4'] };
const Ico = ({ n, s = 22 }) => <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICON[n].map((d, i) => <path key={i} d={d} />)}</svg>;
const TABS = [['home', 'home', 'Home'], ['categories', 'grid', 'Categories'], ['orders', 'orders', 'Orders'], ['cart', 'cart', 'Cart'], ['profile', 'user', 'Profile']];
const rs = n => 'Rs ' + Number(n || 0).toLocaleString();
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const Thumb = ({ item }) => <div className="thumb">{item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <span>{item.emoji || '📦'}</span>}</div>;

export default function Home() {
  const [banners, setB] = useState([]), [products, setP] = useState([]), [reviews, setR] = useState([]), [cats, setC] = useState([]), [shops, setShops] = useState([]), [S, setS] = useState(DEF);
  const [view, setView] = useState({ v: 'home' }), [q, setQ] = useState(''), [sOpen, setSOpen] = useState(false), [sec, setSec] = useState('all'), [cq, setCq] = useState(''), [toast, setToast] = useState('');
  const [szSel, setSzSel] = useState({}), [flSel, setFlSel] = useState({}), [cart, setCart] = useState(() => jget('bd_cart', {})), [user, setUser] = useState(localStorage.getItem('bd_user')), [orders, setOrders] = useState(null), [placed, setPlaced] = useState(null);
  const [f, setF] = useState({ name: '', address: '', note: '' }), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false), [pay, setPay] = useState({ method: '', ref: '', account: '' });
  const [show, setShow] = useState(!sessionStorage.getItem('bd_splash')), [authOpen, setAuthOpen] = useState(false), [help, setHelp] = useState(false), [inst, setInst] = useState(null);
  const [profile, setProfile] = useState(null), [sheet, setSheet] = useState(false), [favs, setFavs] = useState(() => jget('bd_favs', []));
  const [done, setDone] = useState(matchMedia('(display-mode: standalone)').matches);
  const [sel, setSel] = useState('all'), [sort, setSort] = useState('pop'), [fopen, setFopen] = useState(false);

  useEffect(() => {
    api('banners').then(d => setB(d.filter(b => b.active))).catch(() => {}); api('products').then(setP).catch(() => {}); api('reviews').then(setR).catch(() => {}); api('shops/public').then(setShops).catch(() => {});
    api('categories').then(d => setC(d.filter(c => c.active !== false))).catch(() => {}); api('settings').then(d => setS({ ...DEF, ...d })).catch(() => {});
    history.replaceState({ v: 'home' }, ''); const pop = e => setView(e.state || { v: 'home' }); addEventListener('popstate', pop);
    const h = e => { e.preventDefault(); setInst(e); }; addEventListener('beforeinstallprompt', h); addEventListener('appinstalled', () => setDone(true));
    return () => { removeEventListener('popstate', pop); removeEventListener('beforeinstallprompt', h); };
  }, []);
  useEffect(() => { localStorage.setItem('bd_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('bd_favs', JSON.stringify(favs)); }, [favs]);
  // load the signed-in customer's profile (silently re-issues a token for accounts created before profiles existed)
  useEffect(() => {
    if (!user) { setProfile(null); return; } let dead = false;
    const relog = async () => { const d = await api('customers/login', 'POST', { phone: user }); localStorage.setItem('bd_ctoken', d.token); };
    (async () => { try { if (!localStorage.getItem('bd_ctoken')) await relog(); let p; try { p = await api('customers/me'); } catch { await relog(); p = await api('customers/me'); } if (!dead) setProfile(p); } catch {} })();
    return () => { dead = true; };
  }, [user]);
  useEffect(() => { if (!profile) return; setF(x => ({ ...x, name: x.name || [profile.firstName, profile.lastName].filter(Boolean).join(' '), address: x.address || (profile.defaultAddress ? profile.street : '') })); }, [profile]);
  useEffect(() => { if (view.v === 'orders' || view.v === 'notifications') { const ids = jget('bd_orders', []); ids.length ? api('orders/lookup', 'POST', { ids }).then(setOrders).catch(() => setOrders([])) : setOrders([]); } }, [view.v]);

  const list = cats.length ? cats : CATS.map(([key, emoji, name]) => ({ key, emoji, name }));
  const emojiOf = k => list.find(c => c.key === k)?.emoji;
  const nav = (v, extra = {}) => { setSOpen(false); setSec('all'); const s = { v, ...extra }; history.pushState(s, ''); setView(s); scrollTo(0, 0); };
  const items = Object.values(cart), count = items.reduce((s, i) => s + i.qty, 0), total = items.reduce((s, i) => s + i.qty * i.price, 0), fee = Number(S.deliveryFee ?? 100), grand = total + fee;
  const accts = (S.paymentAccounts || []).filter(a => a.accountNumber), advOn = !!S.advanceEnabled && accts.length > 0, codOn = S.codEnabled !== false || !advOn, rOn = S.riderOnlineEnabled !== false, method = pay.method === 'advance' && advOn ? 'advance' : pay.method === 'rider_online' && rOn ? 'rider_online' : pay.method === 'cod' && codOn ? 'cod' : codOn ? 'cod' : rOn ? 'rider_online' : 'advance';
  const copy = t => { try { navigator.clipboard.writeText(t); setMsg(''); } catch {} };
  const optOf = p => (p.options && p.options.length ? p.options.find(o => o.label === szSel[p._id]) || p.options[0] : null);
  const flOf = p => (p.flavors && p.flavors.length ? (p.flavors.includes(flSel[p._id]) ? flSel[p._id] : p.flavors[0]) : '');
  const add = (p, d = 1) => { const o = p.key ? null : optOf(p), fl = p.key ? '' : flOf(p), key = p.key || p._id + (o ? '|' + o.label : '') + (fl ? '~' + fl : ''); setCart(c => { const n = { ...c }, qty = (c[key]?.qty || 0) + d; if (qty <= 0) delete n[key]; else n[key] = p.key ? { ...c[key], qty } : { key, _id: p._id, name: p.name, option: o ? o.label : '', flavor: fl, price: o ? o.price : p.price, qty, emoji: emojiOf(p.category), image: p.image }; return n; }); if (d > 0) { setToast(p.name + ' added'); setTimeout(() => setToast(''), 1100); } };
  const install = async () => { if (inst) { inst.prompt(); await inst.userChoice; setInst(null); } else setHelp(true); };
  const order = async e => {
    e.preventDefault(); setMsg('');
    if (method === 'advance' && !pay.ref.trim()) return setMsg('Please send the payment first, then enter your transaction ID.');
    setBusy(true);
    try { const d = await api('orders', 'POST', { ...f, paymentMethod: method, paymentRef: pay.ref, paymentAccount: pay.account || (accts[0] ? accts[0].provider : ''), phone: user || f.phone, items: items.map(({ _id, name, qty, option, flavor }) => ({ _id, name, qty, option: option || '', flavor: flavor || '' })), ...(profile?.lat != null && f.address.trim() === (profile.street || '').trim() ? { lat: profile.lat, lng: profile.lng } : {}) });
      localStorage.setItem('bd_orders', JSON.stringify([d._id, ...jget('bd_orders', [])].slice(0, 30))); setCart({}); setPay({ method: '', ref: '', account: '' }); setPlaced(d); } catch (x) { setMsg(x.message); } setBusy(false);
  };

  const toggleFav = p => setFavs(a => a.includes(p._id) ? a.filter(x => x !== p._id) : [...a, p._id]);
  const welcomeDone = fresh => { setShow(false); setAuthOpen(false); setUser(localStorage.getItem('bd_user')); if (fresh) { nav('profile'); setSheet(true); } };
  const logout = () => { localStorage.removeItem('bd_user'); localStorage.removeItem('bd_ctoken'); setUser(null); setProfile(null); };
  const removeItem = k => setCart(c => { const n = { ...c }; delete n[k]; return n; });
  const cancelOrder = async o => { if (!confirm('Cancel this order?' + (o.paymentMethod === 'advance' && o.paymentStatus === 'Paid' ? ' We will contact you about your advance payment.' : ''))) return; try { const d = await api(`orders/${o._id}/cancel`, 'POST'); setOrders(os => os.map(x => (x._id === d._id ? d : x))); } catch (x) { alert(x.message); } };
  const keyOf = p => p.key || p._id + (optOf(p) ? '|' + optOf(p).label : '') + (flOf(p) ? '~' + flOf(p) : '');
  const qty = p => { const n = cart[keyOf(p)]?.qty || 0; return n ? <div className="qty"><button onClick={() => add(p, -1)}>−</button>{n}<button onClick={() => add(p)}>+</button></div> : null; };
  const pcard = (p, deal) => { const pct = p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0, n = cart[keyOf(p)]?.qty || 0, o = optOf(p), price = o ? o.price : p.price;
    return (<article className={'pc' + (deal ? ' deal' : '')} key={p._id}><div className="pci"><Thumb item={{ ...p, emoji: emojiOf(p.category) }} />{pct > 0 && <span className="off">⚡ {pct}% OFF</span>}<button className={'heart' + (favs.includes(p._id) ? ' on' : '')} aria-label="Favourite" onClick={() => toggleFav(p)}>{favs.includes(p._id) ? '♥' : '♡'}</button>
      {!deal && (n ? <div className="mini">{qty(p)}</div> : <button className="plus" aria-label={'Add ' + p.name} onClick={() => add(p)}>+</button>)}</div>
      <h4>{p.name}</h4>{shopOf(p.shopId) && <i className="stag">🏪 {shopOf(p.shopId).name}</i>}<small>{p.description}</small>
      {!!p.flavors?.length && <div className="flavs" role="radiogroup" aria-label="Choose flavour"><small>Flavour</small><div>{p.flavors.map(x => <button type="button" role="radio" aria-checked={flOf(p) === x} key={x} className={flOf(p) === x ? 'on' : ''} onClick={() => setFlSel(s => ({ ...s, [p._id]: x }))}>{x}</button>)}</div></div>}
      {!!p.options?.length && <div className="sizes" role="radiogroup" aria-label="Choose size">{p.options.map(x => <button type="button" role="radio" aria-checked={o.label === x.label} key={x.label} className={o.label === x.label ? 'on' : ''} onClick={() => setSzSel(s => ({ ...s, [p._id]: x.label }))}><span>{x.label}</span><b>{rs(x.price)}</b></button>)}</div>}
      <div className="pr"><b>{rs(price)}</b>{!o && p.oldPrice > p.price && <s>{rs(p.oldPrice)}</s>}<em>{p.unit}</em></div>
      {deal && (n ? <div className="dq">{qty(p)}</div> : <button className="btn sm" onClick={() => add(p)}>Add to cart →</button>)}</article>); };
  const section = (title, action, onAction, body, cls = '') => <section className={cls}><div className="sh"><h3>{title}</h3>{action && <button onClick={onAction}>{action}</button>}</div>{body}</section>;
  const avail = products.filter(p => p.available !== false);
  const shopOf = id => shops.find(x => String(x._id) === String(id)), PAL = ['#00c27a,#18b5d8', '#8b5cf6,#ff4f9a', '#ff8a3d,#ff4f9a', '#18b5d8,#8b5cf6', '#00c27a,#8bc34a', '#ff4f9a,#8b5cf6'];
  const shopsWith = shops.map((x, i) => ({ ...x, pal: PAL[i % PAL.length], items: avail.filter(p => String(p.shopId) === String(x._id)) })).map(x => ({ ...x, med: !!x.medical || x.category === 'medical' || (x.items.length > 0 && x.items.every(p => p.category === 'medical')) }));
  const av = (x, cls = '') => <span className={'shav ' + cls} style={{ background: `linear-gradient(135deg,${x.pal})` }}>{x.image ? <img src={x.image} alt={x.name} loading="lazy" /> : (x.name || '?').trim().slice(0, 1).toUpperCase()}</span>;
  const shopCard = x => <button key={x._id} className="shopc" onClick={() => nav('shop', { s: x._id })}>{av(x, 'xl')}<b>{x.name}</b><small>{x.items.length} item{x.items.length === 1 ? '' : 's'} · {[...new Set(x.items.map(p => emojiOf(p.category)).filter(Boolean))].slice(0, 4).join(' ')}</small>{x.med && <i className="rxtag">℞ Upload prescription</i>}<em>Open menu ›</em></button>;
  const best = avail.filter(p => p.bestSeller).length ? avail.filter(p => p.bestSeller) : avail.slice(0, 8), hot = avail.filter(p => p.hotDeal);
  const catCard = (c, cls) => <button key={c.key} className={cls} onClick={() => nav('catalog', { c: c.key })}><Thumb item={c} /><b>{c.name}</b><i>›</i></button>;
  const back = t => <div className="ptitle"><button className="back" aria-label="Back" onClick={() => history.back()}>‹</button><h2>{t}</h2></div>;
  const needle = q.trim().toLowerCase(), found = needle ? avail.filter(p => (p.name + ' ' + (p.description || '') + ' ' + (list.find(c => c.key === p.category)?.name || '')).toLowerCase().includes(needle)) : [];

  const selCat = sel === 'all' ? null : list.find(c => c.key === sel), arcItems = [{ key: 'all', name: 'All', emoji: '✨' }, ...list.map(c => ({ key: c.key, name: c.name, emoji: c.emoji, image: c.image }))];
  const inCat = (x, k) => k === 'all' || x.category === k || x.items.some(p => p.category === k), homeStores = shopsWith.filter(x => inCat(x, sel));
  const foundStores = needle ? shopsWith.filter(x => x.name.toLowerCase().includes(needle)) : [], foundItems = needle ? found : [], searchItems = needle ? found : avail;
  let ours = avail;

  let page;
  if (view.v === 'home') page = (<>
    <div className="hhead"><div className="loc"><span className="locic"><Ico n="pin" s={20} /></span><span><small>Delivery location</small><b>{S.area}</b></span></div>
      <div className="hbtns"><button className="ib" aria-label="Cart" onClick={() => nav('cart')}><Ico n="cart" s={21} />{count > 0 && <u className="badge2">{count}</u>}</button><button className="ib" aria-label="Notifications" onClick={() => nav('notifications')}><Ico n="bell" s={21} /></button></div></div>
    <h1 className="greet"><small>{user ? 'Welcome back 👋' : 'Assalam o Alaikum 👋'}</small>Everything you need, <em>delivered.</em></h1>
    <div className="srow"><div className="search hs"><span><Ico n="search" s={20} /></span><input placeholder="Search stores or items…" value={q} onFocus={() => setSOpen(true)} onChange={e => { setQ(e.target.value); setSOpen(true); }} />{(q || sOpen) && <button type="button" onClick={() => { setQ(''); setSOpen(false); }}>✕</button>}</div></div>
    <CurveCats items={arcItems} selected={null} onSelect={k => (k === 'all' ? nav('categories') : nav('catalog', { c: k }))} />
    {(needle || sOpen) ? <>{!!foundStores.length && section('Stores', '', null, <div className="storegrid">{foundStores.map(shopCard)}</div>)}
      {!!searchItems.length && section(needle ? `Items for “${q}”` : 'All items', '', null, <div className="pgrid">{searchItems.map(p => pcard(p))}</div>)}
      {!foundStores.length && !searchItems.length && <p className="muted">{needle ? `Nothing found for “${q}”. Try another name.` : 'No items in the store yet.'}</p>}</> : <>
      <BannerSlider banners={banners} onCta={() => nav('categories')} />
      {!!shopsWith.length ? <section id="shops"><div className="sh"><h3>🏪 {selCat ? selCat.name + ' Stores' : 'Stores'}</h3><span className="cnt">{homeStores.length}</span></div><p className="sub">Tap a store to see its menu</p>
        {homeStores.length ? <div className="storegrid">{homeStores.map(shopCard)}</div> : <p className="muted">No stores in this category yet.</p>}</section> : <p className="muted">Stores will appear here soon.</p>}
      
      {!!reviews.length && section('What customers say', '', null, <div className="hscroll">{reviews.map(r => <blockquote key={r._id}><div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div><p>{r.text}</p><cite>{r.name}</cite></blockquote>)}</div>)}
      <div className="contact"><b>Need help? Talk to us</b><a href={`tel:${S.phone1}`}>📞 {S.phone1}</a><a href={`tel:${S.phone2}`}>📞 {S.phone2}</a><a className="cwa" href={waLink(S.phone1, 'Hello ByDoor!')} target="_blank" rel="noopener noreferrer"><WaIcon size={18} /> Chat on WhatsApp</a><small>{S.hours} · {S.area}</small></div></>}
  </>);
  else if (view.v === 'shop') { const x = shopsWith.find(y => String(y._id) === String(view.s)), groups = x ? list.map(c => [c, x.items.filter(p => p.category === c.key)]).filter(g => g[1].length) : [], other = x ? x.items.filter(p => !list.some(c => c.key === p.category)) : [],
      secOf = p => (p.section || '').trim() || 'Other', secs = x ? [...new Set(x.items.map(p => (p.section || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)) : [], chips = secs.length ? [...secs, ...(x.items.some(p => !(p.section || '').trim()) ? ['Other'] : [])] : [],
      secGroups = (sec === 'all' || !chips.includes(sec) ? chips : [sec]).map(n => [n, x.items.filter(p => secOf(p) === n)]).filter(g => g[1].length);
    page = (<>{back(x?.name || 'Store')}{x ? <><div className="shophead">{av(x, 'lg')}<div><h3>{x.name}</h3><small>{x.items.length} item{x.items.length === 1 ? '' : 's'} · {S.area}</small></div></div>
      {x.med && <button type="button" className="rxcta" onClick={() => nav('rx', { s: x._id })}><span className="ic" aria-hidden="true">℞</span><span><b>Have a prescription?</b><small>Upload or take a photo, or just type the medicines. We deliver to your door.</small></span><em aria-hidden="true">›</em></button>}
      {x.med && !!x.items.length && <p className="sub-rx">Or browse medicines</p>}
      {chips.length > 0 && <div className="secbar" role="tablist">{['all', ...chips].map(n => <button key={n} type="button" className={sec === n || (n === 'all' && !chips.includes(sec)) ? 'on' : ''} onClick={() => setSec(n)}>{n === 'all' ? 'All' : n}</button>)}</div>}
      {chips.length ? secGroups.map(([n, ps]) => <section key={n} className="menucat"><div className="sh"><h3>{n}</h3><span className="cnt">{ps.length}</span></div><div className="pgrid">{ps.map(p => pcard(p))}</div></section>) : <>{groups.map(([c, ps]) => <section key={c.key} className="menucat"><div className="sh"><h3>{c.emoji} {c.name}</h3><span className="cnt">{ps.length}</span></div><div className="pgrid">{ps.map(p => pcard(p))}</div></section>)}
      {!!other.length && <div className="pgrid">{other.map(p => pcard(p))}</div>}</>}
      {!x.items.length && <p className="muted">This store has not added its menu yet.</p>}</> : <p className="muted">Loading store…</p>}</>); }
  else if (view.v === 'rx') { const x = shopsWith.find(y => String(y._id) === String(view.s));
    page = x ? <PrescriptionOrder key={x._id} shop={x} S={S} user={user} profile={profile} onBack={() => history.back()} onTrack={() => nav('orders')} remember={id => localStorage.setItem('bd_orders', JSON.stringify([id, ...jget('bd_orders', [])].slice(0, 30)))} /> : <>{back('Prescription order')}<p className="muted">Loading store…</p></>; }
  else if (view.v === 'categories') { const ls = list.filter(c => c.name.toLowerCase().includes(cq.toLowerCase()));
    page = (<>{back('All Categories')}<div className="search"><span>🔍</span><input placeholder="Search categories…" value={cq} onChange={e => setCq(e.target.value)} /></div><div className="cgrid">{ls.map(c => catCard(c, 'gcat'))}</div></>); }
  else if (view.v === 'catalog') { const c = list.find(x => x.key === view.c), st = shopsWith.filter(x => inCat(x, view.c));
    page = (<>{back(c ? c.name + ' Stores' : 'Stores')}{st.length ? <div className="storegrid">{st.map(shopCard)}</div> : <p className="muted">No stores in this category yet.</p>}</>); }
  else if (view.v === 'cart') page = (<>{back('My Cart')}
    {placed ? <div className="receipt"><div className="rc-ok"><div>✅</div><h3>Order placed!</h3><p>Your order has been sent to us. We will call you shortly to confirm.</p></div>
      <div className="rc-card"><div className="rc-h"><b>Order #{placed._id.slice(-5).toUpperCase()}</b><small>{new Date(placed.createdAt).toLocaleString()}</small></div>
        <div className="rc-sec"><small>DELIVER TO</small><b>{placed.name}</b><p>{placed.phone}</p><p>{placed.address}</p>{placed.note && <p>Note: {placed.note}</p>}</div>
        <div className="rc-sec"><small>ORDER DETAILS</small>{placed.items.map((i, k) => <div className="rc-row" key={k}><span>{i.name} <em>× {i.qty}</em></span><b>{rs(i.price * i.qty)}</b></div>)}</div>
        <div className="rc-sec tot"><div className="rc-row"><span>Subtotal</span><b>{rs(placed.subtotal)}</b></div><div className="rc-row"><span>Delivery charges</span><b>{rs(placed.delivery)}</b></div><div className="rc-row grand"><span>Total</span><b>{rs(placed.total)}</b></div><div className="rc-row"><span>Payment</span><b>{placed.paymentMethod === 'advance' ? 'Advance (we will verify your payment)' : placed.paymentMethod === 'rider_online' ? 'Online payment to rider on delivery' : 'Cash on Delivery'}</b></div></div></div>
      <div className="row"><button className="btn" onClick={() => { setPlaced(null); nav('orders'); }}>Track my order</button><button className="btn ghost" onClick={() => { setPlaced(null); nav('home'); }}>Continue shopping</button></div></div> :
    !items.length ? <><div className="empty"><div>🛒</div><p>Your cart is empty</p><button className="btn" onClick={() => nav('categories')}>Start shopping</button></div></> : <>
      <div className="cl">{items.map(i => <div key={i.key || i._id} className="ci2"><div className="th"><Thumb item={i} /></div><div><b>{i.name}{i.option && <em className="szt">{i.option}</em>}{i.flavor && <em className="szt flt">{i.flavor}</em>}</b><small>{rs(i.price)} each</small></div><div className="r"><b>{rs(i.qty * i.price)}</b>{qty(i)}<button type="button" className="rm" onClick={() => removeItem(i.key || i._id)}>🗑 Remove</button></div></div>)}</div>
      <button type="button" className="clearcart" onClick={() => confirm('Remove everything from your cart?') && setCart({})}>Clear cart</button>
      <form className="checkout" onSubmit={order}><div className="sumbox"><div><span>Subtotal</span><b>{rs(total)}</b></div><div><span>Delivery charges</span><b>{rs(fee)}</b></div><div className="grand"><span>Total</span><b>{rs(grand)}</b></div></div>
        <input required placeholder="Your name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input required inputMode="tel" placeholder="Phone number" value={user || f.phone || ''} readOnly={!!user} onChange={e => setF({ ...f, phone: e.target.value })} />
        <textarea required placeholder="Delivery address" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />
        <input placeholder="Note (optional)" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        <div className="paybox"><b>Payment method</b>
          {codOn && <label className={'payopt' + (method === 'cod' ? ' on' : '')}><input type="radio" name="pm" checked={method === 'cod'} onChange={() => setPay({ ...pay, method: 'cod' })} /><span><b>Cash on Delivery</b><small>{S.codNote || 'Pay in cash when your order arrives.'}</small></span></label>}
          {rOn && <label className={'payopt' + (method === 'rider_online' ? ' on' : '')}><input type="radio" name="pm" checked={method === 'rider_online'} onChange={() => setPay({ ...pay, method: 'rider_online' })} /><span><b>Online Payment</b><small>Pay online (bank / e-wallet) to the rider when your order arrives.</small></span></label>}
          {advOn && <label className={'payopt' + (method === 'advance' ? ' on' : '')}><input type="radio" name="pm" checked={method === 'advance'} onChange={() => setPay({ ...pay, method: 'advance' })} /><span><b>Advance payment</b><small>Pay by bank transfer or e-wallet before we deliver.</small></span></label>}
          {method === 'rider_online' && <div className="payacct"><p>{S.riderOnlineNote || 'When the rider comes, you will pay online to him.'} <b>Amount: {rs(grand)}</b></p></div>}
          {method === 'advance' && <div className="payacct"><p>{S.advanceNote || 'Send the total amount to one of the accounts below, then enter the transaction ID.'} <b>Amount: {rs(grand)}</b></p>
            {accts.map((a, k) => <div key={k} className="acrow"><div><b>{a.provider || (a.kind === 'ewallet' ? 'E-wallet' : 'Bank')}</b><small>{a.accountTitle}{a.note && ' · ' + a.note}</small><b>{a.accountNumber}</b></div><button type="button" onClick={() => copy(a.accountNumber)}>Copy</button></div>)}
            {accts.length > 1 && <select value={pay.account} onChange={e => setPay({ ...pay, account: e.target.value })}><option value="">Which account did you pay?</option>{accts.map((a, k) => <option key={k} value={a.provider}>{a.provider}</option>)}</select>}
            <input required placeholder="Transaction ID / reference number" value={pay.ref} onChange={e => setPay({ ...pay, ref: e.target.value })} /></div>}
        </div>
        {msg && <p className="err">{msg}</p>}<button className="btn big" disabled={busy}>{busy ? 'Placing…' : 'Place order · ' + rs(grand)}</button></form></>}</>);
  else if (view.v === 'orders') page = (<>{back('My Orders')}{orders === null ? <p className="muted">Loading…</p> : !orders.length ? <div className="empty"><div>🧾</div><p>No orders yet</p><button className="btn" onClick={() => nav('categories')}>Order now</button></div> :
    orders.map(o => <div key={o._id} className="ocard"><div className="oh"><b>Order #{o._id.slice(-5).toUpperCase()}</b><span className="chip2" data-s={o.status}>{o.status}</span></div><small>{new Date(o.createdAt).toLocaleString()}</small>
      <p>{o.kind === 'prescription' && <span className="rxbadge">℞ Prescription</span>} {o.kind === 'prescription' && o.rxMode === 'photo' ? 'Prescription photo sent to the pharmacy' : o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</p><b>{o.kind === 'prescription' && !o.subtotal ? 'Price confirmed on call' : rs(o.total)}</b>{['New', 'Confirmed'].includes(o.status) && <button type="button" className="cancelbtn" onClick={() => cancelOrder(o)}>✕ Cancel order</button>}</div>)}</>);
  else if (view.v === 'page') { const T = { help: ['Help Center', S.helpText], about: ['About Us', S.aboutUs], privacy: ['Privacy Policy', S.privacy], terms: ['Terms & Conditions', S.terms] }[view.page] || ['', ''];
    page = (<>{back(T[0])}<div className="doc"><p>{T[1]}</p>{view.page === 'help' && <div className="row"><a className="btn" href={`tel:${S.phone1}`}>📞 Call {S.phone1}</a></div>}</div></>); }
  else if (view.v === 'favourites') { const fp = avail.filter(p => favs.includes(p._id));
    page = (<>{back('My Favourites')}{fp.length ? <div className="pgrid">{fp.map(p => pcard(p))}</div> : <div className="empty"><div>♡</div><p>No favourites yet. Tap the heart on any product.</p><button className="btn" onClick={() => nav('categories')}>Browse products</button></div>}</>); }
  else if (view.v === 'addresses') page = (<>{back('My Addresses')}{profile?.street ? <div className="addr"><span className="pin"><Ico n="pin" /></span><div><b>Delivery address{profile.defaultAddress && <em className="def">Default</em>}</b><p>{profile.street}</p><small>Pinned at {Number(profile.lat).toFixed(5)}, {Number(profile.lng).toFixed(5)}</small></div><button className="btn sm" onClick={() => setSheet(true)}>Edit</button></div> :
    <div className="empty"><div>📍</div><p>{user ? 'You have not saved an address yet' : 'Sign in to save your delivery address'}</p><button className="btn" onClick={() => user ? setSheet(true) : setAuthOpen(true)}>{user ? 'Add address' : 'Sign In / Register'}</button></div>}</>);
  else if (view.v === 'notifications') page = (<>{back('Notifications')}{orders === null ? <p className="muted">Loading…</p> : !orders.length ? <div className="empty"><div>🔔</div><p>No notifications yet. Order updates will appear here.</p></div> :
    orders.map(o => <div key={o._id} className="ocard"><div className="oh"><b>Order #{o._id.slice(-5).toUpperCase()}</b><span className="chip2" data-s={o.status}>{o.status}</span></div><small>{new Date(o.updatedAt || o.createdAt).toLocaleString()}</small><p>Your order is now <b>{o.status}</b>.</p></div>)}</>);
  else { const pname = profile && (profile.firstName || profile.lastName) ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : user;
    const have = profile ? [profile.firstName, profile.lastName, profile.street, profile.email].filter(Boolean).length : 0, incomplete = !!user && !!profile && !(profile.firstName && profile.lastName && profile.street);
    const rows = [['orders', 'My Orders', 'c-purple', () => nav('orders')], ['heart', 'My Favourites', 'c-magenta', () => nav('favourites')], ['pin', 'My Addresses', 'c-red', () => nav('addresses')], ['user', 'Personal Details', 'c-indigo', () => user ? setSheet(true) : setAuthOpen(true)], ['bell', 'Notifications', 'c-pink', () => nav('notifications')],
      ['help', 'Help Center', 'c-orange', () => nav('page', { page: 'help' })], ['info', 'About Us', 'c-teal', () => nav('page', { page: 'about' })], ['shield', 'Privacy Policy', 'c-blue', () => nav('page', { page: 'privacy' })], ['file', 'Terms & Conditions', 'c-gray', () => nav('page', { page: 'terms' })],
      ...(!done ? [['down', 'Install ByDoor app', 'c-green', install]] : []), ...(user ? [['logout', 'Logout', 'c-out', logout]] : [])];
    page = (<>
      <div className="phead"><h2>Profile</h2></div>
      <div className="pcard"><div className="av">{user ? '😊' : '＋'}</div><div><h3>Hello, {user ? pname : 'Guest'} 👋</h3><p>{user ? (profile?.firstName ? user : 'You are signed in.') : 'Sign in to save your details and order faster.'}</p></div>
        {!user && <button className="btn big" onClick={() => setAuthOpen(true)}>Sign In / Register</button>}</div>
      {incomplete && <button className="pbanner" onClick={() => setSheet(true)}><span className="bi"><Ico n="user" /></span><span className="bt"><b>Complete your profile</b><small>Add your First name, Last name, Address and Email so orders reach you.</small><i className="bar"><u style={{ width: have * 25 + '%' }} /></i></span><em>›</em></button>}
      <div className="pstats">{[['Orders', jget('bd_orders', []).length], ['Favorites', favs.length], ['Addresses', profile?.street ? 1 : 0]].map(([l, n]) => <div key={l}><small>{l}</small><b>{n}</b></div>)}</div>
      <div className="pmenu">{rows.map(([ic, t, c, fn]) => <button key={t} className={c} onClick={fn}><span className="ic"><Ico n={ic} /></span><b>{t}</b><i>›</i></button>)}</div></>); }

  return (<div className="app">
    {(show || authOpen) && <ThemeToggle float="welcome" />}
    {show && <Welcome needAuth={!localStorage.getItem('bd_user') && !localStorage.getItem('bd_skip')} onDone={welcomeDone} />}
    {authOpen && <Welcome startAuth needAuth onDone={welcomeDone} />}
    <header className="top"><button className="brand" aria-label="Home" onClick={() => nav('home')}><Logo small /></button>
      <nav className="dnav">{TABS.map(([k, e, n]) => <button key={k} className={view.v === k ? 'on' : ''} onClick={() => nav(k)}>{n}{k === 'cart' && count ? ` (${count})` : ''}</button>)}</nav>
      <div className="acts"><a className="hwa" aria-label="WhatsApp" href={waLink(S.phone1, 'Hello ByDoor!')} target="_blank" rel="noopener noreferrer"><WaIcon size={20} /></a><ThemeToggle />{!done && <button className="instbtn" onClick={install}>⬇ <span>Install app</span></button>}</div></header>
    <main className="main" key={view.v + (view.c || '') + (view.page || '')}>{page}</main>
    <nav className="bnav">{TABS.map(([k, e, n]) => <button key={k} className={view.v === k ? 'on' : ''} onClick={() => nav(k)}><i><Ico n={e} s={21} /></i><span>{n}</span>{k === 'cart' && count > 0 && <u className="badge">{count}</u>}</button>)}</nav>
    {help && <div className="drawer center"><div className="dbg" onClick={() => setHelp(false)} /><aside className="sheet"><h3>Install ByDoor app</h3><p><b>iPhone (Safari):</b> tap the Share button, then “Add to Home Screen”.</p><p><b>Android (Chrome):</b> tap the ⋮ menu, then “Install app” or “Add to Home screen”.</p><button className="btn" onClick={() => setHelp(false)}>Got it</button></aside></div>}
    {sheet && <ProfileSheet profile={profile} onClose={() => setSheet(false)} onSaved={p => { setProfile(p); setSheet(false); setToast('Profile saved'); setTimeout(() => setToast(''), 1400); }} />}
    {toast && <div className="toast">{toast}</div>}
  </div>);
}
