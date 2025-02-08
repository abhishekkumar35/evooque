const requiredEnvVars = [
  'NEXT_PUBLIC_TURN_URL',
  'NEXT_PUBLIC_TURN_USERNAME',
  'NEXT_PUBLIC_TURN_CREDENTIAL',
] as const;

type RequiredEnvVars = typeof requiredEnvVars[number];

export const env = {
  NEXT_PUBLIC_TURN_URL: process.env.NEXT_PUBLIC_TURN_URL!,
  NEXT_PUBLIC_TURN_USERNAME: process.env.NEXT_PUBLIC_TURN_USERNAME!,
  NEXT_PUBLIC_TURN_CREDENTIAL: process.env.NEXT_PUBLIC_TURN_CREDENTIAL!,
  NEXT_PUBLIC_STUN_URLS: process.env.NEXT_PUBLIC_STUN_URLS?.split(',') || [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
  ],
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'wss://your-domain.com'
      : 'ws://localhost:3000'),
  NEXT_PUBLIC_ICE_TRANSPORT_POLICY: (process.env.NEXT_PUBLIC_ICE_TRANSPORT_POLICY || 'all') as RTCIceTransportPolicy,
  NEXT_PUBLIC_BUNDLE_POLICY: (process.env.NEXT_PUBLIC_BUNDLE_POLICY || 'balanced') as RTCBundlePolicy,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

export function validateEnv(): void {
  const missingVars: RequiredEnvVars[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

export function getRTCConfiguration(): RTCConfiguration {
  return {
    iceServers: [
      {
        urls: env.NEXT_PUBLIC_STUN_URLS,
      },
      {
        urls: env.NEXT_PUBLIC_TURN_URL,
        username: env.NEXT_PUBLIC_TURN_USERNAME,
        credential: env.NEXT_PUBLIC_TURN_CREDENTIAL,
      },
    ],
    iceTransportPolicy: env.NEXT_PUBLIC_ICE_TRANSPORT_POLICY,
    bundlePolicy: env.NEXT_PUBLIC_BUNDLE_POLICY,
    rtcpMuxPolicy: 'require',
    sdpSemantics: 'unified-plan',
  };
} 