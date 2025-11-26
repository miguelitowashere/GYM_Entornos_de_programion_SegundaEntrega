import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { connectWS, subscribeWS } from "../../api/ws";
import "./DashboardAdmin.css";

export default function DashboardAdmin() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState("home");
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [memberships, setMemberships] = useState([]);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedMembership, setSelectedMembership] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Nuevos estados para crear membresía
  const [newMembershipName, setNewMembershipName] = useState("");
  const [newMembershipPrice, setNewMembershipPrice] = useState("");
  const [newMembershipDays, setNewMembershipDays] = useState("");
  const [newMembershipIcon, setNewMembershipIcon] = useState("🎁");
  const [newMembershipColor, setNewMembershipColor] = useState("#667eea");

  // Estados para filtros de usuarios
  const [searchUser, setSearchUser] = useState("");
  const [filterDays, setFilterDays] = useState("all");

  // ✅ Estados para editar usuario (AHORA ESTÁN DENTRO DEL COMPONENTE)
  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const menuItems = [
    { id: "home", label: "Inicio", icon: "🏠" },
    { id: "createUser", label: "Crear Usuario", icon: "➕" },
    { id: "assignDays", label: "Asignar Días", icon: "💳" },
    { id: "history", label: "Historial", icon: "📋" },
    { id: "memberships", label: "Membresías", icon: "🏷️" },
    { id: "users", label: "Usuarios", icon: "👥" }
  ];

  const iconOptions = ["🎁", "🎄", "🎅", "💎", "⭐", "🔥", "👑", "🏆", "👑", "🌟"];
  const colorOptions = ["#667eea", "#ffd700", "#cd7f32", "#c0c0c0", "#00d9ff", "#ff6b6b", "#51cf66", "#ff922b", "#cc5de8", "#20c997"];

  // Cargar datos
  async function loadUsers() {
    try {
      if (!token) return;
      const res = await axios.get("http://127.0.0.1:8000/api/memberships/users_with_days/", {
        headers: { Authorization: "Bearer " + token }
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  }

  async function loadHistory() {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/reservations/history/", {
        headers: { Authorization: "Bearer " + token }
      });
      setHistory(res.data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  }

  async function loadMemberships() {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/memberships/plans/", {
        headers: { Authorization: "Bearer " + token }
      });
      setMemberships(res.data);
    } catch (error) {
      console.error("Error cargando membresías:", error);
    }
  }

  useEffect(() => {
    if (token) {
      loadUsers();
      loadHistory();
      loadMemberships();
    }
  }, [token]);

  useEffect(() => {
    connectWS();
    subscribeWS((msg) => {
      if (msg.event === "new_reservation" || msg.event === "reservation_deleted") {
        loadHistory();
      }
      if (msg.event === "days_updated" || msg.event === "user_created") {
        setTimeout(() => loadUsers(), 500);
      }
    });
  }, []);

  // Funciones
  async function assignMembership() {
    if (!selectedUser || !selectedMembership) {
      alert("⚠️ Selecciona un usuario y una membresía");
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/memberships/assign_days/",
        { user_id: selectedUser, membership_id: selectedMembership },
        { headers: { Authorization: "Bearer " + token } }
      );

      const userName = users.find(u => u.id === parseInt(selectedUser))?.username || "Usuario";
      const membershipName = memberships.find(m => m.id === parseInt(selectedMembership))?.name || "Membresía";
      alert(`✅ ${membershipName} asignada a ${userName}`);
      
      setSelectedUser("");
      setSelectedMembership("");
      loadUsers();
    } catch (error) {
      alert("❌ Error al asignar membresía");
    }
  }

  async function createUser() {
    if (!newUsername || !newPassword) {
      alert("⚠️ Completa todos los campos");
      return;
    }

    if (newPassword.length < 4) {
      alert("⚠️ La contraseña debe tener al menos 4 caracteres");
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/admin/create_user/",
        { username: newUsername, password: newPassword },
        { headers: { Authorization: "Bearer " + token } }
      );

      alert(`✅ Usuario ${newUsername} creado correctamente`);
      setNewUsername("");
      setNewPassword("");
      setTimeout(() => loadUsers(), 500);
    } catch (error) {
      if (error.response?.data?.error) {
        alert(`❌ ${error.response.data.error}`);
      } else {
        alert("❌ Error al crear usuario");
      }
    }
  }

  async function createMembership() {
    if (!newMembershipName || !newMembershipPrice || !newMembershipDays) {
      alert("⚠️ Completa todos los campos");
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/memberships/plans/",
        {
          name: newMembershipName,
          price: parseInt(newMembershipPrice),
          days: parseInt(newMembershipDays),
          icon: newMembershipIcon,
          color: newMembershipColor
        },
        { headers: { Authorization: "Bearer " + token } }
      );

      alert("✅ Membresía creada correctamente");
      setNewMembershipName("");
      setNewMembershipPrice("");
      setNewMembershipDays("");
      setNewMembershipIcon("🎁");
      setNewMembershipColor("#667eea");
      loadMemberships();
    } catch (error) {
      alert("❌ Error al crear membresía");
    }
  }

  async function deleteMembership(id) {
    if (!window.confirm("¿Estás seguro de eliminar esta membresía?")) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/memberships/plans/${id}/`, {
        headers: { Authorization: "Bearer " + token }
      });
      loadMemberships();
    } catch (error) {
      alert("❌ Error al eliminar membresía");
    }
  }

  function openEditModal(user) {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditPassword("");
    setShowEditModal(true);
  }

  async function updateUser() {
    if (!editUsername) {
      alert("⚠️ El nombre de usuario no puede estar vacío");
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/admin/update_user/${editingUser.id}/`,
        {
          username: editUsername,
          password: editPassword || undefined
        },
        { headers: { Authorization: "Bearer " + token } }
      );

      alert("✅ Usuario actualizado correctamente");
      setShowEditModal(false);
      setEditingUser(null);
      setEditUsername("");
      setEditPassword("");
      loadUsers();
    } catch (error) {
      if (error.response?.data?.error) {
        alert(`❌ ${error.response.data.error}`);
      } else {
        alert("❌ Error al actualizar usuario");
      }
    }
  }

  async function deleteUser(userId, username) {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${username}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/admin/delete_user/${userId}/`,
        { headers: { Authorization: "Bearer " + token } }
      );

      alert(`✅ Usuario "${username}" eliminado correctamente`);
      loadUsers();
    } catch (error) {
      if (error.response?.data?.error) {
        alert(`❌ ${error.response.data.error}`);
      } else {
        alert("❌ Error al eliminar usuario");
      }
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0 
    }).format(price);
  };

  const usersWithoutDays = users.filter(u => u.remaining_days === 0).length;
  const selectedMembershipData = memberships.find(m => m.id === parseInt(selectedMembership));

  return (
    <div className="admin-layout">
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🏋️ GYM SYSTEM</h2>
          <p>Panel de Administración</p>
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
              {user ? user.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="user-details">
              <span className="user-name">{user || "admin"}</span>
              <span className="user-role">Administrador</span>
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
            <h1>👋 Bienvenido, {user || "Admin"}</h1>
            <p className="subtitle">Aquí tienes un resumen de tu gimnasio</p>
            
            <div className="stats-grid">
              <div className="stat-card purple">
                <div className="stat-label">👥 Total Usuarios</div>
                <div className="stat-number">{users.length}</div>
              </div>
              <div className="stat-card red">
                <div className="stat-label">⚠️ Sin Días</div>
                <div className="stat-number">{usersWithoutDays}</div>
              </div>
            </div>

            <h3 className="section-title">⚡ Acciones Rápidas</h3>
            <div className="quick-actions">
              <button className="action-card" onClick={() => setActiveSection("createUser")}>
                <span className="action-icon">➕</span>
                <span>Crear Usuario</span>
              </button>
              <button className="action-card" onClick={() => setActiveSection("assignDays")}>
                <span className="action-icon">💳</span>
                <span>Asignar Días</span>
              </button>
              <button className="action-card" onClick={() => setActiveSection("users")}>
                <span className="action-icon">👥</span>
                <span>Ver Usuarios</span>
              </button>
            </div>
          </div>
        )}

        {/* CREAR USUARIO */}
        {activeSection === "createUser" && (
          <div className="section-page">
            <h1>➕ Crear Nuevo Usuario</h1>
            <div className="form-card">
              <div className="form-group">
                <label>👤 Nombre de usuario</label>
                <input
                  type="text"
                  placeholder="Ej: juan123"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                />
              </div>
              <div className="form-group">
                <label>🔒 Contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button className="btn btn-green" onClick={createUser}>
                ✅ Crear Usuario
              </button>
            </div>
          </div>
        )}

        {/* ASIGNAR MEMBRESÍA */}
        {activeSection === "assignDays" && (
          <div className="section-page">
            <h1>💳 Asignar Membresía</h1>
            <div className="form-card">
              <div className="form-group">
                <label>👤 Seleccionar usuario</label>
                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                  <option value="">-- Selecciona usuario --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.remaining_days} días)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>🏷️ Seleccionar membresía</label>
                <select value={selectedMembership} onChange={(e) => setSelectedMembership(e.target.value)}>
                  <option value="">-- Selecciona membresía --</option>
                  {memberships.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.icon} {m.name} - {m.days} días - {formatPrice(m.price)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMembershipData && (
                <div className="membership-preview">
                  <div className="preview-label">Resumen:</div>
                  <div className="preview-name">{selectedMembershipData.icon} {selectedMembershipData.name}</div>
                  <div className="preview-days">+{selectedMembershipData.days} días</div>
                  <div className="preview-price">{formatPrice(selectedMembershipData.price)}</div>
                </div>
              )}

              <button className="btn" onClick={assignMembership}>
                ✅ Asignar Membresía
              </button>
            </div>
          </div>
        )}

        {/* HISTORIAL */}
        {activeSection === "history" && (
          <div className="section-page section-wide">
            <h1>📋 Historial de Reservas</h1>
            <div className="content-card">
              {history.length === 0 ? (
                <p className="empty-message">No hay reservas activas</p>
              ) : (
                <div className="list-container">
                  {history.map(h => (
                    <div key={h.id} className="list-item">
                      <div className="list-info">
                        <span className="highlight">{h.user_name}</span>
                        <span className="text-muted"> reservó </span>
                        <span className="highlight-purple">{h.machine_name}</span>
                      </div>
                      <span className="badge purple">🕐 {h.hour}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEMBRESÍAS */}
        {activeSection === "memberships" && (
          <div className="section-page section-wide">
            <h1>🏷️ Gestión de Membresías</h1>
            
            {/* Crear Nueva Membresía */}
            <div className="form-card form-card-wide">
              <h3 className="form-title">➕ Crear Nueva Membresía</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>📝 Nombre</label>
                  <input
                    type="text"
                    placeholder="Ej: Promo Navidad"
                    value={newMembershipName}
                    onChange={(e) => setNewMembershipName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>💰 Precio (COP)</label>
                  <input
                    type="number"
                    placeholder="Ej: 100000"
                    value={newMembershipPrice}
                    onChange={(e) => setNewMembershipPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>📅 Días</label>
                  <input
                    type="number"
                    placeholder="Ej: 30"
                    value={newMembershipDays}
                    onChange={(e) => setNewMembershipDays(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>🎨 Icono</label>
                  <div className="icon-selector">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        className={`icon-btn ${newMembershipIcon === icon ? 'selected' : ''}`}
                        onClick={() => setNewMembershipIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>🎨 Color</label>
                <div className="color-selector">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`color-btn ${newMembershipColor === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setNewMembershipColor(color)}
                    />
                  ))}
                </div>
              </div>
              <button className="btn btn-green" onClick={createMembership}>
                ✅ Crear Membresía
              </button>
            </div>

            {/* Lista de Membresías */}
            <h3 className="list-title">📋 Membresías Actuales ({memberships.length})</h3>
            <div className="membership-grid">
              {memberships.map(m => (
                <div 
                  key={m.id} 
                  className="membership-card"
                  style={{ borderColor: m.color }}
                >
                  <button 
                    className="delete-btn"
                    onClick={() => deleteMembership(m.id)}
                  >
                    ✕
                  </button>
                  <div className="membership-icon">{m.icon}</div>
                  <div className="membership-name">{m.name}</div>
                  <div className="membership-price" style={{ color: m.color }}>
                    {formatPrice(m.price)}
                  </div>
                  <div className="membership-days-badge">
                    <span>⏱️ {m.days} días</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USUARIOS */}
        {activeSection === "users" && (
          <div className="section-page section-wide">
            <h1>👥 Usuarios Registrados ({users.length})</h1>
            
            {/* FILTROS */}
            <div className="filters-card">
              <div className="filter-group">
                <label>🔍 Buscar por nombre</label>
                <input
                  type="text"
                  placeholder="Escribe el nombre del usuario..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>📊 Filtrar por días</label>
                <select
                  value={filterDays}
                  onChange={(e) => setFilterDays(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos los usuarios</option>
                  <option value="with-days">✅ Con días disponibles</option>
                  <option value="without-days">⚠️ Sin días disponibles</option>
                </select>
              </div>

              {(searchUser || filterDays !== "all") && (
                <button
                  className="clear-filters-btn"
                  onClick={() => {
                    setSearchUser("");
                    setFilterDays("all");
                  }}
                >
                  ✕ Limpiar filtros
                </button>
              )}
            </div>

            {/* LISTA DE USUARIOS FILTRADA */}
            <div className="content-card">
              {(() => {
                let filteredUsers = users;

                if (searchUser) {
                  filteredUsers = filteredUsers.filter(u =>
                    u.username.toLowerCase().includes(searchUser.toLowerCase())
                  );
                }

                if (filterDays === "with-days") {
                  filteredUsers = filteredUsers.filter(u => u.remaining_days > 0);
                } else if (filterDays === "without-days") {
                  filteredUsers = filteredUsers.filter(u => u.remaining_days === 0);
                }

                if (filteredUsers.length === 0) {
                  return (
                    <p className="empty-message">
                      {searchUser || filterDays !== "all"
                        ? "No se encontraron usuarios con esos criterios"
                        : "Cargando usuarios..."}
                    </p>
                  );
                }

                return (
                  <>
                    <div className="results-summary">
                      Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuarios
                    </div>
                    <div className="list-container">
                      {filteredUsers.map(u => (
                        <div
                          key={u.id}
                          className={`list-item ${u.remaining_days > 0 ? 'border-green' : 'border-red'}`}
                        >
                          <div className="user-item-info">
                            <span className="highlight">👤 {u.username}</span>
                            <span className={`badge ${u.remaining_days > 0 ? 'green' : 'red'}`}>
                              {u.remaining_days} días
                            </span>
                          </div>
                          <div className="user-actions">
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => openEditModal(u)}
                              title="Editar usuario"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => deleteUser(u.id, u.username)}
                              title="Eliminar usuario"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* MODAL DE EDITAR USUARIO */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
              <h2>✏️ Editar Usuario</h2>
              <div className="modal-form">
                <div className="form-group">
                  <label>👤 Nombre de usuario</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Nuevo nombre de usuario"
                  />
                </div>
                <div className="form-group">
                  <label>🔒 Nueva contraseña (opcional)</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Dejar vacío para no cambiar"
                  />
                </div>
                <button className="btn" onClick={updateUser}>
                  ✅ Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}