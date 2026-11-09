import { useEffect, useRef, useState } from 'react';
// Endless auto-rotating banner: loops forever, swipe on phones, dots below.
export default function BannerSlider({ banners, onCta }) {
  const n = banners.length, loop = n > 1;
  const [i, setI] = useState(loop ? 1 : 0), [anim, setAnim] = useState(true), [drag, setDrag] = useState(0);
  const x0 = useRef(null), hold = useRef(false);
  const slides = loop ? [banners[n - 1], ...banners, banners[0]] : banners;
  useEffect(() => { setAnim(false); setI(loop ? 1 : 0); }, [n]);
  useEffect(() => { if (!loop) return; const id = setInterval(() => { if (!hold.current) { setAnim(true); setI(x => x + 1); } }, 4500); return () => clearInterval(id); }, [n]);
  const go = d => { setAnim(true); setI(x => x + d); };
  const end = () => { if (!loop) return; if (i === n + 1) { setAnim(false); setI(1); } else if (i === 0) { setAnim(false); setI(n); } };
  if (!n) return null;
  const real = loop ? (i - 1 + n) % n : 0;
  return (<div className="bwrap">
    <div className="bslider"
      onTouchStart={e => { x0.current = e.touches[0].clientX; hold.current = true; }}
      onTouchMove={e => { if (x0.current !== null) setDrag(e.touches[0].clientX - x0.current); }}
      onTouchEnd={() => { if (loop && Math.abs(drag) > 50) go(drag < 0 ? 1 : -1); setDrag(0); x0.current = null; setTimeout(() => (hold.current = false), 2500); }}>
      <div className="btrack" onTransitionEnd={end} style={{ transform: `translateX(calc(${-i * 100}% + ${drag}px))`, transition: anim && !drag ? 'transform .6s cubic-bezier(.4,0,.2,1)' : 'none' }}>
        {slides.map((b, k) => (<div className="bslide" key={k}>
          {b.image ? <><img src={b.image} alt={b.title || 'Banner'} draggable="false" />{b.showText && b.title && <div className="bover"><h3>{b.title}</h3>{b.subtitle && <p>{b.subtitle}</p>}</div>}</> :
            <div className="bgrad"><h3>{b.title}</h3>{b.subtitle && <p>{b.subtitle}</p>}<button className="btn" onClick={onCta}>Order now</button></div>}
        </div>))}
      </div></div>
    {loop && <div className="bdots">{banners.map((_, k) => <i key={k} className={k === real ? 'on' : ''} />)}</div>}
  </div>);
}
