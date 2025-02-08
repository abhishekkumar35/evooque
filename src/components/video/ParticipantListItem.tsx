import { User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { VolumeIndicator } from "./VolumeIndicator";
import { NetworkQuality } from "./NetworkQuality";
import { Transition } from "@/components/ui/transition";

interface ParticipantListItemProps {
  participant: User;
  isLocal?: boolean;
  isSpeaking?: boolean;
  stream?: MediaStream;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
}

export function ParticipantListItem({
  participant,
  isLocal,
  isSpeaking,
  stream,
  isVideoEnabled,
  isAudioEnabled,
}: ParticipantListItemProps) {
  return (
    <Transition show={true} type="scale" appear>
      <div className="flex items-center justify-between rounded-lg bg-dark-100 p-3">
        <div className="flex items-center gap-3">
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.name}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white">
              {participant.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {participant.name} {isLocal && "(You)"}
              </span>
              {isSpeaking && (
                <Badge status="online" className="animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {stream && (
                <>
                  {isAudioEnabled ? (
                    <VolumeIndicator stream={stream} className="h-3 w-3" />
                  ) : (
                    <span className="text-red-500">Muted</span>
                  )}
                  {!isVideoEnabled && (
                    <span className="text-red-500">Video Off</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {stream && <NetworkQuality stream={stream} />}
      </div>
    </Transition>
  );
} 