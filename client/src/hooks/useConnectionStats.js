import { useState, useEffect, useRef } from 'react';

export function useConnectionStats(peerConnection, isConnected) {
  const [stats, setStats] = useState({
    quality: 'disconnected', // 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected'
    rtt: 0, // ms
    packetLoss: 0, // %
    bitrate: 0, // kbps
    fps: 0,
  });

  const prevBytesRef = useRef(0);
  const prevTimestampRef = useRef(0);

  useEffect(() => {
    if (!peerConnection || !isConnected) {
      setStats({
        quality: 'disconnected',
        rtt: 0,
        packetLoss: 0,
        bitrate: 0,
        fps: 0,
      });
      return;
    }

    const interval = setInterval(async () => {
      try {
        if (!peerConnection || peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'failed') {
          setStats((prev) => ({ ...prev, quality: 'disconnected' }));
          return;
        }

        const report = await peerConnection.getStats();
        let currentRtt = 0;
        let totalLost = 0;
        let totalReceived = 0;
        let currentBytes = 0;
        let currentFps = 0;
        let now = Date.now();

        report.forEach((stat) => {
          // Candidate pair for Round Trip Time
          if (stat.type === 'candidate-pair' && (stat.nominated || stat.state === 'succeeded')) {
            if (stat.currentRoundTripTime !== undefined) {
              currentRtt = Math.round(stat.currentRoundTripTime * 1000);
            }
          }

          // Inbound RTP for audio / video stats
          if (stat.type === 'inbound-rtp') {
            if (stat.packetsLost !== undefined) totalLost += stat.packetsLost;
            if (stat.packetsReceived !== undefined) totalReceived += stat.packetsReceived;
            if (stat.bytesReceived !== undefined) currentBytes += stat.bytesReceived;
            if (stat.framesPerSecond !== undefined) currentFps = Math.round(stat.framesPerSecond);
          }
        });

        // Calculate bitrate in kbps
        let computedBitrate = 0;
        if (prevBytesRef.current > 0 && prevTimestampRef.current > 0) {
          const timeDiff = (now - prevTimestampRef.current) / 1000;
          if (timeDiff > 0) {
            const byteDiff = currentBytes - prevBytesRef.current;
            computedBitrate = Math.max(0, Math.round((byteDiff * 8) / (timeDiff * 1000)));
          }
        }
        prevBytesRef.current = currentBytes;
        prevTimestampRef.current = now;

        // Calculate packet loss percentage
        const totalPackets = totalLost + totalReceived;
        const lossPercent = totalPackets > 0 ? Math.min(100, Math.round((totalLost / totalPackets) * 100)) : 0;

        // Determine quality rating
        let qualityRating = 'good';
        if (currentRtt > 0 && currentRtt <= 100 && lossPercent <= 1) {
          qualityRating = 'excellent';
        } else if (currentRtt <= 250 && lossPercent <= 5) {
          qualityRating = 'good';
        } else if (currentRtt <= 500 && lossPercent <= 12) {
          qualityRating = 'fair';
        } else if (currentRtt > 500 || lossPercent > 12) {
          qualityRating = 'poor';
        }

        setStats({
          quality: qualityRating,
          rtt: currentRtt,
          packetLoss: lossPercent,
          bitrate: computedBitrate,
          fps: currentFps
        });
      } catch (err) {
        console.warn('[useConnectionStats] Failed to retrieve stats:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [peerConnection, isConnected]);

  return stats;
}
