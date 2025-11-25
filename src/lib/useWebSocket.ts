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
      transports: ['websocket'],
      autoConnect: true,
    });

    // Logs de conexión (solo se ejecutan una vez)
    socketInstance.on('connect', () => {
      console.log('WebSocket conectado:', socketInstance?.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket desconectado');
    });
  }

  return socketInstance;
}

export function useWebSocket(event: string, callback: () => void) {
  const callbackRef = useRef(callback);

  // Mantener el callback actualizado sin causar re-renders
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const socket = getSocketInstance();

    // Wrapper que siempre llama al callback más reciente
    const eventHandler = () => {
      callbackRef.current();
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
