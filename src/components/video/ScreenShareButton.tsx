import { useState } from 'react';
import { Monitor, MonitorOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface ScreenShareButtonProps {
  onScreenShare: (stream: MediaStream | null) => void;
}

export function ScreenShareButton({ onScreenShare }: ScreenShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleScreenShare = async () => {
    try {
      if (isSharing) {
        onScreenShare(null);
        setIsSharing(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        stream.getVideoTracks()[0].onended = () => {
          setIsSharing(false);
          onScreenShare(null);
        };

        onScreenShare(stream);
        setIsSharing(true);
      }
      setError(null);
    } catch (err) {
      setError('Failed to share screen. Please try again.');
      console.error('Screen share error:', err);
    }
  };

  return (
    <>
      <Button
        onClick={toggleScreenShare}
        variant="ghost"
        size="icon"
        className={isSharing ? 'bg-primary-500/10 text-primary-500' : ''}
      >
        {isSharing ? (
          <MonitorOff className="h-5 w-5" />
        ) : (
          <Monitor className="h-5 w-5" />
        )}
      </Button>
      {error && (
        <Alert
          type="error"
          message={error}
          className="absolute bottom-4 left-4 right-4"
        />
      )}
    </>
  );
} 