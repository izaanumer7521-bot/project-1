import { useEffect, useRef } from 'react';
// Categories on a curve. Drag / swipe to roll them along the arc, tap one to select it.
// The item in the middle sits highest and biggest; the ones at the sides curve down and shrink.
export default function CurveCats({ items, selected, onSelect }) {
  const box = useRef(null), refs = useRef([]), raf = useRef(0), drag = useRef({ on: false, x: 0, l: 0, moved: false });
  const layout = () => {
    const el = box.current; if (!el) return; const W = el.clientWidth || 1, mid = el.scrollLeft + W / 2;
    refs.current.forEach(n => {
      if (!n) return; const c = n.offsetLeft + n.offsetWidth / 2, d = (c - mid) / (W * 0.5), a = Math.min(Math.abs(d), 1.7);
      n.style.transform = `translateY(${(a * a * 30).toFixed(1)}px) rotate(${(d * 9).toFixed(1)}deg) scale(${(1 - Math.min(a, 1.2) * 0.2).toFixed(3)})`;
      n.style.opacity = String(Math.max(0.4, 1 - a * 0.3).toFixed(2));
    });
  };
  const onScroll = () => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(layout); };
  useEffect(() => { const n = refs.current[Math.min(1, items.length - 1)], el = box.current; if (n && el) el.scrollLeft = n.offsetLeft + n.offsetWidth / 2 - el.clientWidth / 2; layout(); addEventListener('resize', layout); return () => { removeEventListener('resize', layout); cancelAnimationFrame(raf.current); }; }, [items.length]);
  const centre = k => { const n = refs.current[k], el = box.current; if (n && el) el.scrollTo({ left: n.offsetLeft + n.offsetWidth / 2 - el.clientWidth / 2, behavior: 'smooth' }); };
  const pick = (k, it) => { if (drag.current.moved) return; centre(k); onSelect(it.key); };
  // mouse drag for desktop (touch screens already scroll natively)
  const down = e => { if (e.pointerType !== 'mouse') return; drag.current = { on: true, x: e.clientX, l: box.current.scrollLeft, moved: false }; };
  const move = e => { const d = drag.current; if (!d.on) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 5) d.moved = true; box.current.scrollLeft = d.l - dx; };
  const up = () => { drag.current.on = false; setTimeout(() => (drag.current.moved = false), 0); };
  return (<div className="arcwrap"><div className="arc" ref={box} onScroll={onScroll} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
    {items.map((it, k) => <button key={it.key} type="button" ref={n => (refs.current[k] = n)} className={'arci' + (selected === it.key ? ' on' : '')} onClick={() => pick(k, it)}>
      <span className="arcic">{it.image ? <img src={it.image} alt="" draggable="false" /> : <span>{it.emoji || '📦'}</span>}</span><b>{it.name}</b></button>)}
  </div></div>);
}
