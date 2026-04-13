import { io } from 'socket.io-client';

let socket = null;
const listeners = {};

const socketService = {
  connect: (userId, { onConnect, onDisconnect, onReconnect } = {}) => {
    if (socket && socket.connected) return socket;

    socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      socket.emit('userConnected', userId);
      if (onConnect) onConnect(socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      if (onDisconnect) onDisconnect(reason);
    });

    socket.on('reconnect', (attempt) => {
      console.log(`🔄 WebSocket reconnected after ${attempt} attempts`);
      socket.emit('userConnected', userId);
      if (onReconnect) onReconnect(attempt);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ WebSocket connection error:', err.message);
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on: (event, callback) => {
    if (socket) {
      // Remove old listener for this event to avoid duplicates
      if (listeners[event]) {
        socket.off(event, listeners[event]);
      }
      listeners[event] = callback;
      socket.on(event, callback);
    }
  },

  off: (event) => {
    if (socket && listeners[event]) {
      socket.off(event, listeners[event]);
      delete listeners[event];
    }
  },

  emit: (event, data) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit "${event}": socket not connected`);
    }
  },

  isConnected: () => !!(socket && socket.connected),

  getSocket: () => socket,
};

export default socketService;
