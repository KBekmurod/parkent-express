'use client';

import { useEffect } from 'react';
import { useSocketContext } from '@/contexts/SocketContext';

export default function useRealtime(event, callback) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (socket && event && callback) {
      socket.on(event, callback);

      return () => {
        socket.off(event, callback);
      };
    }
  }, [socket, event, callback]);

  return socket;
}
