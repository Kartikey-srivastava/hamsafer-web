import React, { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import Room from './components/Room';
import { ToastProvider, useToast } from './components/Toast';
import { useSocket } from './hooks/useSocket';

function AppContent() {
  const [page, setPage] = useState('landing'); // 'landing' | 'room'
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { socket, isSocketConnected } = useSocket();
  const { showToast } = useToast();

  const handleCreateRoom = useCallback((name) => {
    if (!socket) return;
    setError('');
    setIsLoading(true);

    const executeCreate = () => {
      console.log('[App] Creating room for:', name);
      socket.emit('create-room', { name }, (response) => {
        setIsLoading(false);
        console.log('[App] create-room response:', response);
        if (response && response.roomCode) {
          setRoomCode(response.roomCode);
          setUserName(name);
          showToast('Room created! Share code with your love 💕', 'success');
        } else {
          setError('Failed to create room. Please try again.');
          showToast('Failed to create room', 'error');
        }
      });
    };

    if (!socket.connected) {
      showToast('Connecting to server, please wait a moment... 🌹', 'info');
      socket.once('connect', () => {
        executeCreate();
      });
      return;
    }

    executeCreate();
  }, [socket, showToast]);

  const handleJoinRoom = useCallback((code, name) => {
    if (!socket) return;
    if (!code || !code.trim()) {
      setError('Please enter a room code.');
      showToast('Please enter a room code', 'warning');
      return;
    }
    if (!name || !name.trim()) {
      setError('Please enter your name.');
      showToast('Please enter your name', 'warning');
      return;
    }
    
    setError('');
    setIsLoading(true);
    const trimmedCode = code.trim().toUpperCase();

    const executeJoin = () => {
      console.log('[App] Joining room:', trimmedCode, 'as:', name);
      socket.emit('join-room', { roomCode: trimmedCode, name: name.trim() }, (response) => {
        setIsLoading(false);
        console.log('[App] join-room response:', response);
        if (response && response.success) {
          setRoomCode(trimmedCode);
          setUserName(name.trim());
          setPage('room');
          showToast(`Welcome to your private room, ${name.trim()}! 🌹`, 'success');
        } else {
          const errorMsg = response?.message || 'Failed to join room. Please try again.';
          setError(errorMsg);
          showToast(errorMsg, 'error');
        }
      });
    };

    if (!socket.connected) {
      showToast('Connecting to server, please wait a moment... 🌹', 'info');
      socket.once('connect', () => {
        executeJoin();
      });
      return;
    }

    executeJoin();
  }, [socket, showToast]);

  const handleLeaveRoom = useCallback(() => {
    console.log('[App] Leaving room:', roomCode);
    if (socket) {
      socket.emit('leave-room');
    }
    setPage('landing');
    setRoomCode('');
    setUserName('');
    setError('');
    showToast('Left the room', 'info');
  }, [socket, roomCode, showToast]);

  return (
    <>
      {page === 'landing' && (
        <LandingPage 
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          roomCode={roomCode}
          error={error}
          isLoading={isLoading}
          isSocketConnected={isSocketConnected}
        />
      )}
      {page === 'room' && (
        <Room 
          socket={socket}
          roomCode={roomCode}
          userName={userName}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
