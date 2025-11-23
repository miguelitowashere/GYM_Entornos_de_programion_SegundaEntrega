import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { connectWS, subscribeWS } from "../../api/ws";

import "./DashboardUser.css";

export default function DashboardUser() {
  const { token } = useAuth();

  const [daysLeft, setDaysLeft] = useState(0);
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [message, setMessage] = useState(null);
  const [myReservations, setMyReservations] = useState([]);

  const [open, setOpen] = useState({
    days: true,
    create: false,
    list: false,
  });

  const HOURS = [
    "06:00", "07:00", "08:00", "09:00", "10:00",
    "11:00", "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00", "20:00"
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
      setMessage("⚠ Selecciona máquina y hora");
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
      setMessage("❌ Esta máquina ya está reservada en ese horario");
    }
  }

  return (
  <div>
    <Navbar />

    <div className="dashboard-container">

      {/* SECCIÓN 1 - DÍAS RESTANTES */}
      <div className="section">
        <div className="section-header" onClick={() => setOpen({ ...open, days: !open.days })}>
          <h3>📅 Mis días restantes</h3>
          <svg 
            style={{ 
              width: '20px', 
              height: '20px', 
              transform: open.days ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {open.days && (
          <div className="section-content">
            <div className="days-display">
              <span className="days-number">{daysLeft}</span>
              <span className="days-label">días disponibles</span>
            </div>
            {daysLeft === 0 && (
              <p className="warning-text">⚠️ No tienes días disponibles. Contacta al administrador.</p>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 2 - CREAR RESERVA */}
      <div className="section">
        <div className="section-header" onClick={() => setOpen({ ...open, create: !open.create })}>
          <h3>📝 Crear reserva</h3>
          <svg 
            style={{ 
              width: '20px', 
              height: '20px', 
              transform: open.create ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {open.create && (
          <div className="section-content">
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="input-select"
            >
              <option value="">🏋️ Selecciona máquina</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              className="input-select"
            >
              <option value="">🕐 Selecciona hora</option>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>

            <button 
              className="btn" 
              onClick={createReservation}
              disabled={daysLeft === 0}
              style={{
                opacity: daysLeft === 0 ? 0.5 : 1,
                cursor: daysLeft === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {daysLeft === 0 ? '❌ Sin días disponibles' : '✅ Reservar'}
            </button>

            {message && <p className="msg">{message}</p>}
          </div>
        )}
      </div>

      {/* SECCIÓN 3 - MIS RESERVAS */}
      <div className="section">
        <div className="section-header" onClick={() => setOpen({ ...open, list: !open.list })}>
          <h3>📖 Mis reservas</h3>
          <svg 
            style={{ 
              width: '20px', 
              height: '20px', 
              transform: open.list ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {open.list && (
          <div className="section-content">
            {myReservations.length === 0 ? (
              <p className="empty-message">No tienes reservas activas</p>
            ) : (
              myReservations.map(r => (
                <div key={r.id} className="reservation-box">
                  <b>🏋️ {r.machine_name}</b>
                  <span className="reservation-time">🕐 {r.hour}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  </div>
);
}