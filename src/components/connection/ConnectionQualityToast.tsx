import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useConnectionQuality } from '@/providers/ConnectionQualityProvider';
import { ConnectionQuality } from '@/lib/webrtc/connection-monitor';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface ConnectionQualityToastProps {
  className?: string;
}

export function ConnectionQualityToast({ className }: ConnectionQualityToastProps) {
  const { quality } = useConnectionQuality();
  const { toast } = useToast();

  useEffect(() => {
    const qualityConfig: Record<ConnectionQuality, {
      title: string;
      description: string;
      icon: typeof Activity;
      variant: 'default' | 'success' | 'warning' | 'error';
    }> = {
      excellent: {
        title: 'Excellent Connection',
        description: 'Your connection quality is optimal',
        icon: CheckCircle2,
        variant: 'success',
      },
      good: {
        title: 'Good Connection',
        description: 'Your connection is stable',
        icon: Activity,
        variant: 'default',
      },
      poor: {
        title: 'Poor Connection',
        description: 'Your connection quality has degraded',
        icon: AlertTriangle,
        variant: 'warning',
      },
      critical: {
        title: 'Critical Connection',
        description: 'Your connection is unstable',
        icon: XCircle,
        variant: 'error',
      },
    };

    const config = qualityConfig[quality];

    toast({
      title: config.title,
      description: config.description,
      variant: config.variant,
      icon: <config.icon className="h-4 w-4" />,
      duration: 3000,
    });
  }, [quality, toast]);

  return null;
} 