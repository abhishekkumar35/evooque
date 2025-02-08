import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, XCircle } from 'lucide-react';
import { reconnectManager } from '@/lib/webrtc/reconnect-manager';
import { cn } from '@/lib/utils';

interface ConnectionReconnectStatusProps {
  peerId: string;
  className?: string;
  onCancel?: () => void;
}

interface ReconnectState {
  isReconnecting: boolean;
  attempt: number;
  maxAttempts: number;
  nextAttemptIn: number;
  failed: boolean;
}

export function ConnectionReconnectStatus({
  peerId,
  className,
  onCancel,
}: ConnectionReconnectStatusProps) {
  const [state, setState] = useState<ReconnectState>({
    isReconnecting: false,
    attempt: 0,
    maxAttempts: 5,
    nextAttemptIn: 0,
    failed: false,
  });

  useEffect(() => {
    const handleAttempt = ({
      peerId: id,
      attempt,
      nextAttemptIn,
      maxAttempts,
    }: {
      peerId: string;
      attempt: number;
      nextAttemptIn: number;
      maxAttempts: number;
    }) => {
      if (id === peerId) {
        setState({
          isReconnecting: true,
          attempt,
          maxAttempts,
          nextAttemptIn,
          failed: false,
        });
      }
    };

    const handleSuccess = ({ peerId: id }: { peerId: string }) => {
      if (id === peerId) {
        setState(prev => ({
          ...prev,
          isReconnecting: false,
          failed: false,
        }));
      }
    };

    const handleFailed = ({ peerId: id }: { peerId: string }) => {
      if (id === peerId) {
        setState(prev => ({
          ...prev,
          isReconnecting: false,
          failed: true,
        }));
      }
    };

    reconnectManager.on('reconnect:attempt', handleAttempt);
    reconnectManager.on('reconnect:success', handleSuccess);
    reconnectManager.on('reconnect:failed', handleFailed);

    return () => {
      reconnectManager.off('reconnect:attempt', handleAttempt);
      reconnectManager.off('reconnect:success', handleSuccess);
      reconnectManager.off('reconnect:failed', handleFailed);
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
                  ? `Attempt ${state.attempt} of ${state.maxAttempts} in ${Math.ceil(state.nextAttemptIn / 1000)}s`
                  : 'Unable to establish connection'}
              </span>
            </div>
          </div>
          {onCancel && state.isReconnecting && (
            <button
              onClick={onCancel}
              className="rounded-lg px-3 py-1 text-sm text-gray-400 hover:bg-dark-200 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 