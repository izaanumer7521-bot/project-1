export default function Logo({ small }) {
  return <img className="logo-img" src="/logo.png" alt="ByDoor EXPRESS" style={{ height: small ? 52 : 120 }} />;
}
