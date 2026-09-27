import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSounds } from '../hooks/useSounds';
import { useConnectionStats } from '../hooks/useConnectionStats';
import { useDraggable } from '../hooks/useDraggable';
import { useToast } from './Toast';
import VideoChat from './VideoChat';
import WatchParty from './WatchParty';
import ScreenShare from './ScreenShare';
import CallControls from './CallControls';
import Chat from './Chat';
import ReactionEmojis from './ReactionEmojis';
import ImageShare from './ImageShare';
import ConnectionIndicator from './ConnectionIndicator';
import MediaVideo from './MediaVideo';
import { Video, MonitorPlay, MonitorUp, Copy, Check, GripHorizontal } from 'lucide-react';

export default function Room({ socket, roomCode, userName, onLeaveRoom }) {
  const [activeMode, setActiveMode] = useState('video-chat');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isImageShareOpen, setIsImageShareOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const { showToast } = useToast();
  const {
    playJoin,
    playLeave,
    playMessage,
    playReaction,
    isSoundMuted,
    toggleSoundMuted
  } = useSounds();

  const {
    localStream,
    remoteStream,
    screenStreamRef,
    localMediaStream,
    remoteMediaStream,
    screenMediaStream,
    isMuted,
    isCameraOff,
    isConnected,
    remoteUserName,
    isScreenSharing,
    isPartnerScreenSharing,
    isRemoteCameraOff,
    isRemoteMuted,
    activePeerConnection,
    sharedImages,
    sendImageFile,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    setOnScreenShareEnded,
    attachStreams,
    cleanup
  } = useWebRTC({ socket, roomCode, localVideoRef, remoteVideoRef });

  // WebRTC real-time connection stats
  const connectionStats = useConnectionStats(activePeerConnection, isConnected);

  // Draggable PiP
  const { dragRef, position: pipPos, isDragging, dragHandlers } = useDraggable();

  // Dynamic layout reset when local screen share ends (via browser stop or button)
  useEffect(() => {
    setOnScreenShareEnded(() => {
      console.log('[Room] Screen share ended, resetting layout to video-chat');
      setActiveMode('video-chat');
    });
  }, [setOnScreenShareEnded]);

  const handleStartScreenShare = useCallback(async () => {
    const success = await startScreenShare(() => {
      setActiveMode('video-chat');
    });
    if (success) {
      setActiveMode('screen-share');
    }
  }, [startScreenShare]);

  const handleStopScreenShare = useCallback(async () => {
    await stopScreenShare();
    setActiveMode('video-chat');
  }, [stopScreenShare]);

  // Re-attach media streams whenever mode changes or partner connects
  useEffect(() => {
    const timer = setTimeout(() => {
      attachStreams();
    }, 60);
    return () => clearTimeout(timer);
  }, [activeMode, isConnected, isScreenSharing, isPartnerScreenSharing, attachStreams]);

  // Listen for peer join/leave to play sound and show toast
  useEffect(() => {
    if (!socket) return;

    const onUserJoined = ({ name }) => {
      playJoin();
      showToast(`${name || 'Partner'} joined the call! 💕`, 'success');
    };

    const onUserLeft = () => {
      playLeave();
      showToast('Partner left the room', 'info');
    };

    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);

    return () => {
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
    };
  }, [socket, playJoin, playLeave, showToast]);

  // Viewer's view: Automatically switch Main Stage Area to render incoming Screen Share Stream
  useEffect(() => {
    if (isPartnerScreenSharing) {
      setActiveMode('screen-share');
      showToast(`${remoteUserName || 'Partner'} started sharing screen! 🖥️`, 'info');
    } else if (!isScreenSharing && activeMode === 'screen-share') {
      // When screen sharing ends, automatically reset layout mode back to standard Video Call focus
      setActiveMode('video-chat');
    }
  }, [isPartnerScreenSharing, isScreenSharing, remoteUserName, showToast, activeMode]);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!socket) return;

    const onChatMessage = () => {
      if (!isChatOpen) {
        setUnreadChatCount((prev) => prev + 1);
      }
    };

    socket.on('chat-message', onChatMessage);
    return () => socket.off('chat-message', onChatMessage);
  }, [socket, isChatOpen]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    showToast('Room code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  }, [roomCode, showToast]);

  const handleLeave = () => {
    cleanup();
    onLeaveRoom();
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-black/50 select-none">
      {/* Top Bar Navigation & Indicators */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-40 flex justify-between items-center pointer-events-none">
        {/* Room Code Pill */}
        <div className="glass px-3.5 py-1.5 rounded-full flex items-center gap-2.5 pointer-events-auto shadow-lg border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-white/60 text-xs font-medium">Room:</span>
            <span className="font-mono text-white text-sm font-bold tracking-wider">{roomCode}</span>
          </div>
          <button 
            onClick={handleCopyCode}
            title="Copy Room Code"
            className="text-white/50 hover:text-white transition-colors p-1 rounded-md"
          >
            {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Status & Connection Indicator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <ConnectionIndicator stats={connectionStats} />

          <div className="glass px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg border border-white/10">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 animate-pulse'}`}></div>
            <span className="text-xs font-medium text-white/90">
              {isConnected ? (remoteUserName || 'Partner Connected') : 'Waiting for partner...'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Mode Workspace (rendered with CSS visibility to keep player and streams alive) */}
      <div className="flex-1 relative">
        <div className={`w-full h-full ${activeMode === 'video-chat' ? 'block' : 'hidden'}`}>
          <VideoChat
            localVideoRef={activeMode === 'video-chat' ? localVideoRef : null}
            remoteVideoRef={activeMode === 'video-chat' ? remoteVideoRef : null}
            localStream={localMediaStream}
            remoteStream={remoteMediaStream}
            isConnected={isConnected}
            remoteUserName={remoteUserName}
            isCameraOff={isCameraOff}
            isRemoteCameraOff={isRemoteCameraOff}
            isMuted={isMuted}
            isRemoteMuted={isRemoteMuted}
          />
        </div>

        <div className={`w-full h-full ${activeMode === 'watch-party' ? 'block' : 'hidden'}`}>
          <WatchParty socket={socket} roomCode={roomCode} />
        </div>

        <div className={`w-full h-full ${activeMode === 'screen-share' ? 'block' : 'hidden'}`}>
          <ScreenShare
            isScreenSharing={isScreenSharing}
            isPartnerScreenSharing={isPartnerScreenSharing}
            onStartShare={handleStartScreenShare}
            onStopShare={handleStopScreenShare}
            isConnected={isConnected}
            remoteUserName={remoteUserName}
            screenStream={screenMediaStream}
            remoteStream={remoteMediaStream}
            localStream={localMediaStream}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
          />
        </div>

        {/* Floating Draggable PiP Video Window (Shown when NOT in full video-chat mode) */}
        {activeMode !== 'video-chat' && (
          <div
            ref={dragRef}
            {...dragHandlers}
            style={{
              position: 'fixed',
              left: pipPos ? `${pipPos.x}px` : 'auto',
              top: pipPos ? `${pipPos.y}px` : 'auto',
              right: pipPos ? 'auto' : '16px',
              bottom: pipPos ? 'auto' : '110px',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            className={`z-40 glass-strong p-2 rounded-2xl shadow-2xl border border-white/20 flex flex-col gap-1.5 transition-shadow select-none ${
              isDragging ? 'shadow-rose-500/20 scale-105 opacity-90' : ''
            }`}
          >
            <div className="flex items-center justify-between px-1 text-white/40 text-[10px]">
              <span className="flex items-center gap-1 font-medium text-rose-300/80">
                <GripHorizontal size={12} /> Video Dock
              </span>
              {isPartnerScreenSharing && (
                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full border border-rose-500/30">
                  Screen Viewing
                </span>
              )}
              {isScreenSharing && (
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-500/30">
                  Screen Sharing
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {/* Local User Camera Feed (Non-sharing user's camera pinned when viewing, or sharer's facecam) */}
              <div className="w-24 sm:w-28 h-32 sm:h-36 rounded-xl overflow-hidden glass shadow-inner bg-black/60 relative flex items-center justify-center">
                <MediaVideo
                  stream={localMediaStream}
                  muted={true}
                  mirror={true}
                  className={`w-full h-full object-cover ${isCameraOff ? 'opacity-0' : 'opacity-100'}`}
                />
                {isCameraOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                    <span className="text-[10px]">Cam Off</span>
                  </div>
                )}
                <span className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white/80">
                  You {isCameraOff ? '(Cam Off)' : ''}
                </span>
              </div>

              {/* Remote User Video Feed (User B's remote video feed pinned when User A is sharing) */}
              {isConnected && (
                <div className="w-24 sm:w-28 h-32 sm:h-36 rounded-xl overflow-hidden glass shadow-inner bg-black/60 relative flex items-center justify-center">
                  {isScreenSharing ? (
                    /* Sharer's view: User B's remote video feed stays pinned in the dock */
                    <>
                      <MediaVideo
                        stream={remoteMediaStream}
                        muted={false}
                        className={`w-full h-full object-cover ${isRemoteCameraOff ? 'opacity-0' : 'opacity-100'}`}
                      />
                      {isRemoteCameraOff && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                          <span className="text-[10px]">Cam Off</span>
                        </div>
                      )}
                      <span className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white/80">
                        {remoteUserName || 'Partner'} {isRemoteCameraOff ? '(Cam Off)' : ''}
                      </span>
                    </>
                  ) : isPartnerScreenSharing ? (
                    /* Viewer's view: partner screen is on main stage; dock shows partner status */
                    <div className="flex flex-col items-center justify-center text-center p-2 text-rose-300">
                      <span className="text-xl mb-1">🖥️</span>
                      <span className="text-[10px] font-medium text-white">{remoteUserName || 'Partner'}</span>
                      <span className="text-[8px] text-rose-300/70">On Main Stage</span>
                    </div>
                  ) : (
                    /* Other modes (watch-party): standard remote camera */
                    <>
                      <MediaVideo
                        stream={remoteMediaStream}
                        muted={false}
                        className={`w-full h-full object-cover ${isRemoteCameraOff ? 'opacity-0' : 'opacity-100'}`}
                      />
                      {isRemoteCameraOff && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                          <span className="text-[10px]">Cam Off</span>
                        </div>
                      )}
                      <span className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white/80">
                        {remoteUserName || 'Partner'} {isRemoteCameraOff ? '(Cam Off)' : ''}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Drawers / Overlays */}
      <Chat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        socket={socket}
        roomCode={roomCode}
        userName={userName}
        onPlayMessage={playMessage}
        unreadCount={unreadChatCount}
        onResetUnread={() => setUnreadChatCount(0)}
      />

      <ImageShare
        isOpen={isImageShareOpen}
        onClose={() => setIsImageShareOpen(false)}
        sharedImages={sharedImages}
        onSendImage={sendImageFile}
        userName={userName}
        isConnected={isConnected}
      />

      {/* Bottom Controls & Mode Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 z-40 flex flex-col items-center gap-2.5 sm:gap-3 pointer-events-none">
        {/* Core Media & Feature Controls Bar */}
        <div className="pointer-events-auto">
          <CallControls 
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isScreenSharing={isScreenSharing}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onStartScreenShare={handleStartScreenShare}
            onStopScreenShare={handleStopScreenShare}
            onLeaveRoom={handleLeave}
            onToggleChat={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) setIsImageShareOpen(false);
            }}
            isChatOpen={isChatOpen}
            unreadCount={unreadChatCount}
            onToggleImageShare={() => {
              setIsImageShareOpen(!isImageShareOpen);
              if (!isImageShareOpen) setIsChatOpen(false);
            }}
            isImageShareOpen={isImageShareOpen}
            reactionTrigger={
              <ReactionEmojis
                socket={socket}
                roomCode={roomCode}
                userName={userName}
                onPlayReaction={playReaction}
              />
            }
            isSoundMuted={isSoundMuted}
            onToggleSoundMuted={toggleSoundMuted}
          />
        </div>
        
        {/* Mode Switcher Dock */}
        <div className="glass px-2 py-1.5 rounded-2xl flex gap-1 sm:gap-1.5 pointer-events-auto border border-white/10 shadow-xl backdrop-blur-xl">
          <button
            onClick={() => setActiveMode('video-chat')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs font-medium transition-all ${
              activeMode === 'video-chat'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Video size={15} /> <span>Video Call</span>
          </button>
          <button
            onClick={() => setActiveMode('watch-party')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs font-medium transition-all ${
              activeMode === 'watch-party'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MonitorPlay size={15} /> <span>Watch Party</span>
          </button>
          <button
            onClick={() => setActiveMode('screen-share')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs font-medium transition-all ${
              activeMode === 'screen-share'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MonitorUp size={15} /> <span>Screen Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
