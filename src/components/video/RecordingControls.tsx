import { useState } from 'react';
import { Download, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recordingService } from '@/lib/webrtc/recording-service';
import { useToastStore } from '@/components/ui/toast';

interface RecordingControlsProps {
  stream: MediaStream | null;
  className?: string;
}

export function RecordingControls({ stream, className }: RecordingControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const handleStartRecording = () => {
    if (!stream) {
      addToast({
        type: 'error',
        message: 'No stream available to record',
        duration: 3000,
      });
      return;
    }

    const success = recordingService.startRecording(stream, (blob) => {
      setHasRecording(true);
      addToast({
        type: 'success',
        message: 'Recording saved successfully',
        duration: 3000,
      });
    });

    if (success) {
      setIsRecording(true);
      addToast({
        type: 'info',
        message: 'Recording started',
        duration: 2000,
      });
    } else {
      addToast({
        type: 'error',
        message: 'Failed to start recording',
        duration: 3000,
      });
    }
  };

  const handleStopRecording = () => {
    const success = recordingService.stopRecording();
    if (success) {
      setIsRecording(false);
      addToast({
        type: 'info',
        message: 'Recording stopped',
        duration: 2000,
      });
    }
  };

  const handleDownload = () => {
    const success = recordingService.downloadRecording();
    if (success) {
      addToast({
        type: 'success',
        message: 'Recording downloaded',
        duration: 2000,
      });
    } else {
      addToast({
        type: 'error',
        message: 'No recording available to download',
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          onClick={handleStartRecording}
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600"
          disabled={!stream}
        >
          <Record className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          onClick={handleStopRecording}
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 animate-pulse"
        >
          <StopCircle className="h-5 w-5" />
        </Button>
      )}

      {hasRecording && (
        <Button
          onClick={handleDownload}
          variant="ghost"
          size="icon"
          className="text-primary-500 hover:text-primary-600"
        >
          <Download className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
} 