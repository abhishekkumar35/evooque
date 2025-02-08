import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { qualityMonitor } from '@/lib/webrtc/quality-monitor';
import { ConnectionQuality } from '@/lib/webrtc/connection-monitor';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QualityWarningProps {
  peerId: string;
  className?: string;
}

interface Warning {
  quality: ConnectionQuality;
  message: string;
  timestamp: number;
}

export function QualityWarning({ peerId, className }: QualityWarningProps) {
  const [warning, setWarning] = useState<Warning | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleWarning = ({ 
      peerId: id, 
      quality, 
      message 
    }: { 
      peerId: string; 
      quality: ConnectionQuality;
      message: string;
    }) => {
      if (id === peerId) {
        setWarning({
          quality,
          message,
          timestamp: Date.now(),
        });
        setIsVisible(true);

        // Hide warning after 5 seconds
        const timeout = setTimeout(() => {
          setIsVisible(false);
        }, 5000);

        return () => clearTimeout(timeout);
      }
    };

    qualityMonitor.on('quality:warning', handleWarning);

    return () => {
      qualityMonitor.off('quality:warning', handleWarning);
    };
  }, [peerId]);

  const warningColors: Record<ConnectionQuality, {
    bg: string;
    text: string;
    icon: string;
  }> = {
    excellent: {
      bg: 'bg-green-500/10',
      text: 'text-green-500',
      icon: 'text-green-500',
    },
    good: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
      icon: 'text-blue-500',
    },
    poor: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-500',
      icon: 'text-yellow-500',
    },
    critical: {
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      icon: 'text-red-500',
    },
  };

  return (
    <AnimatePresence>
      {warning && isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg p-3 shadow-lg',
            warningColors[warning.quality].bg,
            className
          )}
        >
          <div className="relative">
            <AlertTriangle className={cn('h-5 w-5', warningColors[warning.quality].icon)} />
            <motion.div
              className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-current"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="flex flex-col">
            <span className={cn('text-sm font-medium', warningColors[warning.quality].text)}>
              Connection Quality Warning
            </span>
            <span className="text-xs text-gray-400">
              {warning.message}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsVisible(false)}
            className={cn(
              'ml-2 rounded-full p-1 hover:bg-gray-100/10',
              warningColors[warning.quality].text
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 