import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useRoomStore } from '@/store/useRoomStore';

interface RoomSettings {
  videoQuality: 'low' | 'medium' | 'high';
  noiseReduction: boolean;
  echoCancellation: boolean;
}

const videoConstraints = {
  low: { width: 640, height: 480 },
  medium: { width: 1280, height: 720 },
  high: { width: 1920, height: 1080 },
};

export function RoomSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<RoomSettings>({
    videoQuality: 'medium',
    noiseReduction: true,
    echoCancellation: true,
  });

  const handleSettingsChange = async (newSettings: Partial<RoomSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...videoConstraints[updatedSettings.videoQuality],
        },
        audio: {
          noiseSuppression: updatedSettings.noiseReduction,
          echoCancellation: updatedSettings.echoCancellation,
        },
      });

      // Update the local stream with new constraints
      // You'll need to implement this in your connection store
      // updateLocalStream(stream);
    } catch (error) {
      console.error('Error updating media settings:', error);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Room Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Video Quality
            </label>
            <select
              value={settings.videoQuality}
              onChange={(e) => handleSettingsChange({ 
                videoQuality: e.target.value as RoomSettings['videoQuality'] 
              })}
              className="mt-1 block w-full rounded-md bg-dark-200 border-dark-100 text-white"
            >
              <option value="low">Low (480p)</option>
              <option value="medium">Medium (720p)</option>
              <option value="high">High (1080p)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.noiseReduction}
                onChange={(e) => handleSettingsChange({ 
                  noiseReduction: e.target.checked 
                })}
                className="rounded bg-dark-200 border-dark-100"
              />
              <span className="text-sm text-gray-400">Noise Reduction</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.echoCancellation}
                onChange={(e) => handleSettingsChange({ 
                  echoCancellation: e.target.checked 
                })}
                className="rounded bg-dark-200 border-dark-100"
              />
              <span className="text-sm text-gray-400">Echo Cancellation</span>
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
} 