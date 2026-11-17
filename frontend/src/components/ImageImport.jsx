import { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api.js';
import { matchAll, shrinkPic } from '../utils/matchImages.js';
import '../assets/import.css';
import '../assets/shop-status.css';

// Admin: add pictures to many items at once. Pick the shop, pick all the photos, the page matches each photo to an item by its file name,
// you can fix any wrong match, then everything is saved in one go (in small batches so the upload never fails on slow internet).
export default function ImageImport() {
  const [shops, setShops] = useState([]), [shopId, setShopId] = useState(''), [prods, setProds] = useState([]), [rows, setRows] = useState([]);
  const [replace, setReplace] = useState(false), [busy, setBusy] = useState(''), [prog, setProg] = useState(''), [err, setErr] = useState(''), [done, setDone] = useState(null);
  const pick = useRef(), urls = useRef([]);

  const free = () => { urls.current.forEach(u => URL.revokeObjectURL(u)); urls.current = []; };
  useEffect(() => { api('shops').then(setShops).catch(x => setErr(x.message)); return free; }, []);
  const loadProds = id => api('import/shop-products/' + id).then(setProds).catch(x => setErr(x.message));
  const chooseShop = id => { setShopId(id); setRows([]); free(); setDone(null); setErr(''); setProds([]); if (id) loadProds(id); };

  const onFiles = fl => {
    const files = [...(fl || [])].filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name)); if (!files.length) return setErr('Please choose picture files (JPG, PNG or WebP).');
    free(); setErr(''); setDone(null);
    const m = matchAll(files, prods);
    setRows(files.map((f, i) => { const url = URL.createObjectURL(f); urls.current.push(url); return { key: i + f.name, file: f, url, ...m[i] }; }));
  };
  const setPid = (i, pid) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, pid, level: pid ? 'manual' : 'none' } : r)));
  const remove = i => setRows(rs => rs.filter((_, j) => j !== i));

  const byId = Object.fromEntries(prods.map(p => [String(p._id), p]));
  // which rows will really be saved: it needs an item, an item gets one picture only (first row wins), and existing pictures are kept unless "replace" is ticked
  const seen = new Set(), plan = rows.map(r => {
    if (!r.pid) return 'none'; if (seen.has(r.pid)) return 'dupe'; seen.add(r.pid);
    return byId[r.pid]?.hasImage && !replace ? 'keep' : 'save';
  });
  const nSave = plan.filter(x => x === 'save').length, nNone = plan.filter(x => x === 'none').length, nKeep = plan.filter(x => x === 'keep').length, nDupe = plan.filter(x => x === 'dupe').length;
  const missing = prods.filter(p => !p.hasImage && !rows.some((r, i) => r.pid === String(p._id) && plan[i] === 'save')).length;

  const save = async () => {
    setErr(''); setBusy('save'); setDone(null); let ok = 0, bad = 0, n = 0; const jobs = rows.filter((_, i) => plan[i] === 'save');
    try {
      let batch = [], size = 0;
      const flush = async () => { if (!batch.length) return; const d = await api('import/images', 'POST', { shopId, items: batch }); ok += d.updated; bad += d.failed.length; batch = []; size = 0; };
      for (const r of jobs) {
        setProg(`Uploading ${n + 1} of ${jobs.length}…`); n++;
        let image; try { image = await shrinkPic(r.file); } catch { bad++; continue; }
        if (batch.length >= 12 || size + image.length > 2500000) await flush();
        batch.push({ id: r.pid, image }); size += image.length;
      }
      await flush(); setDone({ ok, bad }); setRows([]); free(); loadProds(shopId);
    } catch (x) { setErr(x.message + (ok ? ` (${ok} pictures were saved before the problem.)` : '')); loadProds(shopId); }
    setBusy(''); setProg('');
  };

  const tag = (r, p) => p === 'dupe' ? ['Duplicate', 'bad'] : p === 'keep' ? ['Has picture', 'keep'] : r.level === 'exact' ? ['Matched', 'ok'] : r.level === 'likely' ? ['Check', 'maybe'] : r.level === 'manual' ? ['Chosen', 'ok'] : ['Choose item', 'bad'];

  return (
    <section className="card imp-pics">
      <h3>📷 Add pictures to many items at once</h3>
      <p className="imp-note">Name each photo like the item (<code>Zinger Burger.jpg</code>, <code>beef-burger.png</code>). Select all photos together and the page matches them to the items by name. Anything it is unsure about is shown for you to check. Photos are shrunk automatically.</p>
      <label>Vendor shop<select value={shopId} onChange={e => chooseShop(e.target.value)}><option value="">Choose shop…</option>{shops.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></label>
      {shopId && <p className="imp-note">{prods.length ? <><b>{prods.length}</b> items in this shop · <b>{prods.filter(p => !p.hasImage).length}</b> without a picture</> : 'This shop has no items yet. Import the menu first.'}</p>}
      {shopId && !!prods.length && <>
        <input ref={pick} type="file" accept="image/*" multiple hidden onChange={e => { onFiles(e.target.files); e.target.value = ''; }} />
        <div className="row"><button type="button" className="btn" disabled={!!busy} onClick={() => pick.current.click()}>{rows.length ? 'Choose different photos' : 'Select photos…'}</button>
          <label className="imp-chk"><input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} />Also replace pictures that already exist</label></div></>}
      {err && <p className="err" role="alert">{err}</p>}
      {done && <p className="imp-okline">✅ {done.ok} picture{done.ok === 1 ? '' : 's'} saved{done.bad > 0 && <> · <b>{done.bad}</b> could not be saved (unreadable or too large)</>}.</p>}

      {!!rows.length && <>
        <div className="imp-sum"><span className="n"><b>{nSave}</b> will be saved</span>{nKeep > 0 && <span className="u"><b>{nKeep}</b> already have a picture</span>}<span className={'e' + (nNone + nDupe ? ' on' : '')}><b>{nNone + nDupe}</b> not matched</span><span><b>{missing}</b> items will still have no picture</span></div>
        <div className="imp-rows pic">
          {rows.map((r, i) => { const [t, c] = tag(r, plan[i]); return (
            <div key={r.key} className={'imp-pic ' + c}>
              <img src={r.url} alt="" />
              <div className="bd"><small title={r.file.name}>{r.file.name}</small>
                <select value={r.pid} onChange={e => setPid(i, e.target.value)}><option value="">— choose item —</option>{prods.map(p => <option key={p._id} value={p._id}>{p.name}{p.section ? ` · ${p.section}` : ''}{p.hasImage ? ' (has picture)' : ''}</option>)}</select></div>
              <i className="tag">{t}</i><button type="button" className="dbtn" aria-label="Remove photo" onClick={() => remove(i)}>✕</button>
            </div>); })}
        </div>
        <button type="button" className="btn big" disabled={!!busy || !nSave} onClick={save}>{busy ? prog || 'Saving…' : `Save ${nSave} picture${nSave === 1 ? '' : 's'}`}</button>
      </>}
    </section>
  );
}
