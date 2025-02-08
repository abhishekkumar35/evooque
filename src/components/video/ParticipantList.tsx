import { User } from "@/types";
import { cn } from "@/lib/utils";

interface ParticipantListProps {
  participants: User[];
  className?: string;
}

export function ParticipantList({ participants, className }: ParticipantListProps) {
  return (
    <div className={cn("flex flex-col gap-2 p-4", className)}>
      <h3 className="text-sm font-medium text-gray-400">Participants ({participants.length})</h3>
      <div className="flex flex-col gap-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-2 rounded-lg bg-dark-100 p-2"
          >
            {participant.avatar ? (
              <img
                src={participant.avatar}
                alt={participant.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white">
                {participant.name[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm text-white">{participant.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 