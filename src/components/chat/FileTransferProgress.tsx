import { useEffect, useState } from 'react';
import { FileText, Pause, Play, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { fileTransferService } from '@/lib/webrtc/file-transfer';
import { cn } from '@/lib/utils';
import { formatBytes, formatSpeed } from '@/lib/utils/format';

interface FileTransferProgressProps {
  peerId: string;
  className?: string;
}

interface Transfer {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'transferring' | 'paused' | 'complete' | 'error';
  speed: number;
  transferred: number;
  total: number;
  error?: string;
  retryAttempt?: number;
  nextRetryIn?: number;
  checkpoint?: number;
  resuming?: boolean;
}

export function FileTransferProgress({ peerId, className }: FileTransferProgressProps) {
  const [transfers, setTransfers] = useState<Map<string, Transfer>>(new Map());

  useEffect(() => {
    const handleStart = ({ id, name, size }: { id: string; name: string; size: number }) => {
      setTransfers(prev => new Map(prev).set(id, {
        id,
        name,
        progress: 0,
        status: 'pending',
        speed: 0,
        transferred: 0,
        total: size
      }));
    };

    const handleProgress = ({ 
      id, 
      progress, 
      speed,
      currentChunk,
      totalChunks 
    }: { 
      id: string; 
      progress: number;
      speed: number;
      currentChunk: number;
      totalChunks: number;
    }) => {
      setTransfers(prev => {
        const transfer = prev.get(id);
        if (!transfer) return prev;

        const updated = new Map(prev);
        updated.set(id, {
          ...transfer,
          progress,
          speed,
          status: 'transferring',
          transferred: (transfer.total / totalChunks) * currentChunk
        });
        return updated;
      });
    };

    const handleComplete = ({ id }: { id: string }) => {
      setTransfers(prev => {
        const transfer = prev.get(id);
        if (!transfer) return prev;

        const updated = new Map(prev);
        updated.set(id, {
          ...transfer,
          progress: 100,
          status: 'complete',
          transferred: transfer.total
        });
        return updated;
      });

      // Remove completed transfer after a delay
      setTimeout(() => {
        setTransfers(prev => {
          const updated = new Map(prev);
          updated.delete(id);
          return updated;
        });
      }, 3000);
    };

    const handlePause = ({ id }: { id: string }) => {
      setTransfers(prev => {
        const transfer = prev.get(id);
        if (!transfer) return prev;

        const updated = new Map(prev);
        updated.set(id, {
          ...transfer,
          status: 'paused'
        });
        return updated;
      });
    };

    const handleResume = ({ id }: { id: string }) => {
      setTransfers(prev => {
        const transfer = prev.get(id);
        if (!transfer) return prev;

        const updated = new Map(prev);
        updated.set(id, {
          ...transfer,
          status: 'transferring'
        });
        return updated;
      });
    };

    const handleError = ({ id, error }: { id: string; error: string }) => {
      setTransfers(prev => {
        const transfer = prev.get(id);
        if (!transfer) return prev;

        const updated = new Map(prev);
        updated.set(id, {
          ...transfer,
          status: 'error',
          error
        });
        return updated;
      });
    };

    const handleRetry = ({ 
      id, 
      chunk, 
      attempt, 
      nextAttemptIn 
    }: { 
      id: string; 
      chunk: number; 
      attempt: number; 
      nextAttemptIn: number;
    }) => {
      setTransfers(prev => {
        const transfer = prev.get(id);
        if (!transfer) return prev;

        const updated = new Map(prev);
        updated.set(id, {
          ...transfer,
          status: 'error',
          error: `Retrying chunk ${chunk}... (Attempt ${attempt})`,
          retryAttempt: attempt,
          nextRetryIn: nextAttemptIn,
        });
        return updated;
      });
    };

    const handleCancel = ({ id }: { id: string }) => {
      setTransfers(prev => {
        const updated = new Map(prev);
        updated.delete(id);
        return updated;
      });
    };

    const handleResumed = ({ 
      id, 
      checkpoint, 
      remaining 
    }: { 
      id: string; 
      checkpoint: number;
      remaining: number;
    }) => {
      setTransfers(prev => {
        const transfer = prev.get(id);
        if (!transfer) return prev;

        const updated = new Map(prev);
        updated.set(id, {
          ...transfer,
          status: 'transferring',
          checkpoint,
          resuming: true,
          error: `Resuming transfer from ${((checkpoint / transfer.total) * 100).toFixed(1)}% (${remaining} chunks remaining)`,
        });
        return updated;
      });

      // Clear resuming status after a delay
      setTimeout(() => {
        setTransfers(prev => {
          const transfer = prev.get(id);
          if (!transfer) return prev;

          const updated = new Map(prev);
          updated.set(id, {
            ...transfer,
            resuming: false,
            error: undefined,
          });
          return updated;
        });
      }, 3000);
    };

    fileTransferService.on('transfer:start', handleStart);
    fileTransferService.on('transfer:progress', handleProgress);
    fileTransferService.on('transfer:complete', handleComplete);
    fileTransferService.on('transfer:pause', handlePause);
    fileTransferService.on('transfer:resume', handleResume);
    fileTransferService.on('transfer:error', handleError);
    fileTransferService.on('transfer:retry', handleRetry);
    fileTransferService.on('transfer:cancel', handleCancel);
    fileTransferService.on('transfer:resumed', handleResumed);

    return () => {
      fileTransferService.off('transfer:start', handleStart);
      fileTransferService.off('transfer:progress', handleProgress);
      fileTransferService.off('transfer:complete', handleComplete);
      fileTransferService.off('transfer:pause', handlePause);
      fileTransferService.off('transfer:resume', handleResume);
      fileTransferService.off('transfer:error', handleError);
      fileTransferService.off('transfer:retry', handleRetry);
      fileTransferService.off('transfer:cancel', handleCancel);
      fileTransferService.off('transfer:resumed', handleResumed);
    };
  }, []);

  const handlePauseResume = (id: string, status: Transfer['status']) => {
    if (status === 'transferring') {
      fileTransferService.pauseTransfer(id);
    } else if (status === 'paused') {
      fileTransferService.resumeTransfer(id);
    }
  };

  const handleCancel = (id: string) => {
    fileTransferService.cancelTransfer(id);
  };

  if (transfers.size === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from(transfers.values()).map((transfer) => (
        <div
          key={transfer.id}
          className={cn(
            'flex items-center gap-3 rounded-lg bg-dark-100 p-3',
            transfer.status === 'error' && 'border border-red-500/50',
            transfer.resuming && 'border border-yellow-500/50'
          )}
        >
          <FileText className="h-5 w-5 text-primary-500" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                {transfer.name}
              </span>
              <div className="flex items-center gap-2">
                {transfer.status === 'transferring' && (
                  <span className="text-xs text-gray-400">
                    {formatSpeed(transfer.speed)}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {formatBytes(transfer.transferred)} / {formatBytes(transfer.total)}
                </span>
              </div>
            </div>
            <Progress value={transfer.progress} className="mt-2" />
            {transfer.error && (
              <p className={cn(
                'mt-1 text-xs',
                transfer.resuming ? 'text-yellow-500' : 'text-red-500'
              )}>
                {transfer.error}
              </p>
            )}
          </div>
          {(transfer.status === 'transferring' || transfer.status === 'paused') && (
            <>
              <Button
                onClick={() => handlePauseResume(transfer.id, transfer.status)}
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
              >
                {transfer.status === 'transferring' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => handleCancel(transfer.id)}
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {transfer.status === 'complete' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={() => {
                setTransfers(prev => {
                  const updated = new Map(prev);
                  updated.delete(transfer.id);
                  return updated;
                });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
} 