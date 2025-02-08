import { useState } from 'react';
import { User } from '@/types';
import { VolumeIndicator } from './VolumeIndicator';
import { NetworkQuality } from './NetworkQuality';
import { cn } from '@/lib/utils';

interface VideoOverlayProps {
  stream: MediaStream;
  user: User;
  isLocal?: boolean;
  isMuted?: boolean;
  className?: string;
}

export function VideoOverlay({ 
  stream, 
  user, 
  isLocal, 
  isMuted,
  className 
}: VideoOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity",
        !isHovered && "opacity-0 hover:opacity-100",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white">
                {user.name[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-white">
              {user.name} {isLocal && '(You)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isMuted && <VolumeIndicator stream={stream} />}
            <NetworkQuality stream={stream} />
          </div>
        </div>
      </div>
    </div>
  );
} 