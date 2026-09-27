import React, { useRef, useEffect } from 'react';

/**
 * MediaVideo renders a WebRTC MediaStream reliably to a <video> element.
 * It dynamically synchronizes video.srcObject with the active stream,
 * avoiding ref collisions and stream disconnection issues.
 */
export default function MediaVideo({
  stream,
  muted = false,
  className = '',
  mirror = false,
  ...props
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Handled silently: autoplay with sound can require user interaction
          if (err.name !== 'AbortError') {
            console.warn('[MediaVideo] Autoplay note:', err.name);
          }
        });
      }
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`${mirror ? 'transform scale-x-[-1]' : ''} ${className}`}
      {...props}
    />
  );
}
