import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, Heart } from 'lucide-react';

export default function Chat({
  isOpen,
  onClose,
  socket,
  roomCode,
  userName,
  onPlayMessage,
  unreadCount,
  onResetUnread
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isPartnerTyping]);

  // Reset unread count when chat opens
  useEffect(() => {
    if (isOpen && onResetUnread) {
      onResetUnread();
    }
  }, [isOpen, onResetUnread]);

  // Socket listeners for messages and typing indicator
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = ({ message, senderName, timestamp }) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), message, senderName, timestamp, isMe: false }
      ]);
      if (onPlayMessage) {
        onPlayMessage();
      }
    };

    const handlePeerTyping = ({ isTyping }) => {
      setIsPartnerTyping(Boolean(isTyping));
    };

    socket.on('chat-message', handleIncomingMessage);
    socket.on('peer-typing', handlePeerTyping);

    return () => {
      socket.off('chat-message', handleIncomingMessage);
      socket.off('peer-typing', handlePeerTyping);
    };
  }, [socket, onPlayMessage]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // Emit typing status
    if (socket && roomCode) {
      socket.emit('typing', { roomCode, isTyping: true, userName });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomCode, isTyping: false, userName });
      }, 1500);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !socket || !roomCode) return;

    const newMsg = {
      message: trimmed,
      senderName: userName,
      timestamp: Date.now()
    };

    // Emit to server
    socket.emit('chat-message', { roomCode, ...newMsg });

    // Clear typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing', { roomCode, isTyping: false, userName });

    // Append to local state
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), ...newMsg, isMe: true }
    ]);

    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 flex flex-col glass-strong shadow-2xl border-l border-white/15 bg-black/70 backdrop-blur-2xl animate-fadeIn">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
            <MessageCircle size={18} />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Sweet Whispers</h3>
            <p className="text-[11px] text-white/50">Private couple chat</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-2 p-6">
            <Heart size={32} className="text-rose-500/30 animate-pulse" />
            <p className="text-sm">Say something sweet to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
              >
                {!msg.isMe && (
                  <span className="text-[11px] text-rose-200/60 mb-1 px-1">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-md ${
                    msg.isMe
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-br-sm'
                      : 'glass border border-white/10 text-white/95 rounded-bl-sm'
                  }`}
                >
                  <span className="font-normal inline-block font-sans break-words leading-relaxed">
                    {msg.message}
                  </span>
                </div>
                <span className="text-[10px] text-white/35 mt-1 px-1">
                  {timeStr}
                </span>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-rose-300/80 text-xs italic pl-2 py-1">
            <span>Partner is writing</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Bar */}
      <div className="px-3 py-1.5 flex items-center gap-1 overflow-x-auto border-t border-white/5 bg-white/[0.02]">
        {['❤️', '😘', '🥰', '😍', '🌹', '✨', '🥺', '🫂', '🔥', '😂'].map((emo) => (
          <button
            key={emo}
            type="button"
            onClick={() => setInputText((prev) => prev + emo)}
            className="p-1 px-1.5 rounded-lg hover:bg-white/10 transition-transform active:scale-90 text-sm"
          >
            <span className="font-normal inline-block font-emoji select-none">{emo}</span>
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
        <input
          type="text"
          placeholder="Type a loving message..."
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
