import React, { useState, useEffect, useRef } from 'react';
import { Play, Youtube, AlertCircle } from 'lucide-react';

export default function WatchParty({ socket, roomCode }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef(null);
  const syncLockRef = useRef(false);
  const lastTimeRef = useRef(0);

  const extractVideoId = (url) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.length === 11 && !cleanUrl.includes('/') && !cleanUrl.includes('?')) {
      return cleanUrl;
    }

    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = cleanUrl.match(regExp);
    return match ? match[1] : null;
  };

  const handleLoad = (e) => {
    e.preventDefault();
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      socket.emit('yt-sync', { roomCode, action: 'load', videoId: id });
    }
  };

  useEffect(() => {
    if (!videoId) return;

    const loadPlayer = () => {
      try {
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById(videoId);
          return;
        }

        playerRef.current = new window.YT.Player('yt-player', {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1
          },
          events: {
            onReady: () => {
              setIsReady(true);
            },
            onStateChange: (event) => {
              if (syncLockRef.current) return;
              
              const time = event.target.getCurrentTime ? event.target.getCurrentTime() : 0;
              lastTimeRef.current = time;

              if (event.data === window.YT.PlayerState.PLAYING) {
                socket.emit('yt-sync', { roomCode, action: 'play', videoTime: time, videoId });
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                socket.emit('yt-sync', { roomCode, action: 'pause', videoTime: time, videoId });
              }
            }
          }
        });
      } catch (err) {
        console.warn('[WatchParty] Player creation error:', err);
      }
    };

    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = loadPlayer;
    } else {
      loadPlayer();
    }
  }, [videoId, roomCode, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleSync = ({ action, videoTime, videoId: incomingVideoId }) => {
      if (action === 'load' && incomingVideoId && incomingVideoId !== videoId) {
        setVideoId(incomingVideoId);
        return;
      }
      
      if (!playerRef.current) return;

      syncLockRef.current = true;
      try {
        if (action === 'play') {
          if (videoTime !== undefined && Math.abs(playerRef.current.getCurrentTime() - videoTime) > 1.5) {
            playerRef.current.seekTo(videoTime, true);
          }
          playerRef.current.playVideo();
        } else if (action === 'pause') {
          if (videoTime !== undefined) {
            playerRef.current.seekTo(videoTime, true);
          }
          playerRef.current.pauseVideo();
        } else if (action === 'seek' && videoTime !== undefined) {
          playerRef.current.seekTo(videoTime, true);
        }
      } catch (e) {
        console.error('[WatchParty] Sync exception:', e);
      }
      
      setTimeout(() => {
        syncLockRef.current = false;
      }, 800);
    };

    socket.on('yt-sync', handleSync);
    return () => socket.off('yt-sync', handleSync);
  }, [socket, videoId]);

  return (
    <div className="w-full h-full pt-16 sm:pt-20 pb-28 sm:pb-32 px-3 sm:px-4 flex flex-col items-center justify-center overflow-y-auto">
      <div className="w-full max-w-4xl space-y-4">
        {/* URL Input Form */}
        <form onSubmit={handleLoad} className="glass-strong p-3 sm:p-4 rounded-2xl flex gap-2.5 shadow-xl border border-white/15">
          <div className="flex-1 relative flex items-center">
            <Youtube size={18} className="absolute left-3.5 text-rose-500" />
            <input
              type="text"
              placeholder="Paste YouTube or Shorts URL to sync..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-white/35"
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-md active:scale-98"
          >
            Play Together
          </button>
        </form>

        {/* Video Stage Frame */}
        <div className="w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden glass-strong bg-black border border-white/15 shadow-2xl relative">
          {videoId ? (
            <div id="yt-player" className="w-full h-full"></div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-3 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Play size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-white text-base font-medium">Watch YouTube in Perfect Sync</p>
                <p className="text-xs text-white/40 max-w-sm">
                  When you play, pause, or seek, your partner's video stays synchronized automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
