import { useEffect, useState } from 'react'; import { api } from '../utils/api.js';
const ROWS = [['🍚','🥛','🧈','🍞','☕','🧂','🍅','🥚'], ['🥩','🍗','🥬','🍎','🍋','🧅','🥔','🥕'], ['🥤','🧃','🍫','🍪','🍕','🍔','🧴','🧼']];
export default function Welcome({ needAuth, onDone, startAuth }) {
  const [stage, setStage] = useState(startAuth ? 'auth' : 'splash'), [mode, setMode] = useState('signup'), [phone, setPhone] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [out, setOut] = useState(false);
  const finish = fresh => { sessionStorage.setItem('bd_splash', '1'); setOut(true); setTimeout(() => onDone(fresh === true), 450); };
  useEffect(() => { if (startAuth) return; const t = setTimeout(() => (needAuth ? setStage('auth') : finish()), 2300); return () => clearTimeout(t); }, []);
  const skip = () => { localStorage.setItem('bd_skip', '1'); finish(); };
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const d = await api(`customers/${mode}`, 'POST', { phone }); localStorage.setItem('bd_user', d.phone); if (d.token) localStorage.setItem('bd_ctoken', d.token); finish(mode === 'signup'); }
    catch (x) { setErr(x.message); } setBusy(false);
  };
  return (<div className={'welcome' + (out ? ' out' : '')}>
    {stage === 'splash' ? <div className="splash"><span className="ring" /><img src="/logo.png" alt="ByDoor EXPRESS" /><p>Har Zaroorat, Ab Aapke Ghar Tak!</p><i className="loadbar" /></div> :
    <div className="authwrap">
      <button className="skip" onClick={skip}>Skip ›</button>
            <form className="authcard" onSubmit={submit}>
        <img src="/logo.png" alt="ByDoor EXPRESS" /><p className="tag">EVERYTHING AT YOUR DOORSTEP</p>
        <div className="divider"><span>{mode === 'signup' ? 'SIGN UP' : 'LOG IN'}</span></div>
        <div className="phone"><b>🇵🇰 +92</b><input inputMode="numeric" autoComplete="tel" placeholder="Enter your Mobile Number" value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))} /></div>
        {err && <p className="err">{err}</p>}
        <button className="btn big" disabled={busy || phone.replace(/^0/, '').length < 10}>{busy ? 'Please wait…' : mode === 'signup' ? 'Sign Up' : 'Log In'}</button>
        <p className="swlink">{mode === 'signup' ? 'Already have an account?' : "Don't have an account?"} <a onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErr(''); }}>{mode === 'signup' ? 'Log In here' : 'Sign Up here'}</a></p>
      </form></div>}
  </div>);
}
