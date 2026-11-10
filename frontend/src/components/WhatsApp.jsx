import { useState } from 'react';
import { waLink } from '../utils/api.js';
export const WaIcon = ({ size = 26 }) => <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" aria-hidden="true"><path d="M16.04 3C9.4 3 4 8.38 4 15c0 2.12.56 4.19 1.62 6.01L4 29l8.18-1.6A12.04 12.04 0 0 0 16.04 27C22.66 27 28 21.62 28 15S22.66 3 16.04 3zm0 21.9c-1.8 0-3.56-.48-5.1-1.4l-.37-.22-4.85.95.99-4.7-.24-.39A9.84 9.84 0 0 1 6.2 15c0-5.42 4.42-9.82 9.84-9.82 5.43 0 9.76 4.4 9.76 9.82s-4.33 9.9-9.76 9.9zm5.4-7.36c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" /></svg>;

// Floating WhatsApp button, bottom-right on every page
export function WhatsAppFab({ phone, text }) {
  return <a className="wafab" href={waLink(phone, text || 'Hello ByDoor! I want to place an order.')} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"><WaIcon size={30} /><span>Order on WhatsApp</span></a>;
}

// "Type & order anything" box: the customer writes what they want and WhatsApp opens with the message ready
export function WaOrderBox({ phone, shop, compact, title }) {
  const [t, setT] = useState('');
  const send = e => { e.preventDefault(); const body = t.trim() || 'I want to place an order.'; window.open(waLink(phone, `Hello ByDoor!${shop ? ' (Shop: ' + shop + ')' : ''}\nI want to order:\n${body}`), '_blank', 'noopener'); };
  return (<form className={'waorder' + (compact ? ' compact' : '')} onSubmit={send}>
    <div className="wah"><span className="waic"><WaIcon size={22} /></span><div><b>{title || 'Type & order anything'}</b><small>{shop ? `Tell us what you need from ${shop}` : 'Write what you want, we deliver it. No searching needed.'}</small></div></div>
    <textarea rows={compact ? 2 : 3} value={t} onChange={e => setT(e.target.value)} placeholder="e.g. 2 kg chicken, 1 dozen eggs, 1 bread…" />
    <button className="wabtn" type="submit"><WaIcon size={20} /> Send order on WhatsApp</button>
  </form>);
}
