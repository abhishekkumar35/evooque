import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { VideoOverlay } from './VideoOverlay';
import { User } from '@/types';

interface VideoStreamProps {
  stream: MediaStream;
  user: User;
  isMuted?: boolean;
  isLocal?: boolean;
  className?: string;
}

export function VideoStream({ 
  stream, 
  user,
  isMuted = false, 
  isLocal = false, 
  className 
}: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={cn(
          'h-full w-full rounded-lg bg-dark-100 object-cover',
          isLocal && 'mirror'
        )}
      />
      <VideoOverlay
        stream={stream}
        user={user}
        isLocal={isLocal}
        isMuted={isMuted}
      />
    </div>
  );
} 