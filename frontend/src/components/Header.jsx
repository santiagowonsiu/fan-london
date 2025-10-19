import { Link, NavLink } from "react-router-dom";

export default function Header() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#111" : "#555",
    fontWeight: isActive ? 700 : 500,
    padding: "8px 10px",
    borderRadius: 6,
    background: isActive ? "#f2f2f2" : "transparent",
  });

  return (
    <header style={{ borderBottom: "1px solid #eee", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/" style={{ textDecoration: "none", color: "#111", fontWeight: 800, fontSize: 18 }}>Fan London</Link>
        <nav style={{ display: "flex", gap: 8 }}>
          <NavLink to="/" style={linkStyle} end>Inventory</NavLink>
          <NavLink to="/settings" style={linkStyle}>Settings</NavLink>
          <NavLink to="/account" style={linkStyle}>Account</NavLink>
        </nav>
      </div>
    </header>
  );
}
