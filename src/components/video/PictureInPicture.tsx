import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PictureInPictureProps {
  stream: MediaStream;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}

export function PictureInPicture({
  stream,
  isMinimized = false,
  onToggleMinimize,
  className,
}: PictureInPictureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPiPSupported, setIsPiPSupported] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      setIsPiPSupported(document.pictureInPictureEnabled);
    }
  }, [stream]);

  const togglePiP = async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Failed to toggle PiP:', error);
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg overflow-hidden transition-all duration-300',
        isMinimized ? 'w-48 h-32' : 'w-full h-full',
        className
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isPiPSupported && (
          <Button
            onClick={togglePiP}
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
        {onToggleMinimize && (
          <Button
            onClick={onToggleMinimize}
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white ml-2"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
} 