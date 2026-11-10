import { useEffect, useState } from 'react';
export const applyTheme = t => { document.documentElement.dataset.theme = t; document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#06170c' : '#f2faf4'); };
// Dark green neon is the default look. People can switch to light mode and the choice is remembered on that device.
export const initTheme = () => { applyTheme(localStorage.getItem('bd_theme') === 'light' ? 'light' : 'dark'); };
// Sun / moon button. Used by the website, admin and vendor panels.
export default function ThemeToggle({ float }) {
  const [t, setT] = useState(document.documentElement.dataset.theme || 'dark');
  useEffect(() => { applyTheme(t); localStorage.setItem('bd_theme', t); }, [t]);
  return <button type="button" className={'tgl' + (float ? ' float' : '') + (float === 'welcome' ? ' wtgl' : '')} aria-label="Switch light / dark mode" title={t === 'dark' ? 'Light mode' : 'Dark mode'} onClick={() => setT(t === 'dark' ? 'light' : 'dark')}>{t === 'dark' ? '☀️' : '🌙'}</button>;
}
