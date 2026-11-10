import { useEffect, useState } from 'react';
export const applyTheme = t => { document.documentElement.dataset.theme = t; document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#070e15' : '#0b6b2e'); };
export const initTheme = () => { let t = localStorage.getItem('bd_theme'); if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; applyTheme(t); };
// Sun / moon button. Saved on this device; used by the website, admin and vendor panels.
export default function ThemeToggle({ float }) {
  const [t, setT] = useState(document.documentElement.dataset.theme || 'light');
  useEffect(() => { applyTheme(t); localStorage.setItem('bd_theme', t); }, [t]);
  return <button type="button" className={'tgl' + (float ? ' float' : '')} aria-label="Switch light / dark mode" title={t === 'dark' ? 'Light mode' : 'Dark mode'} onClick={() => setT(t === 'dark' ? 'light' : 'dark')}>{t === 'dark' ? '☀️' : '🌙'}</button>;
}
