let socket = null;
const listeners = [];

export function connectWS() {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  socket = new WebSocket(`${wsUrl}/ws/reservations/`);
  
  socket.onopen = () => console.log("✅ WebSocket conectado");
  socket.onerror = (err) => console.error("❌ WebSocket error:", err);
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    listeners.forEach(listener => listener(data));
  };
}

export function subscribeWS(callback) {
  listeners.push(callback);
}