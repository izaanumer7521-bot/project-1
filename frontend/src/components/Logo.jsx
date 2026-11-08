export default function Logo({ small }) {
  return (<div className="logo">
    <svg viewBox="0 0 64 64" width={small ? 40 : 56} height={small ? 40 : 56}><rect width="64" height="64" rx="16" fill="#0b6b2e"/>
      <path d="M14 30 32 14l18 16v20H14z" fill="#fff"/><rect x="26" y="34" width="12" height="16" rx="6" fill="#43b02a"/><circle cx="35" cy="42" r="1.5" fill="#fff"/></svg>
    <div><b className="l1">By<span>Door</span></b><b className="l2">EXPRESS</b>{!small && <i>Har Zaroorat, Ab Aapke Ghar Tak!</i>}</div></div>);
}
