import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("role");

    if (savedToken && savedUser && savedRole) {
      setToken(savedToken);
      setUser(savedUser);
      setRole(savedRole);
      
      // ✅ VERIFICAR QUE EL TOKEN SIGA VÁLIDO
      verifyToken(savedToken, savedUser, savedRole);
    } else {
      setLoading(false);
    }
  }, []);

  async function verifyToken(savedToken, savedUser, savedRole) {
    try {
      await axios.get("http://127.0.0.1:8000/api/auth/me/", {
        headers: { Authorization: "Bearer " + savedToken }
      });
      
      console.log("✅ Token válido");
      setLoading(false);
    } catch (error) {
      console.error("❌ Token expirado o inválido, cerrando sesión...");
      logout();
      setLoading(false);
    }
  }

  async function login(username, password) {
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/auth/login/", {
        username,
        password,
      });

      const access = response.data.access;

      const me = await axios.get("http://127.0.0.1:8000/api/auth/me/", {
        headers: { Authorization: "Bearer " + access },
      });

      const userData = me.data;
      const roleValue = userData.is_admin ? "admin" : "user";

      setToken(access);
      setUser(userData.username);
      setRole(roleValue);

      localStorage.setItem("token", access);
      localStorage.setItem("user", userData.username);
      localStorage.setItem("role", roleValue);

      console.log("✅ Login exitoso:", userData.username, "Role:", roleValue);

      return { success: true, role: roleValue };
    } catch (error) {
      console.error("❌ Error en login:", error);
      return { success: false };
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    setToken(null);
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}