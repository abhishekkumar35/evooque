import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Activity, Wifi, BarChart2 } from 'lucide-react';
import { ConnectionHealthIndicator } from './ConnectionHealthIndicator';
import { ConnectionMetrics } from './ConnectionMetrics';
import { ConnectionQualityStats } from './ConnectionQualityStats';
import { ReconnectionStatus } from './ReconnectionStatus';
import { cn } from '@/lib/utils';

interface ConnectionDashboardProps {
  peerId: string;
  peerConnection: RTCPeerConnection;
  stream: MediaStream;
  className?: string;
}

type Tab = 'health' | 'metrics' | 'stats';

export function ConnectionDashboard({
  peerId,
  peerConnection,
  stream,
  className,
}: ConnectionDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('health');

  const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: 'health', label: 'Health', icon: Activity },
    { id: 'metrics', label: 'Metrics', icon: BarChart2 },
    { id: 'stats', label: 'Stats', icon: Wifi },
  ];

  return (
    <div className={cn('rounded-lg bg-dark-100 shadow-lg', className)}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <ConnectionHealthIndicator
            peerConnection={peerConnection}
            className="min-w-[150px]"
          />
          <ReconnectionStatus
            peerId={peerId}
            onCancel={() => {
              // Handle reconnection cancel
            }}
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full p-1 text-gray-400 hover:bg-dark-200 hover:text-white"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-dark-200">
              <div className="flex gap-2 p-2">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      activeTab === id
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-400 hover:bg-dark-200 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'health' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-white">Connection Health</h3>
                        <ConnectionHealthIndicator
                          peerConnection={peerConnection}
                          className="w-full"
                        />
                      </div>
                    )}

                    {activeTab === 'metrics' && (
                      <ConnectionMetrics
                        peerConnection={peerConnection}
                      />
                    )}

                    {activeTab === 'stats' && (
                      <ConnectionQualityStats
                        peerConnection={peerConnection}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 