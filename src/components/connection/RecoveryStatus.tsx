import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ConnectionRecoveryService } from '@/lib/webrtc/connection-recovery';
import { cn } from '@/lib/utils';

interface RecoveryStatusProps {
  peerId: string;
  recoveryService: ConnectionRecoveryService;
  className?: string;
}

interface RecoveryState {
  isRecovering: boolean;
  attempt: number;
  nextAttemptIn: number;
}

export function RecoveryStatus({
  peerId,
  recoveryService,
  className,
}: RecoveryStatusProps) {
  const [recovery, setRecovery] = useState<RecoveryState>({
    isRecovering: false,
    attempt: 0,
    nextAttemptIn: 0,
  });

  useEffect(() => {
    const handleStart = ({ peerId: id }: { peerId: string }) => {
      if (id === peerId) {
        setRecovery({
          isRecovering: true,
          attempt: 0,
          nextAttemptIn: 0,
        });
      }
    };

    const handleRetry = ({
      peerId: id,
      attempt,
      nextAttemptIn,
    }: {
      peerId: string;
      attempt: number;
      nextAttemptIn: number;
    }) => {
      if (id === peerId) {
        setRecovery({
          isRecovering: true,
          attempt,
          nextAttemptIn,
        });
      }
    };

    const handleSuccess = ({ peerId: id }: { peerId: string }) => {
      if (id === peerId) {
        setRecovery({
          isRecovering: false,
          attempt: 0,
          nextAttemptIn: 0,
        });
      }
    };

    const handleFailed = ({ peerId: id }: { peerId: string }) => {
      if (id === peerId) {
        setRecovery({
          isRecovering: false,
          attempt: 0,
          nextAttemptIn: 0,
        });
      }
    };

    recoveryService.on('recovery:start', handleStart);
    recoveryService.on('recovery:retry', handleRetry);
    recoveryService.on('recovery:success', handleSuccess);
    recoveryService.on('recovery:failed', handleFailed);

    return () => {
      recoveryService.off('recovery:start', handleStart);
      recoveryService.off('recovery:retry', handleRetry);
      recoveryService.off('recovery:success', handleSuccess);
      recoveryService.off('recovery:failed', handleFailed);
    };
  }, [peerId, recoveryService]);

  if (!recovery.isRecovering) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-yellow-500/10 p-2 text-sm text-yellow-500',
        className
      )}
    >
      {recovery.nextAttemptIn > 0 ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <span>
        {recovery.nextAttemptIn > 0
          ? `Reconnecting... Attempt ${recovery.attempt} in ${Math.ceil(
              recovery.nextAttemptIn / 1000
            )}s`
          : 'Connection lost. Attempting to reconnect...'}
      </span>
    </div>
  );
} 