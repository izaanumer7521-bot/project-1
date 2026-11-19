// Shop opening hours. Times are stored as 24h "HH:MM" strings and always read in Pakistan time (UTC+5, no daylight saving),
// so the result is the same whatever timezone the server or the customer's phone is in. Both empty = no timing (always open).
export const toMin = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim()); if (!m) return null; const h = +m[1], mi = +m[2]; return h < 24 && mi < 60 ? h * 60 + mi : null; };
export const nowMin = (d = new Date()) => ((d.getUTCHours() + 5) % 24) * 60 + d.getUTCMinutes();
export const cleanTime = v => { const m = toMin(v); return m == null ? '' : String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
// Inside the timing? Works for overnight shops too (e.g. 18:00 to 00:30).
export const inHours = (opensAt, closesAt, m = nowMin()) => { const a = toMin(opensAt), b = toMin(closesAt); if (a == null || b == null || a === b) return true; return a < b ? m >= a && m < b : m >= a || m < b; };
export const label12 = t => { const m = toMin(t); if (m == null) return ''; const h = Math.floor(m / 60), mi = m % 60; return `${h % 12 || 12}${mi ? ':' + String(mi).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`; };
export const hoursText = x => (toMin(x?.opensAt) != null && toMin(x?.closesAt) != null ? `${label12(x.opensAt)} – ${label12(x.closesAt)}` : '');
// Is this shop taking orders right now? The manual Open/Closed switch AND the timing must both say open.
export const isShopOpen = x => !!x && x.open !== false && inHours(x.opensAt, x.closesAt);
// Shown after a shop's name when it is closed only because of its timing, e.g. "Saqib Burger (open 6 PM – 12:30 AM)"
export const withTiming = x => x.name + (x.open !== false && hoursText(x) ? ` (open ${hoursText(x)})` : '');
