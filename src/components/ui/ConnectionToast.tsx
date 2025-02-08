import { useEffect } from 'react';
import { useConnectionStore } from '@/store/useConnectionStore';
import { Alert } from './alert';
import { cn } from '@/lib/utils';

export function ConnectionToast() {
  const connectionState = useConnectionStore((state) => state.connectionState);

  const messages = {
    connecting: {
      type: 'info' as const,
      message: 'Connecting to the room...',
    },
    connected: {
      type: 'success' as const,
      message: 'Successfully connected to the room',
    },
    disconnected: {
      type: 'error' as const,
      message: 'Disconnected from the room. Trying to reconnect...',
    },
  };

  const { type, message } = messages[connectionState];

  if (connectionState === 'connected') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <Alert
        type={type}
        message={message}
        className={cn(
          'animate-in fade-in slide-in-from-bottom-4',
          connectionState === 'connecting' && 'animate-pulse'
        )}
      />
    </div>
  );
} 