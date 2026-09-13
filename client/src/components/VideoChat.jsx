import React from 'react';
import { Heart, MicOff, VideoOff, User } from 'lucide-react';

export default function VideoChat({
  localVideoRef,
  remoteVideoRef,
  isConnected,
  remoteUserName,
  isCameraOff,
  isRemoteCameraOff,
  isMuted,
  isRemoteMuted
}) {
  return (
    <div className="w-full h-full p-3 sm:p-4 pt-16 sm:pt-20 pb-28 sm:pb-32 flex flex-col md:grid md:grid-cols-2 gap-3 sm:gap-4">
      {/* Local Video Card */}
      <div className="relative flex-1 rounded-2xl sm:rounded-3xl overflow-hidden glass-strong shadow-2xl bg-black/60 border border-white/10 flex items-center justify-center">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isCameraOff ? 'opacity-0' : 'opacity-100'}`} 
        />

        {isCameraOff && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-black/40 to-black/80 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center backdrop-blur-md text-rose-300">
              <VideoOff size={32} />
            </div>
            <span className="text-white/80 font-medium text-sm">Your Camera is Off</span>
          </div>
        )}

        {/* Local Name Badge */}
        <div className="absolute bottom-3 left-3 glass-strong px-3 py-1.5 rounded-xl text-white text-xs flex items-center gap-2 border border-white/15">
          <span className="font-medium">You</span>
          {isMuted && (
            <span title="You are muted" className="text-rose-400">
              <MicOff size={13} />
            </span>
          )}
        </div>
      </div>

      {/* Remote Video Card */}
      <div className="relative flex-1 rounded-2xl sm:rounded-3xl overflow-hidden glass-strong shadow-2xl bg-black/60 border border-white/10 flex items-center justify-center">
        {!isConnected ? (
          <div className="text-center space-y-4 p-6 animate-fadeIn">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></div>
              <Heart className="text-rose-500 fill-rose-500 animate-heartbeat" size={42} />
            </div>
            <div className="space-y-1">
              <p className="text-white text-base font-medium">Waiting for your partner...</p>
              <p className="text-white/50 text-xs">Share your 6-character room code to start talking</p>
            </div>
          </div>
        ) : (
          <>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isRemoteCameraOff ? 'opacity-0' : 'opacity-100'}`} 
            />

            {isRemoteCameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-black/40 to-black/80 animate-fadeIn">
                <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center backdrop-blur-md text-rose-300">
                  <User size={36} />
                </div>
                <span className="text-white/80 font-medium text-sm">
                  {remoteUserName || 'Partner'} turned camera off
                </span>
              </div>
            )}

            {/* Remote Name Badge */}
            <div className="absolute bottom-3 left-3 glass-strong px-3 py-1.5 rounded-xl text-white text-xs flex items-center gap-2 border border-white/15">
              <span className="font-medium text-rose-200">{remoteUserName || 'Partner'}</span>
              {isRemoteMuted && (
                <span title="Partner is muted" className="text-rose-400 flex items-center gap-1">
                  <MicOff size={13} />
                  <span className="text-[10px]">Muted</span>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
