import React, { useState, useEffect } from 'react';
import { Heart, Copy, ArrowRight, Users, Sparkles, Loader2, Check } from 'lucide-react';
import FloatingHearts from './FloatingHearts';
import confetti from 'canvas-confetti';

export default function LandingPage({ onCreateRoom, onJoinRoom, roomCode, error, isLoading }) {
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState(roomCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setInputRoomCode(room.toUpperCase().trim());
      setMode('join');
    }
  }, []);

  useEffect(() => {
    if (roomCode && roomCode !== createdRoomCode) {
      setCreatedRoomCode(roomCode);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#fb7185', '#fda4af']
      });
    }
  }, [roomCode]);

  const handleCreate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    console.log('[LandingPage] Creating room, name:', trimmedName);
    onCreateRoom(trimmedName);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmedName = name.trim();
    const trimmedCode = inputRoomCode.trim().toUpperCase();
    if (!trimmedName || !trimmedCode) return;
    console.log('[LandingPage] Joining room:', trimmedCode, 'name:', trimmedName);
    onJoinRoom(trimmedCode, trimmedName);
  };

  const handleEnterRoom = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!createdRoomCode || !name.trim()) return;
    console.log('[LandingPage] Entering created room:', createdRoomCode, 'name:', name.trim());
    onJoinRoom(createdRoomCode, name.trim());
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[LandingPage] Failed to copy:', err);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <FloatingHearts />
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-10 animate-fadeIn">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Heart className="text-rose-500 fill-rose-500 animate-heartbeat" size={40} />
            <h1 className="text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-pink-500">
              Hamsafer
            </h1>
          </div>
          <p className="text-rose-200/80 text-lg">Together, Always</p>
        </div>

        <div className="glass-strong p-8 rounded-3xl shadow-2xl animate-fadeIn">
          {createdRoomCode && mode === 'create' ? (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <p className="text-rose-200">Your room is ready!</p>
                <div className="text-4xl font-mono text-white font-bold tracking-widest bg-white/10 py-4 rounded-xl">
                  {createdRoomCode}
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}?room=${createdRoomCode}`)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl glass hover:bg-white/10 transition-colors text-white"
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  {copied ? 'Copied!' : 'Copy Invite Link'}
                </button>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleEnterRoom}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Entering...
                    </>
                  ) : (
                    <>
                      Enter Room <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
                <button
                  className={`flex-1 text-center font-medium transition-colors ${mode === 'create' ? 'text-rose-400' : 'text-white/50 hover:text-white'}`}
                  onClick={() => { setMode('create'); }}
                >
                  Create Room
                </button>
                <button
                  className={`flex-1 text-center font-medium transition-colors ${mode === 'join' ? 'text-rose-400' : 'text-white/50 hover:text-white'}`}
                  onClick={() => { setMode('join'); }}
                >
                  Join Room
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                  {error}
                </div>
              )}

              {mode === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !name.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} /> Create Room
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-5">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="6-Letter Room Code"
                      value={inputRoomCode}
                      maxLength={6}
                      onChange={(e) => setInputRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all uppercase tracking-wider"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !name.trim() || !inputRoomCode.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Joining...
                      </>
                    ) : (
                      <>
                        <Users size={18} /> Join Room
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
