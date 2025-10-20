import { Link, NavLink } from "react-router-dom";
import fanLogo from "../assets/icons/FAN-logo-horizontal-negro.png";

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="brand" style={{ display: "flex", alignItems: "center" }}>
          <img src={fanLogo} alt="FAN" style={{ height: 32 }} />
        </Link>
        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : undefined} end>Inventory</NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : undefined}>Settings</NavLink>
          <NavLink to="/account" className={({ isActive }) => isActive ? "active" : undefined}>Account</NavLink>
        </nav>
      </div>
    </header>
  );
}
