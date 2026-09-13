import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    if (!socketRef.current) {
      const realRenderUrl = 'https://hamsafer-web.onrender.com';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // Check for environment variable and filter out literal template placeholders
      let envUrl = import.meta.env.VITE_SERVER_URL;
      if (envUrl && (envUrl.includes('your-render-backend-url') || envUrl.includes('placeholder'))) {
        console.warn('[useSocket] Ignoring placeholder VITE_SERVER_URL:', envUrl);
        envUrl = null;
      }

      const targetUrl = isLocal 
        ? 'http://localhost:3001' 
        : (envUrl || realRenderUrl);

      console.log('[useSocket] Connecting to signaling server at:', targetUrl);

      const s = io(targetUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 40,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 25000
      });

      socketRef.current = s;
      setSocket(s);

      s.on('connect', () => {
        console.log('[useSocket] Connected to signaling server! Socket ID:', s.id);
        setIsSocketConnected(true);
      });

      s.on('disconnect', (reason) => {
        console.warn('[useSocket] Disconnected from signaling server:', reason);
        setIsSocketConnected(false);
      });

      s.on('connect_error', (err) => {
        console.warn('[useSocket] Connection error:', err.message);
        setIsSocketConnected(false);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsSocketConnected(false);
      }
    };
  }, []);

  return { socket, isSocketConnected };
}
