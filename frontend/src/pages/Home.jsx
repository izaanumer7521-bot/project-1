import { useEffect, useState } from 'react';
import { api, CATS, PHONES } from '../utils/api.js';
import Logo from '../components/Logo.jsx'; import Welcome from '../components/Welcome.jsx'; import BannerSlider from '../components/BannerSlider.jsx';

const DEF = { area: 'Vihari City', deliveryTitle: 'Delivery: Today', deliverySub: 'Fast & safe delivery', phone1: PHONES[0], phone2: PHONES[1], hours: '7 AM – 12 AM', helpText: '', aboutUs: '', privacy: '' };
const TABS = [['home', '🏠', 'Home'], ['categories', '🗂️', 'Categories'], ['orders', '🧾', 'Orders'], ['cart', '🛒', 'Cart'], ['profile', '👤', 'Profile']];
const rs = n => 'Rs ' + Number(n || 0).toLocaleString();
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const Thumb = ({ item }) => <div className="thumb">{item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <span>{item.emoji || '📦'}</span>}</div>;

export default function Home() {
  const [banners, setB] = useState([]), [products, setP] = useState([]), [reviews, setR] = useState([]), [cats, setC] = useState([]), [S, setS] = useState(DEF);
  const [view, setView] = useState({ v: 'home' }), [q, setQ] = useState(''), [cq, setCq] = useState(''), [toast, setToast] = useState('');
  const [cart, setCart] = useState(() => jget('bd_cart', {})), [user, setUser] = useState(localStorage.getItem('bd_user')), [orders, setOrders] = useState(null), [placed, setPlaced] = useState(null);
  const [f, setF] = useState({ name: '', address: '', note: '' }), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const [show, setShow] = useState(!sessionStorage.getItem('bd_splash')), [authOpen, setAuthOpen] = useState(false), [help, setHelp] = useState(false), [inst, setInst] = useState(null);
  const [done, setDone] = useState(matchMedia('(display-mode: standalone)').matches);

  useEffect(() => {
    api('banners').then(d => setB(d.filter(b => b.active))).catch(() => {}); api('products').then(setP).catch(() => {}); api('reviews').then(setR).catch(() => {});
    api('categories').then(d => setC(d.filter(c => c.active !== false))).catch(() => {}); api('settings').then(d => setS({ ...DEF, ...d })).catch(() => {});
    history.replaceState({ v: 'home' }, ''); const pop = e => setView(e.state || { v: 'home' }); addEventListener('popstate', pop);
    const h = e => { e.preventDefault(); setInst(e); }; addEventListener('beforeinstallprompt', h); addEventListener('appinstalled', () => setDone(true));
    return () => { removeEventListener('popstate', pop); removeEventListener('beforeinstallprompt', h); };
  }, []);
  useEffect(() => { localStorage.setItem('bd_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (view.v === 'orders') { const ids = jget('bd_orders', []); ids.length ? api('orders/lookup', 'POST', { ids }).then(setOrders).catch(() => setOrders([])) : setOrders([]); } }, [view.v]);

  const list = cats.length ? cats : CATS.map(([key, emoji, name]) => ({ key, emoji, name }));
  const emojiOf = k => list.find(c => c.key === k)?.emoji;
  const nav = (v, extra = {}) => { const s = { v, ...extra }; history.pushState(s, ''); setView(s); scrollTo(0, 0); };
  const items = Object.values(cart), count = items.reduce((s, i) => s + i.qty, 0), total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const add = (p, d = 1) => { setCart(c => { const n = { ...c }, qty = (c[p._id]?.qty || 0) + d; if (qty <= 0) delete n[p._id]; else n[p._id] = { _id: p._id, name: p.name, price: p.price, qty, emoji: emojiOf(p.category), image: p.image }; return n; }); if (d > 0) { setToast(p.name + ' added'); setTimeout(() => setToast(''), 1100); } };
  const install = async () => { if (inst) { inst.prompt(); await inst.userChoice; setInst(null); } else setHelp(true); };
  const order = async e => {
    e.preventDefault(); setBusy(true); setMsg('');
    try { const d = await api('orders', 'POST', { ...f, phone: user || f.phone, items: items.map(({ name, price, qty }) => ({ name, price, qty })) });
      localStorage.setItem('bd_orders', JSON.stringify([d._id, ...jget('bd_orders', [])].slice(0, 30))); setCart({}); setPlaced(d); } catch (x) { setMsg(x.message); } setBusy(false);
  };

  const qty = p => { const n = cart[p._id]?.qty || 0; return n ? <div className="qty"><button onClick={() => add(p, -1)}>−</button>{n}<button onClick={() => add(p)}>+</button></div> : null; };
  const pcard = (p, deal) => { const pct = p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0, n = cart[p._id]?.qty || 0;
    return (<article className={'pc' + (deal ? ' deal' : '')} key={p._id}><div className="pci"><Thumb item={{ ...p, emoji: emojiOf(p.category) }} />{pct > 0 && <span className="off">⚡ {pct}% OFF</span>}
      {!deal && (n ? <div className="mini">{qty(p)}</div> : <button className="plus" aria-label={'Add ' + p.name} onClick={() => add(p)}>+</button>)}</div>
      <h4>{p.name}</h4><small>{p.description}</small>
      <div className="pr"><b>{rs(p.price)}</b>{p.oldPrice > p.price && <s>{rs(p.oldPrice)}</s>}<em>{p.unit}</em></div>
      {deal && (n ? <div className="dq">{qty(p)}</div> : <button className="btn sm" onClick={() => add(p)}>Add to cart →</button>)}</article>); };
  const section = (title, action, onAction, body, cls = '') => <section className={cls}><div className="sh"><h3>{title}</h3>{action && <button onClick={onAction}>{action}</button>}</div>{body}</section>;
  const avail = products.filter(p => p.available !== false);
  const best = avail.filter(p => p.bestSeller).length ? avail.filter(p => p.bestSeller) : avail.slice(0, 8), hot = avail.filter(p => p.hotDeal);
  const catCard = (c, cls) => <button key={c.key} className={cls} onClick={() => nav('catalog', { c: c.key })}><Thumb item={c} /><b>{c.name}</b><i>›</i></button>;
  const back = t => <div className="ptitle"><button className="back" aria-label="Back" onClick={() => history.back()}>‹</button><h2>{t}</h2></div>;
  const needle = q.trim().toLowerCase(), found = needle ? avail.filter(p => (p.name + ' ' + (p.description || '') + ' ' + (list.find(c => c.key === p.category)?.name || '')).toLowerCase().includes(needle)) : [];

  let page;
  if (view.v === 'home') page = (<>
    <div className="dcard"><div><em>📍</em><span><small>DELIVERING TO</small><b>{S.area}</b></span></div><div><em>🛵</em><span><b className="g">{S.deliveryTitle}</b><small>{S.deliverySub}</small></span></div></div>
    <div className="search"><span>🔍</span><input placeholder="Search products, categories…" value={q} onChange={e => setQ(e.target.value)} />{q && <button onClick={() => setQ('')}>✕</button>}</div>
    {needle ? section(`Results for “${q}”`, '', null, found.length ? <div className="pgrid">{found.map(p => pcard(p))}</div> : <p className="muted">Nothing found. Call us and we will bring it: {S.phone2}</p>) : <>
      <BannerSlider banners={banners} onCta={() => nav('categories')} />
      {section('Categories', 'View All', () => nav('categories'), <div className="hscroll">{list.map(c => catCard(c, 'ccard'))}</div>)}
      {section('Best Selling', 'View All', () => nav('categories'), <div className="hscroll">{best.map(p => pcard(p))}</div>)}
      {!!hot.length && <section className="hot"><div className="sh"><h3>🔥 Hot Deals</h3><span className="cnt">{hot.length}</span></div><p className="sub">Offers that cost less than usual</p><div className="hscroll">{hot.map(p => pcard(p, true))}</div></section>}
      <div className="demand"><div><h3>On demand service</h3><p>Jo Ap Kahein, Hum Le Aayen! Anything you ask for, we deliver.</p></div><a className="btn orange" href={`https://wa.me/92${S.phone1.slice(1)}`}>Tell us what you need</a></div>
      {!!reviews.length && section('What customers say', '', null, <div className="hscroll">{reviews.map(r => <blockquote key={r._id}><div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div><p>{r.text}</p><cite>{r.name}</cite></blockquote>)}</div>)}
      <div className="contact"><b>Call now</b><a href={`tel:${S.phone1}`}>{S.phone1}</a><a href={`tel:${S.phone2}`}>{S.phone2}</a><small>{S.hours} · {S.area}</small></div></>}
  </>);
  else if (view.v === 'categories') { const ls = list.filter(c => c.name.toLowerCase().includes(cq.toLowerCase()));
    page = (<>{back('All Categories')}<div className="search"><span>🔍</span><input placeholder="Search categories…" value={cq} onChange={e => setCq(e.target.value)} /></div><div className="cgrid">{ls.map(c => catCard(c, 'gcat'))}</div></>); }
  else if (view.v === 'catalog') { const c = list.find(x => x.key === view.c), ps = avail.filter(p => p.category === view.c);
    page = (<>{back(c?.name || 'Products')}{ps.length ? <div className="pgrid">{ps.map(p => pcard(p))}</div> : <p className="muted">No items here yet. Call us on {S.phone2} and we will get it for you.</p>}</>); }
  else if (view.v === 'cart') page = (<>{back('My Cart')}
    {placed ? <div className="okcard"><div>✅</div><h3>Order placed!</h3><p>We will call you shortly to confirm. Total {rs(placed.total)}.</p><button className="btn" onClick={() => { setPlaced(null); nav('orders'); }}>Track my order</button></div> :
    !items.length ? <div className="empty"><div>🛒</div><p>Your cart is empty</p><button className="btn" onClick={() => nav('categories')}>Start shopping</button></div> : <>
      <div className="cl">{items.map(i => <div key={i._id} className="ci2"><div className="th"><Thumb item={i} /></div><div><b>{i.name}</b><small>{rs(i.price)} each</small></div><div className="r"><b>{rs(i.qty * i.price)}</b>{qty(i)}</div></div>)}</div>
      <form className="checkout" onSubmit={order}><p className="tot">Total: {rs(total)}</p>
        <input required placeholder="Your name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input required inputMode="tel" placeholder="Phone number" value={user || f.phone || ''} readOnly={!!user} onChange={e => setF({ ...f, phone: e.target.value })} />
        <textarea required placeholder="Delivery address" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />
        <input placeholder="Note (optional)" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        {msg && <p className="err">{msg}</p>}<button className="btn big" disabled={busy}>{busy ? 'Placing…' : 'Place order'}</button></form></>}</>);
  else if (view.v === 'orders') page = (<>{back('My Orders')}{orders === null ? <p className="muted">Loading…</p> : !orders.length ? <div className="empty"><div>🧾</div><p>No orders yet</p><button className="btn" onClick={() => nav('categories')}>Order now</button></div> :
    orders.map(o => <div key={o._id} className="ocard"><div className="oh"><b>Order #{o._id.slice(-5).toUpperCase()}</b><span className="chip2" data-s={o.status}>{o.status}</span></div><small>{new Date(o.createdAt).toLocaleString()}</small>
      <p>{o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</p><b>{rs(o.total)}</b></div>)}</>);
  else if (view.v === 'page') { const T = { help: ['Help Center', S.helpText], about: ['About Us', S.aboutUs], privacy: ['Privacy Policy', S.privacy] }[view.page] || ['', ''];
    page = (<>{back(T[0])}<div className="doc"><p>{T[1]}</p>{view.page === 'help' && <div className="row"><a className="btn" href={`tel:${S.phone1}`}>📞 Call {S.phone1}</a><a className="btn orange" href={`https://wa.me/92${S.phone1.slice(1)}`}>WhatsApp</a></div>}</div></>); }
  else page = (<>
    <div className="phead"><h2>Profile</h2></div>
    <div className="pcard"><div className="av">{user ? '😊' : '＋'}</div><div><h3>Hello, {user ? user : 'Guest'} 👋</h3><p>{user ? 'You are signed in.' : 'Sign in for a faster, personalised experience.'}</p></div>
      {user ? <button className="btn big out" onClick={() => { localStorage.removeItem('bd_user'); setUser(null); }}>Log out</button> : <button className="btn big" onClick={() => setAuthOpen(true)}>Sign In / Register</button>}</div>
    <div className="perks"><small>EXCLUSIVE PERKS</small>
      {[['🏷️', 'Exclusive Deals & Offers', 'Special discounts and Hot Deals built for your area.'], ['🧾', 'Order Status Updates', 'See if your order is confirmed, on the way or delivered.'], ['⚡', 'Fast Checkout', 'Your mobile number is saved so ordering takes seconds.'], ['💬', 'Call & WhatsApp Support', `Talk to us any time, ${S.hours}.`]].map(([e, t, d]) => <div key={t} className="perk"><em>{e}</em><span><b>{t}</b><small>{d}</small></span></div>)}</div>
    <div className="menu">{[['help', '❓', 'Help Center'], ['about', 'ℹ️', 'About Us'], ['privacy', '🛡️', 'Privacy Policy']].map(([k, e, t]) => <button key={k} onClick={() => nav('page', { page: k })}><em>{e}</em><b>{t}</b><i>›</i></button>)}
      {!done && <button onClick={install}><em>⬇️</em><b>Install ByDoor app</b><i>›</i></button>}</div></>);

  return (<div className="app">
    {show && <Welcome needAuth={!localStorage.getItem('bd_user') && !localStorage.getItem('bd_skip')} onDone={() => { setShow(false); setUser(localStorage.getItem('bd_user')); }} />}
    {authOpen && <Welcome startAuth needAuth onDone={() => { setAuthOpen(false); setUser(localStorage.getItem('bd_user')); }} />}
    <header className="top"><button className="brand" aria-label="Home" onClick={() => nav('home')}><Logo small /></button>
      <nav className="dnav">{TABS.map(([k, e, n]) => <button key={k} className={view.v === k ? 'on' : ''} onClick={() => nav(k)}>{n}{k === 'cart' && count ? ` (${count})` : ''}</button>)}</nav>
      <div className="acts">{!done && <button className="instbtn" onClick={install}>⬇ <span>Install app</span></button>}</div></header>
    <main className="main" key={view.v + (view.c || '') + (view.page || '')}>{page}</main>
    <nav className="bnav">{TABS.map(([k, e, n]) => <button key={k} className={view.v === k ? 'on' : ''} onClick={() => nav(k)}><i>{e}</i><span>{n}</span>{k === 'cart' && count > 0 && <u className="badge">{count}</u>}</button>)}</nav>
    {help && <div className="drawer center"><div className="dbg" onClick={() => setHelp(false)} /><aside className="sheet"><h3>Install ByDoor app</h3><p><b>iPhone (Safari):</b> tap the Share button, then “Add to Home Screen”.</p><p><b>Android (Chrome):</b> tap the ⋮ menu, then “Install app” or “Add to Home screen”.</p><button className="btn" onClick={() => setHelp(false)}>Got it</button></aside></div>}
    {toast && <div className="toast">{toast}</div>}
  </div>);
}
