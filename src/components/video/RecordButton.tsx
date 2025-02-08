import { useState } from 'react';
import { Record, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { RecordingService } from '@/lib/recording/recording-service';

interface RecordButtonProps {
  stream: MediaStream | null;
}

export function RecordButton({ stream }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingService = new RecordingService();

  const handleRecording = async () => {
    try {
      if (isRecording) {
        const blob = await recordingService.stopRecording();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
      } else if (stream) {
        recordingService.startRecording(stream);
        setIsRecording(true);
      }
      setError(null);
    } catch (err) {
      setError('Failed to handle recording. Please try again.');
      console.error('Recording error:', err);
    }
  };

  if (!stream) return null;

  return (
    <>
      <Button
        onClick={handleRecording}
        variant="ghost"
        size="icon"
        className={isRecording ? 'bg-red-500/10 text-red-500' : ''}
      >
        {isRecording ? (
          <StopCircle className="h-5 w-5" />
        ) : (
          <Record className="h-5 w-5" />
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