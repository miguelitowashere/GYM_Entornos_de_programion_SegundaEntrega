import { useAuth } from "../context/AuthContext";

export default function SidebarUser() {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <h2>🏋️ Gimnasio</h2>

      <p>Usuario: <b>{user?.username}</b></p>

      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
