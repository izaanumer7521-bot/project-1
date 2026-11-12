// Turns a pasted menu (one item per line) into products. Pure function: it never touches the database.
//   Burgers:                      <- (or "## Burgers") starts a menu section
//   Chicken Karahi - 1200         <- name - price
//   Zinger Burger 450             <- "name price" also works
//   Pizza - Small 500 / Medium 900 / Large 1400   <- sizes (separate with /  |  ;)
//   Shake - 250 - Mango, Banana   <- name - price - flavours
//   Karahi - 1200 - - Fresh desi  <- optional 4th part = description (leave flavours empty with a lone dash)
import { cleanOptions, cleanFlavors } from '../routes/vendor.js';
export const MAX_LINES = 400, MAX_ITEMS = 200;
const N = '(\\d[\\d,]*(?:\\.\\d+)?)', num = s => Number(String(s).replace(/,/g, ''));
const PLAIN = new RegExp('^' + N + '$'), SIZE = new RegExp('^(.+?)\\s*[:=]?\\s*(?:rs\\.?\\s*)?' + N + '$', 'i'), TAIL = new RegExp('^(.+?)\\s+(?:rs\\.?\\s*)?' + N + '(?:\\s*(?:rs\\.?|/-))?$', 'i');
const clean = s => String(s || '').trim().replace(/\s+/g, ' ');

export function parseMenu(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  if (lines.length > MAX_LINES) return { error: `Too many lines (${lines.length}). Please import up to ${MAX_LINES} lines at a time.` };
  const rows = [], seen = new Map(); let section = '';
  lines.forEach((raw, i) => {
    const line = raw.trim().replace(/^(?:[•*▪●]|\d{1,3}[.)])\s+/, ''); if (!line) return;
    const head = line.match(/^#{1,3}\s*(.+)$/) || line.match(/^([^\d]{1,40}):$/); if (head) { section = clean(head[1]).slice(0, 40); return; }
    const row = { line: i + 1, text: raw.trim(), name: '', section, price: 0, options: [], flavors: [], description: '', error: '' }; rows.push(row);
    try {
      let parts = line.split(/\s+[-–—]\s+/).map(clean);
      if (parts.length < 2) { const m = line.match(TAIL); if (!m) throw new Error('No price found. Write it like:  Name - 450'); parts = [clean(m[1]), m[2]]; }
      row.name = parts[0].slice(0, 120); if (!row.name) throw new Error('The item name is missing');
      const spec = parts[1].replace(/^rs\.?\s*/i, '').replace(/\s*(?:rs\.?|\/-)$/i, '').trim();
      if (PLAIN.test(spec)) row.price = num(spec);
      else {
        const pieces = spec.split(/\s*[\/|;]\s*|,\s+(?=[A-Za-z])/).filter(Boolean), opts = [];
        for (const p of pieces) { const m = p.match(SIZE); if (!m) throw new Error(`Could not read "${p}". For sizes write:  Small 500 / Large 900`); opts.push({ label: clean(m[1]), price: num(m[2]) }); }
        if (opts.length < 2) throw new Error('A single size is not needed. Write just the price, or give two or more sizes');
        const o = cleanOptions(opts); if (o.error) throw new Error(o.error);
        row.options = o.list; row.price = Math.min(...o.list.map(x => x.price));
      }
      if (!(row.price > 0)) throw new Error('The price must be more than 0');
      if (parts[2] && parts[2].startsWith('- ')) row.description = clean(parts.slice(2).join(' - ').slice(2)).slice(0, 500); // "Name - 1200 - - description" (no flavours)
      else { if (parts[2]) row.flavors = cleanFlavors(parts[2].split(/\s*[,|\/;]\s*/)); if (parts[3]) row.description = parts.slice(3).join(' - ').slice(0, 500); }
      const key = row.name.toLowerCase(); if (seen.has(key)) throw new Error(`Repeated in this list (same as line ${seen.get(key)})`); seen.set(key, row.line);
    } catch (e) { row.error = e.message; }
  });
  if (rows.length > MAX_ITEMS) return { error: `Too many items (${rows.length}). Please import up to ${MAX_ITEMS} items at a time.` };
  return { rows };
}
