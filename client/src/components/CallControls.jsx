import React from 'react';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  MessageCircle,
  Image,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function CallControls({ 
  isMuted, 
  isCameraOff, 
  isScreenSharing, 
  onToggleMute, 
  onToggleCamera, 
  onStartScreenShare, 
  onStopScreenShare, 
  onLeaveRoom,
  onToggleChat,
  isChatOpen,
  unreadCount = 0,
  onToggleImageShare,
  isImageShareOpen,
  reactionTrigger,
  isSoundMuted,
  onToggleSoundMuted
}) {
  return (
    <div className="glass-strong px-4 sm:px-6 py-2.5 rounded-full flex items-center gap-2 sm:gap-3.5 shadow-2xl border border-white/15 backdrop-blur-xl">
      {/* Mic toggle */}
      <button
        onClick={onToggleMute}
        title={isMuted ? "Unmute Mic" : "Mute Mic"}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'glass text-white hover:bg-white/20'
        }`}
      >
        {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
      </button>

      {/* Camera toggle */}
      <button
        onClick={onToggleCamera}
        title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          isCameraOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'glass text-white hover:bg-white/20'
        }`}
      >
        {isCameraOff ? <CameraOff size={19} /> : <Camera size={19} />}
      </button>

      {/* Screen share toggle */}
      <button
        onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
        title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          isScreenSharing ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'glass text-white hover:bg-white/20'
        }`}
      >
        {isScreenSharing ? <MonitorOff size={19} /> : <MonitorUp size={19} />}
      </button>

      {/* Reaction Emojis Trigger */}
      {reactionTrigger}

      {/* Photo Sharing */}
      <button
        onClick={onToggleImageShare}
        title="Share Photos"
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          isImageShareOpen ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/25' : 'glass text-white hover:bg-white/20'
        }`}
      >
        <Image size={19} />
      </button>

      {/* Chat toggle with unread badge */}
      <button
        onClick={onToggleChat}
        title="Open Chat"
        className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          isChatOpen ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/25' : 'glass text-white hover:bg-white/20'
        }`}
      >
        <MessageCircle size={19} />
        {unreadCount > 0 && !isChatOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Sound effects mute toggle */}
      {onToggleSoundMuted && (
        <button
          onClick={onToggleSoundMuted}
          title={isSoundMuted ? "Unmute App Sounds" : "Mute App Sounds"}
          className="w-11 h-11 rounded-full glass text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center transition-all hidden sm:flex"
        >
          {isSoundMuted ? <VolumeX size={19} className="text-rose-400" /> : <Volume2 size={19} />}
        </button>
      )}

      <div className="w-px h-7 bg-white/15 mx-1"></div>

      {/* Leave room / End Call */}
      <button
        onClick={onLeaveRoom}
        title="Leave Room"
        className="w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
      >
        <PhoneOff size={19} />
      </button>
    </div>
  );
}
