import React, { useState, useEffect, useCallback, memo } from 'react';
import { Heart, Sparkles, Smile } from 'lucide-react';

const EMOJIS = ['❤️', '😘', '🥰', '😍', '🌹', '🔥', '👏', '😂'];

function ReactionEmojis({ socket, roomCode, userName, onPlayReaction }) {
  const [floatingList, setFloatingList] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const triggerBurst = useCallback((emoji, isLocal = true) => {
    const burstCount = 6;
    const newItems = Array.from({ length: burstCount }, (_, i) => ({
      id: Date.now() + Math.random() + i,
      emoji,
      left: Math.random() * 60 + 20, // 20% to 80% across screen
      size: Math.random() * 20 + 28, // 28px - 48px
      duration: Math.random() * 0.8 + 1.6, // 1.6s - 2.4s
      rotation: (Math.random() - 0.5) * 45,
      isLocal
    }));

    setFloatingList((prev) => [...prev, ...newItems]);

    if (onPlayReaction) {
      onPlayReaction();
    }

    // Cleanup after animation completes
    setTimeout(() => {
      const idsToRemove = new Set(newItems.map(n => n.id));
      setFloatingList((prev) => prev.filter((item) => !idsToRemove.has(item.id)));
    }, 2500);
  }, [onPlayReaction]);

  const sendReaction = useCallback((emoji) => {
    if (socket && roomCode) {
      socket.emit('reaction', { roomCode, emoji, senderName: userName });
    }
    triggerBurst(emoji, true);
    setShowPicker(false);
  }, [socket, roomCode, userName, triggerBurst]);

  useEffect(() => {
    if (!socket) return;

    const handlePeerReaction = ({ emoji, senderName }) => {
      triggerBurst(emoji, false);
    };

    socket.on('peer-reaction', handlePeerReaction);
    return () => socket.off('peer-reaction', handlePeerReaction);
  }, [socket, triggerBurst]);

  return (
    <>
      {/* Floating Animated Emojis Screen Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingList.map((item) => (
          <div
            key={item.id}
            className="absolute select-none animate-floatUp"
            style={{
              left: `${item.left}%`,
              bottom: '10%',
              fontSize: `${item.size}px`,
              animationDuration: `${item.duration}s`,
              transform: `rotate(${item.rotation}deg)`,
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))'
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Reaction Picker Button & Tray */}
      <div className="relative pointer-events-auto">
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 glass-strong px-3 py-2 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/20 animate-fadeIn backdrop-blur-xl">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-transform rounded-xl hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => setShowPicker(!showPicker)}
          title="Send Reaction Emoji"
          className="w-12 h-12 rounded-full glass hover:bg-white/20 text-rose-300 hover:text-rose-100 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/10"
        >
          <Heart size={20} className="fill-rose-400/30 text-rose-400 hover:fill-rose-400" />
        </button>
      </div>
    </>
  );
}

export default memo(ReactionEmojis);
