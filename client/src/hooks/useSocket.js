import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!socketRef.current) {
      const url = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : window.location.origin;
      
      socketRef.current = io(url, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      
      setSocket(socketRef.current);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, []);

  return socket;
}
