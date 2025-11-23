import { useAuth } from "../context/AuthContext";

export default function SidebarAdmin() {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <h2>🔧 Admin</h2>

      <p>Administrador: <b>{user?.username}</b></p>

      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
