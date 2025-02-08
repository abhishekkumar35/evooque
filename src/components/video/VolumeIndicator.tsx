import { useEffect, useState } from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VolumeIndicatorProps {
  stream: MediaStream;
  className?: string;
}

export function VolumeIndicator({ stream, className }: VolumeIndicatorProps) {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setVolume(average);
      requestAnimationFrame(updateVolume);
    };

    updateVolume();

    return () => {
      audioContext.close();
    };
  }, [stream]);

  const VolumeIcon = volume === 0 
    ? VolumeX 
    : volume < 30 
    ? Volume 
    : volume < 60 
    ? Volume1 
    : Volume2;

  return (
    <div className={cn("relative", className)}>
      <VolumeIcon className="h-4 w-4" />
      <div
        className="absolute bottom-0 left-0 h-1 rounded-full bg-primary-500 transition-all"
        style={{ width: `${Math.min((volume / 255) * 100, 100)}%` }}
      />
    </div>
  );
} 