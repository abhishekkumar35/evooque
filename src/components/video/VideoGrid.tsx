import { useState } from 'react';
import { VideoStream } from './VideoStream';
import { PictureInPicture } from './PictureInPicture';
import { PeerConnection } from '@/types';
import { cn } from '@/lib/utils';

interface VideoGridProps {
  localStream: MediaStream | null;
  connections: PeerConnection[];
  screenShare: MediaStream | null;
  currentUser: User;
  className?: string;
}

export function VideoGrid({
  localStream,
  connections,
  screenShare,
  currentUser,
  className,
}: VideoGridProps) {
  const [isScreenShareMinimized, setIsScreenShareMinimized] = useState(false);
  const totalStreams = (localStream ? 1 : 0) + connections.length;
  
  const gridConfig = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2',
    4: 'grid-cols-2',
    5: 'grid-cols-3',
    6: 'grid-cols-3',
    7: 'grid-cols-3',
    8: 'grid-cols-4',
    9: 'grid-cols-3',
  }[Math.min(totalStreams, 9) as keyof typeof gridConfig];

  return (
    <div className="relative">
      <div
        className={cn(
          'grid gap-4 auto-rows-fr',
          !screenShare && gridConfig,
          screenShare && !isScreenShareMinimized && 'hidden',
          className
        )}
      >
        {localStream && (
          <VideoStream
            stream={localStream}
            user={currentUser}
            isLocal
            isMuted
            className="aspect-video w-full"
          />
        )}
        
        {connections.map((conn) => (
          <VideoStream
            key={conn.peerId}
            stream={conn.stream}
            user={conn.user}
            className="aspect-video w-full"
          />
        ))}
      </div>

      {screenShare && (
        <div
          className={cn(
            'transition-all duration-300',
            isScreenShareMinimized ? 'absolute bottom-4 right-4' : 'h-full'
          )}
        >
          <PictureInPicture
            stream={screenShare}
            isMinimized={isScreenShareMinimized}
            onToggleMinimize={() => setIsScreenShareMinimized(!isScreenShareMinimized)}
          />
        </div>
      )}
    </div>
  );
} 