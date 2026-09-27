import { useState, useEffect, useRef, useCallback } from 'react';

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export function useWebRTC({ socket, roomCode, localVideoRef, remoteVideoRef }) {
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnection = useRef(null);
  const originalVideoTrack = useRef(null);
  const originalAudioTrack = useRef(null);
  const audioContextRef = useRef(null);
  const iceCandidateQueue = useRef([]);
  const dataChannelRef = useRef(null);
  const receivingFileRef = useRef({ info: null, chunks: [], receivedBytes: 0 });
  const onScreenShareEndedCallback = useRef(null);

  const [localMediaStream, setLocalMediaStream] = useState(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState(null);
  const [screenMediaStream, setScreenMediaStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUserName, setRemoteUserName] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPartnerScreenSharing, setIsPartnerScreenSharing] = useState(false);
  const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [activePeerConnection, setActivePeerConnection] = useState(null);
  const [sharedImages, setSharedImages] = useState([]);

  // Helper to re-attach current streams to video elements whenever DOM mounts/switches
  const attachStreams = useCallback(() => {
    if (localVideoRef?.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
    if (remoteVideoRef?.current && remoteStream.current) {
      remoteVideoRef.current.srcObject = remoteStream.current;
    }
  }, [localVideoRef, remoteVideoRef]);

  const initLocalStream = async () => {
    if (localStream.current) {
      attachStreams();
      return localStream.current;
    }

    const constraints = { 
      video: true, 
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
    };

    try {
      console.log('[WebRTC] Requesting camera & mic...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[WebRTC] Got media stream');
      localStream.current = stream;
      setLocalMediaStream(stream);
      if (localVideoRef?.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Full media access failed, trying video-only:', err.name);
      
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStream.current = videoStream;
        setLocalMediaStream(videoStream);
        if (localVideoRef?.current) {
          localVideoRef.current.srcObject = videoStream;
        }
        return videoStream;
      } catch (videoErr) {
        console.warn('[WebRTC] Video-only also failed, trying audio-only:', videoErr.name);
      }

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStream.current = audioStream;
        setLocalMediaStream(audioStream);
        return audioStream;
      } catch (audioErr) {
        console.warn('[WebRTC] Audio-only also failed:', audioErr.name);
      }

      console.error('[WebRTC] Running without camera/mic access.');
      return null;
    }
  };

  const setupDataChannel = (dc) => {
    dataChannelRef.current = dc;
    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      console.log('[WebRTC] DataChannel opened');
    };

    dc.onclose = () => {
      console.log('[WebRTC] DataChannel closed');
    };

    dc.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'file-start') {
            receivingFileRef.current = {
              info: msg,
              chunks: [],
              receivedBytes: 0
            };
          } else if (msg.type === 'file-end') {
            const { info, chunks } = receivingFileRef.current;
            if (info && chunks.length > 0) {
              const blob = new Blob(chunks, { type: info.fileType || 'image/jpeg' });
              const url = URL.createObjectURL(blob);
              setSharedImages((prev) => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  url,
                  fileName: info.fileName,
                  senderName: info.senderName || 'Partner',
                  timestamp: Date.now(),
                  isMe: false
                }
              ]);
            }
            receivingFileRef.current = { info: null, chunks: [], receivedBytes: 0 };
          }
        } catch (e) {
          console.error('[WebRTC] Error parsing dataChannel message', e);
        }
      } else if (event.data instanceof ArrayBuffer) {
        receivingFileRef.current.chunks.push(event.data);
        receivingFileRef.current.receivedBytes += event.data.byteLength;
      }
    };
  };

  const drainIceCandidates = async (pc) => {
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[WebRTC] Drained queued ICE candidate');
      } catch (err) {
        console.warn('[WebRTC] Failed to add queued ICE candidate:', err);
      }
    }
  };

  const createPeerConnection = (partnerSocketId, partnerName) => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    
    const pc = new RTCPeerConnection(iceServers);
    peerConnection.current = pc;
    setActivePeerConnection(pc);

    // Create Data Channel for P2P photo/file transfer
    try {
      const dc = pc.createDataChannel('hamsafer-files');
      setupDataChannel(dc);
    } catch (dcErr) {
      console.warn('[WebRTC] Could not create data channel:', dcErr);
    }

    pc.ondatachannel = (event) => {
      console.log('[WebRTC] Received remote data channel');
      setupDataChannel(event.channel);
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', {
          to: partnerSocketId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        remoteStream.current = event.streams[0];
        setRemoteMediaStream(event.streams[0]);
        if (remoteVideoRef?.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setIsConnected(true);
        if (partnerName) {
          setRemoteUserName(partnerName);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setIsConnected(false);
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsConnected(true);
      }
    };

    return pc;
  };

  const handleUserJoined = async ({ socketId, name }) => {
    console.log('[WebRTC] Partner joined, initiating offer to:', name);
    // Ensure local stream is ready before offering
    if (!localStream.current) {
      await initLocalStream();
    }

    const pc = createPeerConnection(socketId, name);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('signal', {
        to: socketId,
        signal: { type: 'offer', sdp: offer.sdp }
      });
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
    }
  };

  const handleSignal = async ({ from, signal, name }) => {
    try {
      if (signal.type === 'offer') {
        console.log('[WebRTC] Received offer from:', from);
        if (!localStream.current) {
          await initLocalStream();
        }

        const pc = createPeerConnection(from, name || 'Partner');
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        await drainIceCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', {
          to: from,
          signal: { type: 'answer', sdp: answer.sdp }
        });
      } else if (signal.type === 'answer') {
        console.log('[WebRTC] Received answer from:', from);
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          await drainIceCandidates(peerConnection.current);
        }
      } else if (signal.type === 'candidate' && signal.candidate) {
        const pc = peerConnection.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            console.warn('[WebRTC] Error adding ICE candidate immediately:', err);
          }
        } else {
          // Remote description not ready yet; buffer candidate
          iceCandidateQueue.current.push(signal.candidate);
        }
      }
    } catch (error) {
      console.error('[WebRTC] Error handling signal:', error);
    }
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuted = !audioTrack.enabled;
        setIsMuted(newMuted);
        if (socket && roomCode) {
          socket.emit('toggle-media', { roomCode, type: 'audio', enabled: !newMuted });
        }
      }
    }
  };

  const toggleCamera = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newCameraOff = !videoTrack.enabled;
        setIsCameraOff(newCameraOff);
        if (socket && roomCode) {
          socket.emit('toggle-media', { roomCode, type: 'video', enabled: !newCameraOff });
        }
      }
    }
  };

  const startScreenShare = async (onEndedCallback) => {
    if (onEndedCallback) {
      onScreenShareEndedCallback.current = onEndedCallback;
    }

    try {
      let screenStream;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            suppressLocalAudioPlayback: false
          }
        });
      } catch (audioConstraintErr) {
        console.warn('[WebRTC] getDisplayMedia audio constraints failed, trying basic audio:', audioConstraintErr);
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: true
          });
        } catch (audioErr) {
          console.warn('[WebRTC] getDisplayMedia audio failed, trying video only:', audioErr);
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" }
          });
        }
      }

      const screenTracks = screenStream.getTracks();
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      const screenAudioTracks = screenStream.getAudioTracks();
      const screenAudioTrack = screenAudioTracks.length > 0 ? screenAudioTracks[0] : null;

      screenStreamRef.current = screenStream;
      setScreenMediaStream(screenStream);

      // Save references to original camera and mic tracks
      const currentVideoTrack = localStream.current?.getVideoTracks()[0];
      originalVideoTrack.current = currentVideoTrack || null;

      const currentAudioTrack = localStream.current?.getAudioTracks()[0];
      originalAudioTrack.current = currentAudioTrack || null;

      // 1. Send screen video track to WebRTC peer connection
      if (peerConnection.current && screenVideoTrack) {
        const videoSender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
        }
      }

      // 2. Send screen audio track to WebRTC peer connection
      if (screenAudioTrack && peerConnection.current) {
        const audioSender = peerConnection.current.getSenders().find(s => s.track?.kind === 'audio');
        let combinedAudioTrack = screenAudioTrack;

        // Use Web Audio API to mix microphone and screen audio so both voice and system/tab audio are transmitted
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass && currentAudioTrack) {
            const audioCtx = new AudioContextClass();
            const dest = audioCtx.createMediaStreamDestination();

            const micSource = audioCtx.createMediaStreamSource(new MediaStream([currentAudioTrack]));
            micSource.connect(dest);

            const screenSource = audioCtx.createMediaStreamSource(new MediaStream([screenAudioTrack]));
            screenSource.connect(dest);

            audioContextRef.current = audioCtx;
            combinedAudioTrack = dest.stream.getAudioTracks()[0];
          }
        } catch (mixErr) {
          console.warn('[WebRTC] Audio mixing fallback to direct screen audio:', mixErr);
          combinedAudioTrack = screenAudioTrack;
        }

        if (audioSender) {
          await audioSender.replaceTrack(combinedAudioTrack);
        } else {
          peerConnection.current.addTrack(combinedAudioTrack, screenStream);
        }
      }

      if (localVideoRef?.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // Dynamic onended event listener on screen video track
      screenVideoTrack.onended = () => {
        console.log('[WebRTC] screenStream.getVideoTracks()[0].onended fired');
        // Automatically revert track senders back to local camera feed
        // Reset layout mode back to standard Video Call focus
        stopScreenShare();
      };

      setIsScreenSharing(true);
      if (socket && roomCode) {
        socket.emit('toggle-screen-share', { roomCode, isSharing: true });
      }

      return true;
    } catch (err) {
      console.log('[WebRTC] Screen sharing cancelled or failed:', err);
      return false;
    }
  };

  const stopScreenShare = async () => {
    // 1. Revert video sender back to local camera feed
    if (peerConnection.current && originalVideoTrack.current) {
      const videoSender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
      if (videoSender) {
        try {
          await videoSender.replaceTrack(originalVideoTrack.current);
        } catch (err) {
          console.warn('[WebRTC] Error reverting video sender track:', err);
        }
      }
    }

    // 2. Revert audio sender back to local mic track
    if (peerConnection.current && originalAudioTrack.current) {
      const audioSender = peerConnection.current.getSenders().find(s => s.track?.kind === 'audio');
      if (audioSender) {
        try {
          await audioSender.replaceTrack(originalAudioTrack.current);
        } catch (err) {
          console.warn('[WebRTC] Error reverting audio sender track:', err);
        }
      }
    }

    // 3. Close audio mixing context if active
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    // 4. Stop all screen stream tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      screenStreamRef.current = null;
    }
    setScreenMediaStream(null);

    // 5. Restore local video element if attached
    if (localVideoRef?.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
    }

    originalVideoTrack.current = null;
    originalAudioTrack.current = null;
    setIsScreenSharing(false);

    if (socket && roomCode) {
      socket.emit('toggle-screen-share', { roomCode, isSharing: false });
    }

    // 6. Reset layout mode back to standard Video Call focus
    if (onScreenShareEndedCallback.current) {
      onScreenShareEndedCallback.current();
    }
  };

  const sendImageFile = async (file, currentUserName = 'You') => {
    if (!file) return { success: false };

    // Try WebRTC DataChannel first if open
    const dc = dataChannelRef.current;
    if (dc && dc.readyState === 'open') {
      try {
        const chunkSize = 16384; // 16 KB
        const arrayBuffer = await file.arrayBuffer();
        const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

        dc.send(JSON.stringify({
          type: 'file-start',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          totalChunks,
          senderName: currentUserName
        }));

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
          const chunk = arrayBuffer.slice(start, end);
          dc.send(chunk);
        }

        dc.send(JSON.stringify({ type: 'file-end' }));

        const localUrl = URL.createObjectURL(file);
        setSharedImages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            url: localUrl,
            fileName: file.name,
            senderName: 'You',
            timestamp: Date.now(),
            isMe: true
          }
        ]);
        return { success: true };
      } catch (err) {
        console.warn('[WebRTC] DataChannel send failed, using socket fallback:', err);
      }
    }

    // Socket fallback (Base64 data URL)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result;
        if (socket && roomCode) {
          socket.emit('share-image', {
            roomCode,
            imageData: base64Data,
            senderName: currentUserName,
            caption: file.name
          });
        }
        setSharedImages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            url: base64Data,
            fileName: file.name,
            senderName: 'You',
            timestamp: Date.now(),
            isMe: true
          }
        ]);
        resolve({ success: true });
      };
      reader.onerror = () => resolve({ success: false });
      reader.readAsDataURL(file);
    });
  };

  const cleanup = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      screenStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (dataChannelRef.current) {
      try { dataChannelRef.current.close(); } catch (e) {}
      dataChannelRef.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    localStream.current = null;
    remoteStream.current = null;
    peerConnection.current = null;
    originalVideoTrack.current = null;
    originalAudioTrack.current = null;
    iceCandidateQueue.current = [];
    setActivePeerConnection(null);
    setIsConnected(false);
    setLocalMediaStream(null);
    setRemoteMediaStream(null);
    setScreenMediaStream(null);
  };

  useEffect(() => {
    if (!socket || !roomCode) return;
    
    initLocalStream();

    socket.on('user-joined', handleUserJoined);
    socket.on('signal', handleSignal);

    // Media toggles from remote peer
    const handlePeerMediaToggle = ({ type, enabled }) => {
      if (type === 'video') {
        setIsRemoteCameraOff(!enabled);
      } else if (type === 'audio') {
        setIsRemoteMuted(!enabled);
      }
    };
    socket.on('peer-media-toggle', handlePeerMediaToggle);

    // Screen sharing status from remote peer
    const handlePeerScreenShare = ({ isSharing }) => {
      setIsPartnerScreenSharing(Boolean(isSharing));
    };
    socket.on('peer-screen-share', handlePeerScreenShare);

    const handlePeerImage = ({ imageData, senderName, caption, timestamp }) => {
      setSharedImages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          url: imageData,
          fileName: caption || 'Shared Photo',
          senderName: senderName || 'Partner',
          timestamp: timestamp || Date.now(),
          isMe: false
        }
      ]);
    };
    socket.on('peer-image', handlePeerImage);

    socket.on('user-left', () => {
      setIsConnected(false);
      remoteStream.current = null;
      setRemoteMediaStream(null);
      if (remoteVideoRef?.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
        setActivePeerConnection(null);
      }
      setIsPartnerScreenSharing(false);
      setIsRemoteCameraOff(false);
      setIsRemoteMuted(false);
    });

    return () => {
      cleanup();
      socket.off('user-joined');
      socket.off('signal');
      socket.off('peer-media-toggle', handlePeerMediaToggle);
      socket.off('peer-screen-share', handlePeerScreenShare);
      socket.off('peer-image', handlePeerImage);
      socket.off('user-left');
    };
  }, [socket, roomCode]);

  return {
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
    setOnScreenShareEnded: (cb) => { onScreenShareEndedCallback.current = cb; },
    attachStreams,
    cleanup
  };
}
