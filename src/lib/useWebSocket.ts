import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// El WebSocket se conecta al servidor sin el prefijo /api
// El prefijo /api solo aplica a rutas HTTP REST
const getWebSocketURL = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Remover /api del final si existe
  return apiUrl.replace(/\/api$/, '');
};

const SOCKET_URL = getWebSocketURL();

// Singleton: Una sola instancia de socket compartida por toda la aplicación
let socketInstance: Socket | null = null;

function getSocketInstance(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Fallback a polling si websocket falla
      autoConnect: true,
      reconnection: true, // Reconexión automática habilitada
      reconnectionAttempts: Infinity, // Intentos infinitos de reconexión
      reconnectionDelay: 1000, // Delay inicial: 1 segundo
      reconnectionDelayMax: 5000, // Delay máximo: 5 segundos
      timeout: 20000, // Timeout de conexión: 20 segundos
    });

    // Logs de conexión (solo se ejecutan una vez)
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket conectado:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado. Razón:', reason);
      if (reason === 'io server disconnect') {
        // El servidor forzó la desconexión, reconectar manualmente
        socketInstance?.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('⚠️ Error de conexión WebSocket:', error.message);
      // NO desconectar, dejar que socket.io maneje la reconexión automática
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconectado después de ${attemptNumber} intento(s)`);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Intentando reconectar WebSocket (intento ${attemptNumber})...`);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('⚠️ Error en reconexión:', error.message);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Reconexión fallida después de todos los intentos');
    });
  }

  return socketInstance;
}

export function useWebSocket<T = unknown>(event: string, callback: (data?: T) => void) {
  const callbackRef = useRef(callback);

  // Mantener el callback actualizado sin causar re-renders
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const socket = getSocketInstance();

    // Wrapper que siempre llama al callback más reciente con los datos del evento
    const eventHandler = (data?: T) => {
      callbackRef.current(data);
    };

    // Escuchar el evento específico
    socket.on(event, eventHandler);

    console.log(`Listener agregado para evento: ${event}`);

    // Cleanup: solo remover el listener, NO desconectar el socket
    return () => {
      socket.off(event, eventHandler);
      console.log(`Listener removido para evento: ${event}`);
    };
  }, [event]); // Solo depende del nombre del evento

  return socketInstance;
}
