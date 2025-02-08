import { useConnectionStore } from "@/store/useConnectionStore";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const connectionState = useConnectionStore((state) => state.connectionState);

  const states = {
    connected: {
      icon: Wifi,
      text: "Connected",
      className: "text-green-500 bg-green-500/10",
    },
    connecting: {
      icon: Wifi,
      text: "Connecting",
      className: "text-yellow-500 bg-yellow-500/10 animate-pulse",
    },
    disconnected: {
      icon: WifiOff,
      text: "Disconnected",
      className: "text-red-500 bg-red-500/10",
    },
  };

  const { icon: Icon, text, className } = states[connectionState];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
} 