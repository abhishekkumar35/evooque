import { useEffect, useRef, useState } from 'react';
import { PeerService } from '@/lib/webrtc/peer-service';
import { useConnectionStore } from '@/store/useConnectionStore';
import { useToastStore } from '@/components/ui/toast';

export function useWebRTC(roomId: string) {
  const peerServiceRef = useRef<PeerService>();
  const { setConnectionState, setConnections } = useConnectionStore();
  const addToast = useToastStore((state) => state.addToast);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    peerServiceRef.current = new PeerService();
    const peerService = peerServiceRef.current;

    const handleError = (error: Error) => {
      setError(error);
      addToast({
        type: 'error',
        message: error.message,
        duration: 5000,
      });
    };

    const setupMediaStream = async () => {
      try {
        setConnectionState('connecting');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);
        peerService.setLocalStream(stream);
        setConnectionState('connected');
      } catch (error) {
        handleError(error as Error);
        setConnectionState('disconnected');
      }
    };

    const handlePeerEvents = () => {
      peerService.on('stream', ({ peerId, stream }) => {
        setConnections((prev) => [
          ...prev,
          { peerId, stream, user: { id: peerId, name: `User ${peerId}` } },
        ]);
      });

      peerService.on('error', ({ peerId, error }) => {
        handleError(error);
        setConnections((prev) => prev.filter((conn) => conn.peerId !== peerId));
      });

      peerService.on('close', ({ peerId }) => {
        setConnections((prev) => prev.filter((conn) => conn.peerId !== peerId));
      });

      peerService.on('iceStateChange', ({ peerId, state }) => {
        if (state === 'disconnected') {
          addToast({
            type: 'warning',
            message: 'Connection unstable. Attempting to reconnect...',
            duration: 3000,
          });
        }
      });
    };

    setupMediaStream();
    handlePeerEvents();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      peerService.removeAllPeers();
    };
  }, [roomId]);

  return {
    localStream,
    error,
    peerService: peerServiceRef.current,
  };
} 