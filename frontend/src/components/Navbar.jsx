import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>🏋️ GYM SYSTEM</h2>
        </div>

        <div className="navbar-user">
          <span className="user-welcome">
            👤 {user || "Usuario"}
            {role === "admin" && <span className="admin-badge">ADMIN</span>}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}