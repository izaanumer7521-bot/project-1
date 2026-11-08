import { useEffect, useState } from 'react'; import { api, CATS, PHONES } from '../utils/api.js'; import Logo from '../components/Logo.jsx';
const wa = `https://wa.me/92${PHONES[0].slice(1)}`;
export default function Home() {
  const [banners, setB] = useState([]), [products, setP] = useState([]), [reviews, setR] = useState([]);
  const [cat, setCat] = useState('all'), [cart, setCart] = useState({}), [open, setOpen] = useState(false), [bi, setBi] = useState(0);
  const [f, setF] = useState({ name: '', phone: '', address: '', note: '' }), [msg, setMsg] = useState('');
  useEffect(() => { api('banners').then(d => setB(d.filter(b => b.active))); api('products').then(setP); api('reviews').then(setR); }, []);
  useEffect(() => { const t = setInterval(() => setBi(i => i + 1), 5000); return () => clearInterval(t); }, []);
  const shown = products.filter(p => p.available && (cat === 'all' || p.category === cat));
  const items = Object.values(cart), count = items.reduce((s, i) => s + i.qty, 0), total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const add = (p, d = 1) => setCart(c => { const q = (c[p._id]?.qty || 0) + d, n = { ...c }; if (q <= 0) delete n[p._id]; else n[p._id] = { name: p.name, price: p.price, qty: q, _id: p._id }; return n; });
  const order = async e => { e.preventDefault(); try { await api('orders', 'POST', { ...f, items }); setCart({}); setMsg('Order placed! We will call you shortly to confirm.'); } catch (x) { setMsg(x.message); } };
  const b = banners.length ? banners[bi % banners.length] : null;
  return (<>
    <header className="top"><Logo small /><nav><a href="#services">Services</a><a href="#menu">Order</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a></nav>
      <button className="cartbtn" onClick={() => setOpen(true)}>🛒 Cart ({count})</button></header>
    <section className="hero" style={b?.image ? { backgroundImage: `linear-gradient(90deg,#0b3d1f ,#0b3d1fcc 45%,transparent),url(${b.image})` } : {}}>
      <div className="wrap"><p className="chip">Online Shopping Made Easy</p><h1>{b?.title || 'Har Zaroorat, Ab Aapke Ghar Tak!'}</h1><p>{b?.subtitle}</p>
        <div className="row"><a className="btn" href="#menu">Order now</a><a className="btn ghost" href={`tel:${PHONES[1]}`}>Call {PHONES[1]}</a></div>
        <div className="dots">{banners.map((_, i) => <i key={i} className={i === bi % banners.length ? 'on' : ''} onClick={() => setBi(i)} />)}</div></div></section>
    <div className="strip"><span>Everything you need</span><span>One place</span><span>One call</span><span>Fast & safe delivery · 7 AM – 12 AM</span></div>
    <section id="services" className="wrap sec"><h2>Services menu</h2><div className="grid cats">
      {CATS.map(([k, e, n], i) => <button key={k} className="cat" onClick={() => { setCat(k); location.hash = 'menu'; }}><span>{e}</span><b>{i + 1}. {n}</b></button>)}</div>
      <div className="demand"><div><h3>On demand service</h3><p>Jo Ap Kahein, Hum Le Aayen! Anything you ask for, we deliver.</p></div><a className="btn orange" href={wa}>Tell us what you need</a></div></section>
    <section id="menu" className="wrap sec"><h2>Order online</h2>
      <div className="tabs"><button className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>All</button>{CATS.map(([k, e, n]) => <button key={k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>{e} {n}</button>)}</div>
      <div className="grid prods">{shown.map(p => <article key={p._id} className="prod">
        <div className="pimg">{p.image ? <img src={p.image} alt={p.name} /> : <span>{CATS.find(c => c[0] === p.category)?.[1] || '📦'}</span>}</div>
        <h4>{p.name}</h4><small>{p.description}</small><div className="pfoot"><b>Rs {p.price}<em> / {p.unit}</em></b>
          {cart[p._id] ? <div className="qty"><button onClick={() => add(p, -1)}>−</button>{cart[p._id].qty}<button onClick={() => add(p)}>+</button></div> : <button className="btn sm" onClick={() => add(p)}>Add</button>}</div></article>)}
        {!shown.length && <p>No items here yet. Call us and we will get it for you.</p>}</div></section>
    <section id="reviews" className="wrap sec"><h2>What customers say</h2><div className="grid revs">{reviews.map(r => <blockquote key={r._id}>
      <div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div><p>{r.text}</p><cite>{r.name}</cite></blockquote>)}</div></section>
    <footer id="contact"><div className="wrap fgrid"><div><Logo /><p>Aapki Zaroorat, Hamari Zimmedari.</p></div>
      <div><h4>Call now</h4>{PHONES.map(p => <a key={p} href={`tel:${p}`}>{p}</a>)}<a href={wa}>WhatsApp us</a></div><div><h4>Hours</h4><p>7 AM – 12 AM</p><p>Vihari City</p></div></div>
      <p className="copy">Order Now · Reliable · Quick · Trusted · ByDoor EXPRESS</p></footer>
    {open && <div className="drawer"><div className="dbg" onClick={() => setOpen(false)} /><aside><h3>Your cart <button onClick={() => setOpen(false)}>✕</button></h3>
      {items.map(i => <div key={i._id} className="ci"><span>{i.name} × {i.qty}</span><b>Rs {i.qty * i.price}</b></div>)}{!items.length && <p>{msg || 'Your cart is empty.'}</p>}
      {!!items.length && <form onSubmit={order}><p className="tot">Total: Rs {total}</p>
        <input required placeholder="Your name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input required placeholder="Phone number" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
        <textarea required placeholder="Delivery address" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />
        <input placeholder="Note (optional)" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        <button className="btn">Place order</button>{msg && <p className="err">{msg}</p>}</form>}</aside></div>}
  </>);
}
