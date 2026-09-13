import React from 'react';
import { MonitorUp, MonitorX, Info, Sparkles, Tv } from 'lucide-react';

export default function ScreenShare({
  isScreenSharing,
  isPartnerScreenSharing,
  onStartShare,
  onStopShare,
  isConnected,
  remoteUserName,
  localVideoRef,
  remoteVideoRef
}) {
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  // If someone is actively sharing screen, display the stage view!
  const hasActiveScreen = isScreenSharing || isPartnerScreenSharing;

  return (
    <div className="w-full h-full pt-16 sm:pt-20 pb-28 sm:pb-32 px-3 sm:px-4 flex flex-col items-center justify-center">
      {hasActiveScreen ? (
        <div className="w-full max-w-5xl h-full flex flex-col gap-3 animate-fadeIn">
          {/* Top Status Header */}
          <div className="flex items-center justify-between glass px-4 py-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-medium text-white flex items-center gap-1.5">
                <Tv size={16} className="text-rose-400" />
                {isScreenSharing ? 'You are sharing your screen' : `${remoteUserName || 'Partner'} is sharing screen`}
              </span>
            </div>

            {isScreenSharing && (
              <button
                onClick={onStopShare}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all shadow-md flex items-center gap-1.5"
              >
                <MonitorX size={14} /> Stop Sharing
              </button>
            )}
          </div>

          {/* Main Stage Screen Display Container */}
          <div className="flex-1 rounded-2xl sm:rounded-3xl overflow-hidden glass-strong border border-white/15 bg-black flex items-center justify-center relative shadow-2xl">
            {isScreenSharing ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      ) : (
        /* Empty / Idle State */
        <div className="glass-strong p-6 sm:p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl border border-white/15 animate-fadeIn">
          {isMobile ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Info size={32} />
              </div>
              <h2 className="text-xl font-semibold text-white">Mobile Device Detected</h2>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                Mobile browsers restrict screen capture due to OS security. You can view your partner's screen here when they share from a desktop computer.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <MonitorUp size={38} />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold text-white">Screen Share Portal</h2>
                <p className="text-white/60 text-xs sm:text-sm">
                  Share your browser window, a romantic movie, or your desktop directly on the stage.
                </p>
              </div>

              <button
                onClick={onStartShare}
                disabled={!isConnected}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isConnected 
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-500/25 active:scale-98' 
                    : 'glass text-white/30 cursor-not-allowed'
                }`}
              >
                <MonitorUp size={18} /> Start Sharing Screen
              </button>

              {!isConnected && (
                <p className="text-xs text-amber-300/80">Connect with your partner first to begin sharing.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
