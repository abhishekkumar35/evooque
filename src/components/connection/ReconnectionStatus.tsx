import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, XCircle } from 'lucide-react';
import { reconnectionHandler } from '@/lib/webrtc/reconnection-handler';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ReconnectionStatusProps {
  peerId: string;
  className?: string;
  onCancel?: () => void;
}

interface ReconnectionState {
  isReconnecting: boolean;
  attempt: number;
  nextAttemptIn: number;
  failed: boolean;
}

export function ReconnectionStatus({
  peerId,
  className,
  onCancel,
}: ReconnectionStatusProps) {
  const [state, setState] = useState<ReconnectionState>({
    isReconnecting: false,
    attempt: 0,
    nextAttemptIn: 0,
    failed: false,
  });

  useEffect(() => {
    const handleAttempt = ({
      peerId: id,
      attempt,
      nextAttemptIn,
    }: {
      peerId: string;
      attempt: number;
      nextAttemptIn: number;
    }) => {
      if (id === peerId) {
        setState({
          isReconnecting: true,
          attempt,
          nextAttemptIn,
          failed: false,
        });
      }
    };

    const handleSuccess = ({ peerId: id }: { peerId: string }) => {
      if (id === peerId) {
        setState({
          isReconnecting: false,
          attempt: 0,
          nextAttemptIn: 0,
          failed: false,
        });
      }
    };

    const handleFailed = ({ peerId: id }: { peerId: string }) => {
      if (id === peerId) {
        setState({
          isReconnecting: false,
          attempt: 0,
          nextAttemptIn: 0,
          failed: true,
        });
      }
    };

    reconnectionHandler.on('reconnection:attempt', handleAttempt);
    reconnectionHandler.on('reconnection:success', handleSuccess);
    reconnectionHandler.on('reconnection:failed', handleFailed);

    return () => {
      reconnectionHandler.off('reconnection:attempt', handleAttempt);
      reconnectionHandler.off('reconnection:success', handleSuccess);
      reconnectionHandler.off('reconnection:failed', handleFailed);
    };
  }, [peerId]);

  if (!state.isReconnecting && !state.failed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'rounded-lg p-4',
          state.failed ? 'bg-red-500/10' : 'bg-yellow-500/10',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {state.isReconnecting ? (
              <RefreshCw className="h-5 w-5 animate-spin text-yellow-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div className="flex flex-col">
              <span className={cn(
                'text-sm font-medium',
                state.failed ? 'text-red-500' : 'text-yellow-500'
              )}>
                {state.failed ? 'Connection Failed' : 'Reconnecting...'}
              </span>
              <span className="text-xs text-gray-400">
                {state.isReconnecting
                  ? `Attempt ${state.attempt} in ${Math.ceil(state.nextAttemptIn / 1000)}s`
                  : 'Unable to establish connection'}
              </span>
            </div>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 