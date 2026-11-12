import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import '../assets/import.css';

const rs = n => 'Rs ' + Number(n || 0).toLocaleString('en-US');
const EXAMPLE = `## Burgers
Zinger Burger - 450
Beef Burger 520

## Pizza
Chicken Tikka - Small 500 / Medium 900 / Large 1400

## Drinks
Milk Shake - 250 - Mango, Banana, Chocolate
Cold Drink - 80`;
const when = d => new Date(d).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MenuImport() {
  const [shops, setShops] = useState([]), [cats, setCats] = useState([]), [batches, setBatches] = useState([]);
  const [shopId, setShopId] = useState(''), [category, setCategory] = useState(''), [text, setText] = useState('');
  const [prev, setPrev] = useState(null), [err, setErr] = useState(''), [busy, setBusy] = useState(''), [done, setDone] = useState(null);

  const loadBatches = () => api('import/batches').then(setBatches).catch(() => {});
  useEffect(() => { api('shops').then(setShops).catch(x => setErr(x.message)); api('categories').then(d => setCats(d.map(c => [c.key, c.name]))).catch(() => {}); loadBatches(); }, []);
  const changed = fn => v => { fn(v); setPrev(null); setDone(null); setErr(''); };
  const pickShop = id => { setShopId(id); setPrev(null); setDone(null); setErr(''); const s = shops.find(x => x._id === id); if (s?.category) setCategory(s.category); };
  const body = () => ({ shopId, category, text });

  const check = async () => {
    setErr(''); setDone(null); if (!shopId) return setErr('Choose the vendor shop first.'); if (!category) return setErr('Choose a category for these items.'); if (!text.trim()) return setErr('Paste the menu first.');
    setBusy('check'); try { setPrev(await api('import/preview', 'POST', body())); } catch (x) { setErr(x.message); setPrev(null); } setBusy('');
  };
  const save = async () => {
    setBusy('save'); setErr('');
    try { const d = await api('import/commit', 'POST', body()); setDone(d); setPrev(null); setText(''); loadBatches(); } catch (x) { setErr(x.message); } setBusy('');
  };
  const act = async (id, what, msg) => {
    if (msg && !confirm(msg)) return; setBusy(id + what); setErr('');
    try { await api(`import/${id}/${what}`, 'POST'); if (done?.batch === id) setDone(null); loadBatches(); } catch (x) { setErr(x.message); } setBusy('');
  };

  return (
    <div className="imp">
      <section className="card imp-how">
        <h3>Import a whole menu in one go</h3>
        <p>Paste the menu with one item per line. Check the preview, then save. Imported items stay <b>hidden</b> from customers until you press <b>Publish</b>, and every import can be <b>undone</b>.</p>
        <div className="imp-fmt">
          <div><code>Zinger Burger - 450</code><small>normal item</small></div>
          <div><code>Pizza - Small 500 / Large 1400</code><small>sizes</small></div>
          <div><code>Shake - 250 - Mango, Banana</code><small>flavours</small></div>
          <div><code>## Drinks</code><small>menu section for the lines below</small></div>
        </div>
      </section>

      <section className="card imp-form">
        <div className="g2">
          <label>Vendor shop<select value={shopId} onChange={e => pickShop(e.target.value)}><option value="">Choose shop…</option>{shops.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></label>
          <label>Category for these items<select value={category} onChange={e => changed(setCategory)(e.target.value)}><option value="">Choose category…</option>{cats.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        </div>
        <label>Menu text <button type="button" className="imp-link" onClick={() => changed(setText)(EXAMPLE)}>Insert example</button>
          <textarea rows={12} spellCheck={false} placeholder={'Paste the menu here, one item per line…\n\nZinger Burger - 450\nPizza - Small 500 / Large 1400'} value={text} onChange={e => changed(setText)(e.target.value)} /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button type="button" className="btn" disabled={busy === 'check'} onClick={check}>{busy === 'check' ? 'Checking…' : '1. Check menu (nothing is saved yet)'}</button>
      </section>

      {done && (
        <section className="card imp-done">
          <h3>✅ Saved safely</h3>
          <p><b>{done.created}</b> new item{done.created === 1 ? '' : 's'} added as hidden{done.updated > 0 && <> and <b>{done.updated}</b> existing item{done.updated === 1 ? '' : 's'} updated</>}. Customers cannot see the new items yet.</p>
          <div className="row"><button className="btn" disabled={!!busy} onClick={() => act(done.batch, 'publish')}>Publish now</button>
            <button className="btn ghost" disabled={!!busy} onClick={() => act(done.batch, 'undo', 'Undo this import? New items are removed and changed prices are restored.')}>Undo</button></div>
          <small>Next: open <b>Products</b> and add pictures. Items without a picture show a placeholder until you do.</small>
        </section>
      )}

      {prev && (
        <section className="card imp-prev">
          <div className="imp-sum"><span className="n"><b>{prev.created}</b> new</span><span className="u"><b>{prev.updated}</b> update</span><span className={'e' + (prev.errors ? ' on' : '')}><b>{prev.errors}</b> to fix</span></div>
          <div className="imp-rows">
            {prev.rows.map(r => (
              <div key={r.line} className={'imp-row ' + (r.error ? 'bad' : r.status)}>
                <span className="ln">{r.line}</span>
                <div className="bd">
                  {r.error ? <><b>{r.text}</b><em>{r.error}</em></> : <><b>{r.name}{r.section && <small> · {r.section}</small>}</b>
                    <span>{r.options.length ? r.options.map(o => `${o.label} ${rs(o.price)}`).join('  ·  ') : rs(r.price)}{r.flavors.length > 0 && `  ·  ${r.flavors.length} flavour${r.flavors.length > 1 ? 's' : ''}: ${r.flavors.join(', ')}`}</span></>}
                </div>
                <i className="tag">{r.error ? 'Fix' : r.status === 'update' ? 'Update' : 'New'}</i>
              </div>))}
          </div>
          {prev.errors > 0 ? <p className="err">Fix the red lines in the box above and press Check again. Nothing has been saved.</p>
            : <><p className="imp-note">{prev.updated > 0 && 'Items that already exist are updated with the prices, sizes and flavours above (their pictures stay). '}New items are saved <b>hidden</b>.</p>
              <button type="button" className="btn big" disabled={busy === 'save'} onClick={save}>{busy === 'save' ? 'Saving…' : `2. Save ${prev.created + prev.updated} item${prev.created + prev.updated === 1 ? '' : 's'} (hidden until you publish)`}</button></>}
        </section>
      )}

      <section className="card">
        <h3>Recent imports</h3>
        {!batches.length ? <p className="muted2">No imports yet.</p> : batches.map(b => (
          <div className="imp-batch" key={b._id}>
            <div><b>{b.shopName}</b><small>{when(b.createdAt)} · {b.created} new{b.updated > 0 && `, ${b.updated} updated`} · {b.hidden > 0 ? `${b.hidden} hidden` : 'all published'}</small></div>
            <div>{b.hidden > 0 && <button type="button" className="ebtn" disabled={!!busy} onClick={() => act(b._id, 'publish')}>Publish</button>}
              <button type="button" className="dbtn" disabled={!!busy} onClick={() => act(b._id, 'undo', 'Undo this import? New items are removed and changed prices are restored.')}>Undo</button></div>
          </div>))}
      </section>
    </div>
  );
}
