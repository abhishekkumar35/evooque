import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface AlertProps {
  type?: "success" | "error" | "warning" | "info";
  message: string;
  className?: string;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: "bg-green-500/10 text-green-500 border-green-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  info: "bg-primary-500/10 text-primary-500 border-primary-500/20",
};

export function Alert({ type = "info", message, className }: AlertProps) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border p-4",
        styles[type],
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
} 