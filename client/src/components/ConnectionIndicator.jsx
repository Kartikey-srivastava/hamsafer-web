import React, { useState } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';

export default function ConnectionIndicator({ stats }) {
  const [isOpen, setIsOpen] = useState(false);
  const { quality, rtt, packetLoss, bitrate, fps } = stats;

  let dotColor = 'bg-white/40';
  let qualityLabel = 'Connecting...';
  let badgeColor = 'text-white/60';

  if (quality === 'excellent') {
    dotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
    qualityLabel = 'Excellent';
    badgeColor = 'text-emerald-400';
  } else if (quality === 'good') {
    dotColor = 'bg-teal-400';
    qualityLabel = 'Good';
    badgeColor = 'text-teal-400';
  } else if (quality === 'fair') {
    dotColor = 'bg-amber-400';
    qualityLabel = 'Fair';
    badgeColor = 'text-amber-400';
  } else if (quality === 'poor') {
    dotColor = 'bg-rose-500 animate-pulse';
    qualityLabel = 'Poor';
    badgeColor = 'text-rose-400';
  } else if (quality === 'disconnected') {
    dotColor = 'bg-white/30';
    qualityLabel = 'Offline';
    badgeColor = 'text-white/40';
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Connection Quality Stats"
        className="glass px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all text-xs text-white/90"
      >
        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
        <span className="hidden sm:inline font-medium">{qualityLabel}</span>
        {quality === 'disconnected' ? (
          <WifiOff size={13} className="text-white/40" />
        ) : (
          <Wifi size={13} className={badgeColor} />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 w-56 glass-strong p-4 rounded-2xl shadow-2xl border border-white/15 text-white animate-fadeIn text-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-semibold flex items-center gap-1.5 text-rose-200">
                <Activity size={14} /> Call Quality
              </span>
              <span className={`font-bold ${badgeColor}`}>{qualityLabel}</span>
            </div>

            <div className="space-y-1.5 text-white/80">
              <div className="flex justify-between">
                <span>Latency (RTT):</span>
                <span className="font-mono text-white font-medium">{rtt} ms</span>
              </div>
              <div className="flex justify-between">
                <span>Bitrate:</span>
                <span className="font-mono text-white font-medium">{bitrate} kbps</span>
              </div>
              <div className="flex justify-between">
                <span>Packet Loss:</span>
                <span className="font-mono text-white font-medium">{packetLoss}%</span>
              </div>
              {fps > 0 && (
                <div className="flex justify-between">
                  <span>Frame Rate:</span>
                  <span className="font-mono text-white font-medium">{fps} fps</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-white/40 pt-1 border-t border-white/5 text-center">
              WebRTC Direct P2P Metrics
            </p>
          </div>
        </>
      )}
    </div>
  );
}
