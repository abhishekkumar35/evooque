import { PropsWithChildren } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { ParticipantList } from "@/components/video/ParticipantList";
import { MediaControls } from "@/components/video/MediaControls";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { NetworkQuality } from "@/components/video/NetworkQuality";
import { RoomInfo } from "@/components/room/RoomInfo";
import { ParticipantListItem } from "@/components/video/ParticipantListItem";
import { useUserStore } from "@/store/useUserStore";

interface RoomLayoutProps extends PropsWithChildren {
  onLeaveRoom?: () => void;
  stream: MediaStream | null;
}

export function RoomLayout({ children, onLeaveRoom, stream }: RoomLayoutProps) {
  const { participants, currentRoom, isVideoEnabled, isAudioEnabled } = useRoomStore();
  const currentUser = useUserStore((state) => state.currentUser);

  return (
    <div className="flex h-screen bg-dark-200">
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-dark-100 p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">
              Room: {currentRoom?.id}
            </h1>
            <ConnectionStatus />
            {stream && <NetworkQuality stream={stream} />}
          </div>
          <RoomInfo
            roomId={currentRoom?.id || ""}
            participantCount={participants.length}
          />
        </header>
        
        <div className="flex flex-1">
          {children}
        </div>

        <footer className="border-t border-dark-100 p-4">
          <MediaControls 
            onLeaveCall={onLeaveRoom}
            stream={stream}
          />
        </footer>
      </main>

      <aside className="w-80 overflow-y-auto border-l border-dark-100">
        <div className="p-4">
          <h2 className="mb-4 text-sm font-medium text-gray-400">
            Participants ({participants.length})
          </h2>
          <div className="space-y-2">
            {currentUser && (
              <ParticipantListItem
                participant={currentUser}
                isLocal
                stream={stream}
                isVideoEnabled={isVideoEnabled}
                isAudioEnabled={isAudioEnabled}
              />
            )}
            {participants
              .filter((p) => p.id !== currentUser?.id)
              .map((participant) => (
                <ParticipantListItem
                  key={participant.id}
                  participant={participant}
                  stream={stream}
                />
              ))}
          </div>
        </div>
      </aside>
    </div>
  );
} 