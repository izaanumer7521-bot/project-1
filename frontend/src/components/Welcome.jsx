import { useEffect, useRef, useState } from 'react'; import { api } from '../utils/api.js'; import Logo from './Logo.jsx';
// Intro slides: same artwork, framed on a different part of it for every slide
const SLIDES = [
  { h: ['Everything you need,', 'delivered.'], p: 'Fast, reliable delivery for food, groceries, medicine, and parcels right to your door.', z: 1, o: '50% 50%' },
  { h: ['Shop from your', 'local stores.'], p: 'Order from trusted stores in your city, all inside one app.', z: 1.9, o: '14% 38%' },
  { h: ['Order your way,', 'right to your door.'], p: 'Pick a store, choose what you like and we bring it to your doorstep.', z: 1.9, o: '90% 68%' },
];
export default function Welcome({ needAuth, onDone, startAuth }) {
  const [stage, setStage] = useState(startAuth ? 'auth' : 'splash'), [slide, setSlide] = useState(0), [mode, setMode] = useState('signup'), [phone, setPhone] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [out, setOut] = useState(false), x0 = useRef(null);
  const finish = fresh => { sessionStorage.setItem('bd_splash', '1'); setOut(true); setTimeout(() => onDone(fresh === true), 450); };
  useEffect(() => { if (startAuth) return; const t = setTimeout(() => (needAuth ? setStage(localStorage.getItem('bd_intro') ? 'auth' : 'intro') : finish()), 2300); return () => clearTimeout(t); }, []);
  useEffect(() => { if (stage !== 'intro') return; const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4200); return () => clearInterval(t); }, [stage]);
  const skip = () => { localStorage.setItem('bd_skip', '1'); localStorage.setItem('bd_intro', '1'); finish(); };
  const toAuth = m => { localStorage.setItem('bd_intro', '1'); setMode(m); setErr(''); setStage('auth'); };
  const swipe = e => { if (x0.current === null) return; const dx = e.changedTouches[0].clientX - x0.current; x0.current = null; if (Math.abs(dx) > 40) setSlide(s => (s + (dx < 0 ? 1 : SLIDES.length - 1)) % SLIDES.length); };
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const d = await api(`customers/${mode}`, 'POST', { phone }); localStorage.setItem('bd_user', d.phone); if (d.token) localStorage.setItem('bd_ctoken', d.token); finish(mode === 'signup'); }
    catch (x) { setErr(x.message); } setBusy(false);
  };
  const S = SLIDES[slide];
  return (<div className={'welcome' + (out ? ' out' : '')}>
    {stage === 'splash' && <div className="splash"><span className="ring" /><Logo /><p>Har Zaroorat, Ab Aapke Ghar Tak!</p><i className="loadbar" /></div>}
    {stage === 'intro' && <div className="wl intro" onTouchStart={e => (x0.current = e.touches[0].clientX)} onTouchEnd={swipe}>
      <div className="wl-top"><Logo small /><button className="skip" onClick={skip}>Skip</button></div>
      <h1 key={slide} className="wl-h">{S.h[0]} <em>{S.h[1]}</em></h1><p key={'p' + slide} className="lead">{S.p}</p>
      <div className="wl-art"><img src="/art/hero.webp" alt="" draggable="false" style={{ transform: `scale(${S.z})`, transformOrigin: S.o }} /></div>
      <div className="dots">{SLIDES.map((_, k) => <i key={k} className={k === slide ? 'on' : ''} onClick={() => setSlide(k)} />)}</div>
      <button className="btn big neon" onClick={() => toAuth('signup')}>Get Started</button>
      <p className="swlink">Already have an account? <a onClick={() => toAuth('login')}>Log in</a></p>
    </div>}
    {stage === 'auth' && <div className="wl auth">
      <button className="skip" onClick={skip}>Skip</button>
      <div className="authbox">
        <Logo small />
        <div className={'authart ' + mode} />
        <h2 className="wl-t">{mode === 'signup' ? 'Create your account' : 'Welcome back!'}</h2>
        <form onSubmit={submit}>
          <div className="phone"><b>🇵🇰 +92</b><input inputMode="numeric" autoComplete="tel" placeholder="Enter your mobile number" value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))} /></div>
          {err && <p className="err">{err}</p>}
          <button className="btn big neon" disabled={busy || phone.replace(/^0/, '').length < 10}>{busy ? 'Please wait…' : mode === 'signup' ? 'Sign Up' : 'Log In'}</button>
        </form>
        <div className="or"><span>or</span></div>
        <button type="button" className="btn ghost guest" onClick={skip}>Continue as guest</button>
        <p className="swlink">{mode === 'signup' ? 'Already have an account?' : "Don't have an account?"} <a onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErr(''); }}>{mode === 'signup' ? 'Log in' : 'Sign up'}</a></p>
      </div></div>}
  </div>);
}
