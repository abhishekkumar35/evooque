import { useState } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, MonitorUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { screenShareService } from '@/lib/webrtc/screen-share-service';
import { RecordingControls } from './RecordingControls';
import { useToastStore } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { RoomSettings } from '../room/RoomSettings';
import { useMediaStore } from '@/store/useMediaStore';

interface MediaControlsProps {
  onLeaveCall?: () => void;
  onScreenShare?: (stream: MediaStream | null) => void;
  stream: MediaStream | null;
  className?: string;
}

export function MediaControls({
  onLeaveCall,
  onScreenShare,
  stream,
  className,
}: MediaControlsProps) {
  const {
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo: toggleVideoState,
    toggleAudio: toggleAudioState,
    setScreenSharing,
  } = useMediaStore();
  const addToast = useToastStore((state) => state.addToast);

  const toggleVideo = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    toggleVideoState();
  };

  const toggleAudio = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    toggleAudioState();
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        screenShareService.stopScreenShare();
        onScreenShare?.(null);
        setScreenSharing(false);
      } else {
        const stream = await screenShareService.startScreenShare();
        onScreenShare?.(stream);
        setScreenSharing(true);

        // Handle stream end
        stream.getVideoTracks()[0].onended = () => {
          screenShareService.stopScreenShare();
          onScreenShare?.(null);
          setScreenSharing(false);
        };
      }
    } catch (error) {
      console.error('Screen share error:', error);
      addToast({
        type: 'error',
        message: 'Failed to share screen',
        duration: 3000,
      });
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <Button
        onClick={toggleVideo}
        variant={isVideoEnabled ? 'ghost' : 'destructive'}
        size="icon"
        className="h-12 w-12"
      >
        {isVideoEnabled ? (
          <Video className="h-5 w-5" />
        ) : (
          <VideoOff className="h-5 w-5" />
        )}
      </Button>

      <Button
        onClick={toggleAudio}
        variant={isAudioEnabled ? 'ghost' : 'destructive'}
        size="icon"
        className="h-12 w-12"
      >
        {isAudioEnabled ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5" />
        )}
      </Button>

      <Button
        onClick={handleScreenShare}
        variant={isScreenSharing ? 'default' : 'ghost'}
        size="icon"
        className="h-12 w-12"
      >
        <MonitorUp className="h-5 w-5" />
      </Button>

      <RecordingControls stream={stream} />

      <RoomSettings />

      {onLeaveCall && (
        <Button
          onClick={onLeaveCall}
          variant="destructive"
          size="icon"
          className="h-12 w-12"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
} 