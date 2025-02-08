import { cn } from "@/lib/utils";
import { Transition } from "./transition";

interface BadgeProps {
  status: "online" | "offline" | "connecting";
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const statusStyles = {
    online: "bg-green-500",
    offline: "bg-red-500",
    connecting: "bg-yellow-500 animate-pulse",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            statusStyles[status]
          )}
        />
        <span className="text-xs text-gray-400 capitalize">{status}</span>
      </div>
    </div>
  );
} 