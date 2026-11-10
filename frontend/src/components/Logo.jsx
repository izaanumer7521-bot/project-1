// Two versions of the logo: the original (for light mode) and a white-text version that is readable on the dark green theme. CSS shows the right one.
export default function Logo({ small }) {
  const st = { height: small ? 52 : 120 };
  return <><img className="logo-img lg-light" src="/logo.png" alt="ByDoor EXPRESS" style={st} /><img className="logo-img lg-dark" src="/logo-dark.png" alt="ByDoor EXPRESS" style={st} /></>;
}
