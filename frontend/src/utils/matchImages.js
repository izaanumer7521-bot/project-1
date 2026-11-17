// Matches picture file names to product names, e.g. "zinger-burger_2.JPG" -> "Zinger Burger".
// No AI and no internet needed: it compares the words in the file name with the words in each product name.

// "Zinger_Burger (2).jpg" -> "zinger burger"
export const norm = s => String(s || '').toLowerCase()
  .replace(/\.(jpe?g|png|webp|gif|bmp|avif|heic)$/i, '')
  .replace(/\(\s*\d+\s*\)|\bcopy\b/g, ' ')        // "(2)" and "copy" added by Windows / phones
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

const lev = (a, b) => {
  const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
};

// 0..1: how well a file name fits a product name (1 = same words)
export const score = (file, product) => {
  const a = norm(file), b = norm(product); if (!a || !b) return 0; if (a === b) return 1;
  const strip = x => x.replace(/ \d+$/, ''), a2 = strip(a);               // "zinger burger 2" -> "zinger burger"
  if (a2 === b) return 0.98;
  if (a.replace(/ /g, '') === b.replace(/ /g, '')) return 0.97;           // "zingerburger" = "zinger burger"
  const ta = new Set(a2.split(' ')), tb = new Set(b.split(' ')), common = [...ta].filter(w => tb.has(w)).length;
  const jac = common / new Set([...ta, ...tb]).size, sim = 1 - lev(a2, b) / Math.max(a2.length, b.length);
  return Math.max(sim, jac * 0.9);
};

export const EXACT = 0.95, LIKELY = 0.6;

// files: [{ name }], products: [{ _id, name }] -> same length array of { pid, score, level }
// Every product gets at most one picture: the best matches are given out first.
export function matchAll(files, products) {
  const pairs = [];
  files.forEach((f, i) => products.forEach(p => { const sc = score(f.name, p.name); if (sc >= LIKELY) pairs.push({ i, pid: String(p._id), sc }); }));
  pairs.sort((x, y) => y.sc - x.sc);
  const out = files.map(() => ({ pid: '', score: 0, level: 'none' })), usedP = new Set();
  for (const { i, pid, sc } of pairs) { if (out[i].pid || usedP.has(pid)) continue; out[i] = { pid, score: sc, level: sc >= EXACT ? 'exact' : 'likely' }; usedP.add(pid); }
  return out;
}

// Shrinks a big phone / camera photo to a small JPEG (max 800 px) so 80 pictures upload quickly and the site stays fast
export const shrinkPic = (file, max = 800) => new Promise((ok, no) => {
  const url = URL.createObjectURL(file), im = new Image();
  im.onload = () => {
    const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    let q = 0.82, d = c.toDataURL('image/jpeg', q); while (d.length > 450000 && q > 0.4) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
    d.length > 690000 ? no(new Error('too large')) : ok(d);
  };
  im.onerror = () => { URL.revokeObjectURL(url); no(new Error('not a readable picture')); };
  im.src = url;
});
