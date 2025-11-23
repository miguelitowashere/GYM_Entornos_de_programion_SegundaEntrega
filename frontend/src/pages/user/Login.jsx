import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContactModal, setShowContactModal] = useState(false); // ✅ NUEVO

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!username || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await login(username, password);

    setIsLoading(false);

    if (!result.success) {
      setError("Usuario o contraseña incorrectos");
      return;
    }

    if (result.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/user");
    }
  }

  return (
    <div className="login-page">
      <div className="bg-blur bg-blur-1"></div>
      <div className="bg-blur bg-blur-2"></div>
      <div className="bg-blur bg-blur-3"></div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h4l3-3 4 4 3-3h4M3 17h4l3-3 4 4 3-3h4M3 12h18" />
            </svg>
          </div>
          <h1>GYM System</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Usuario</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Ingresando...
              </>
            ) : (
              <>
                Ingresar
                <span>→</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            ¿Problemas para ingresar?{' '}
            <button 
              type="button"
              onClick={() => setShowContactModal(true)}
              className="contact-link"
            >
              Contacta al administrador
            </button>
          </p>
        </div>
      </div>

      {/* ✅ MODAL DE CONTACTO */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowContactModal(false)}>✕</button>
            <h2>📞 Contacta al Administrador</h2>
            <div className="contact-options">
              <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer" className="contact-option">
                <span className="contact-icon">💬</span>
                <div>
                  <strong>WhatsApp</strong>
                  <p>+57 300 123 4567</p>
                </div>
              </a>
              <a href="mailto:admin@gym.com" className="contact-option">
                <span className="contact-icon">📧</span>
                <div>
                  <strong>Email</strong>
                  <p>admin@gym.com</p>
                </div>
              </a>
              <div className="contact-option">
                <span className="contact-icon">📍</span>
                <div>
                  <strong>Dirección</strong>
                  <p>Cl. 9 #27, Bucaramanga, Santander, UIS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}