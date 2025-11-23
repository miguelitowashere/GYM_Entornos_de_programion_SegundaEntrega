import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { connectWS, subscribeWS } from "../../api/ws";
import "./DashboardUser.css";

export default function DashboardUser() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("home");
  const [daysLeft, setDaysLeft] = useState(0);
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [message, setMessage] = useState(null);
  const [myReservations, setMyReservations] = useState([]);

  const HOURS = [
    "06:00", "07:00", "08:00", "09:00", "10:00",
    "11:00", "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  const menuItems = [
    { id: "home", label: "Inicio", icon: "🏠" },
    { id: "days", label: "Mis Días", icon: "📅" },
    { id: "create", label: "Crear Reserva", icon: "📝" },
    { id: "list", label: "Mis Reservas", icon: "📖" }
  ];

  async function fetchDays() {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/memberships/my_days/", {
        headers: { Authorization: "Bearer " + token }
      });
      setDaysLeft(res.data.remaining_days);
    } catch (error) {
      console.error("Error obteniendo días:", error);
      setDaysLeft(0);
    }
  }

  async function loadReservations() {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/reservations/my/", {
        headers: { Authorization: "Bearer " + token }
      });
      setMyReservations(res.data);
    } catch (error) {
      console.error("Error cargando reservas:", error);
    }
  }

  async function loadMachines() {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/machines/", {
        headers: { Authorization: "Bearer " + token }
      });
      setMachines(res.data);
    } catch (error) {
      console.error("Error cargando máquinas:", error);
    }
  }

  useEffect(() => {
    if (token) {
      fetchDays();
      loadReservations();
      loadMachines();
    }
  }, [token]);

  useEffect(() => {
    connectWS();
    subscribeWS((msg) => {
      if (msg.event === "new_reservation") {
        loadReservations();
      }
      if (msg.event === "days_updated") {
        fetchDays();
      }
    });
  }, []);

  async function createReservation() {
    setMessage(null);

    if (!selectedMachine || !selectedHour) {
      setMessage("⚠️ Selecciona máquina y hora");
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/reservations/create/",
        { machine: selectedMachine, hour: selectedHour },
        { headers: { Authorization: "Bearer " + token } }
      );

      setMessage("✅ Reserva creada correctamente");
      loadReservations();
      setSelectedMachine("");
      setSelectedHour("");
    } catch (error) {
      if (error.response?.data?.detail) {
        setMessage("❌ " + error.response.data.detail);
      } else {
        setMessage("❌ Error al crear reserva");
      }
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="user-layout">
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🏋️ GYM SYSTEM</h2>
          <p>Panel de Usuario</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user ? user.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-details">
              <span className="user-name">{user || "Usuario"}</span>
              <span className="user-role">Miembro</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        
        {/* HOME */}
        {activeSection === "home" && (
          <div className="section-home">
            <h1>👋 Bienvenido, {user}</h1>
            <p className="subtitle">Gestiona tus reservas y días disponibles</p>
            
            <div className="stats-grid-user">
              <div className="stat-card-user purple">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <div className="stat-label">Días Disponibles</div>
                  <div className="stat-number">{daysLeft}</div>
                </div>
              </div>
              <div className="stat-card-user blue">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <div className="stat-label">Reservas Activas</div>
                  <div className="stat-number">{myReservations.length}</div>
                </div>
              </div>
            </div>

            <h3 className="section-title">⚡ Acciones Rápidas</h3>
            <div className="quick-actions">
              <button className="action-card" onClick={() => setActiveSection("create")}>
                <span className="action-icon">📝</span>
                <span>Crear Reserva</span>
              </button>
              <button className="action-card" onClick={() => setActiveSection("list")}>
                <span className="action-icon">📖</span>
                <span>Ver Mis Reservas</span>
              </button>
              <button className="action-card" onClick={() => setActiveSection("days")}>
                <span className="action-icon">📅</span>
                <span>Ver Mis Días</span>
              </button>
            </div>
          </div>
        )}

        {/* MIS DÍAS */}
        {activeSection === "days" && (
          <div className="section-page">
            <h1>📅 Mis Días Restantes</h1>
            <div className="days-card">
              <div className="days-display">
                <span className="days-number">{daysLeft}</span>
                <span className="days-label">días disponibles</span>
              </div>
              {daysLeft === 0 && (
                <p className="warning-text">⚠️ No tienes días disponibles. Contacta al administrador.</p>
              )}
              {daysLeft > 0 && daysLeft < 7 && (
                <p className="info-text">💡 Te quedan pocos días. Considera renovar tu membresía.</p>
              )}
            </div>
          </div>
        )}

        {/* CREAR RESERVA */}
        {activeSection === "create" && (
          <div className="section-page">
            <h1>📝 Crear Reserva</h1>
            <div className="form-card">
              <div className="form-group">
                <label>🏋️ Selecciona máquina</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="input-select"
                >
                  <option value="">-- Selecciona una máquina --</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>🕐 Selecciona hora</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="input-select"
                >
                  <option value="">-- Selecciona una hora --</option>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <button 
                className="btn" 
                onClick={createReservation}
                disabled={daysLeft === 0}
                style={{
                  opacity: daysLeft === 0 ? 0.5 : 1,
                  cursor: daysLeft === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {daysLeft === 0 ? '❌ Sin días disponibles' : '✅ Crear Reserva'}
              </button>

              {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MIS RESERVAS */}
        {activeSection === "list" && (
          <div className="section-page">
            <h1>📖 Mis Reservas ({myReservations.length})</h1>
            <div className="content-card">
              {myReservations.length === 0 ? (
                <p className="empty-message">No tienes reservas activas</p>
              ) : (
                <div className="list-container">
                  {myReservations.map(r => (
                    <div key={r.id} className="reservation-item">
                      <div className="reservation-info">
                        <span className="machine-name">🏋️ {r.machine_name}</span>
                      </div>
                      <span className="reservation-time">🕐 {r.hour}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}