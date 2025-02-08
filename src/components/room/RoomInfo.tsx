import { useState } from "react";
import { Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToastStore } from "@/components/ui/toast";

interface RoomInfoProps {
  roomId: string;
  participantCount: number;
}

export function RoomInfo({ roomId, participantCount }: RoomInfoProps) {
  const [showInfo, setShowInfo] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(url);
      addToast({
        type: "success",
        message: "Room link copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      addToast({
        type: "error",
        message: "Failed to copy room link",
        duration: 2000,
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowInfo(true)}
        variant="ghost"
        size="icon"
        className="relative"
      >
        <Info className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs text-white">
          {participantCount}
        </span>
      </Button>

      <Modal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Room Information"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-400">Room ID</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-dark-200 px-2 py-1 font-mono text-sm text-primary-400">
                {roomId}
              </code>
              <Button onClick={copyLink} variant="ghost" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">
              Participants
            </label>
            <p className="mt-1 text-sm text-white">
              {participantCount} {participantCount === 1 ? "person" : "people"} in
              the room
            </p>
          </div>

          <div className="rounded-lg bg-dark-200 p-3">
            <h4 className="text-sm font-medium text-primary-400">Tips</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>• Share the room link to invite others</li>
              <li>• Click the camera/mic icons to toggle your media</li>
              <li>• Use the screen share button to present your screen</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
} 