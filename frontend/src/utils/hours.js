// Shop opening hours (same rules as backend/utils/hours.js). Times are 24h "HH:MM", always read in Pakistan time (UTC+5).
export const toMin = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim()); if (!m) return null; const h = +m[1], mi = +m[2]; return h < 24 && mi < 60 ? h * 60 + mi : null; };
export const nowMin = (d = new Date()) => ((d.getUTCHours() + 5) % 24) * 60 + d.getUTCMinutes();
export const inHours = (opensAt, closesAt, m = nowMin()) => { const a = toMin(opensAt), b = toMin(closesAt); if (a == null || b == null || a === b) return true; return a < b ? m >= a && m < b : m >= a || m < b; };
export const label12 = t => { const m = toMin(t); if (m == null) return ''; const h = Math.floor(m / 60), mi = m % 60; return `${h % 12 || 12}${mi ? ':' + String(mi).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`; };
export const hoursLabel = x => (toMin(x?.opensAt) != null && toMin(x?.closesAt) != null ? `${label12(x.opensAt)} – ${label12(x.closesAt)}` : '');
