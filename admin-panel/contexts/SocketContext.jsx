'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { initSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { getToken } from '@/lib/auth';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getToken();
    
    if (token) {
      const socketInstance = initSocket(token);
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setConnected(false);
      });

      return () => {
        disconnectSocket();
        setSocket(null);
        setConnected(false);
      };
    }
  }, []);

  const value = {
    socket,
    connected,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
}
