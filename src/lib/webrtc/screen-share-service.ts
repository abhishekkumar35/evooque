export class ScreenShareService {
  private static instance: ScreenShareService;
  private screenStream: MediaStream | null = null;

  private constructor() {}

  static getInstance(): ScreenShareService {
    if (!ScreenShareService.instance) {
      ScreenShareService.instance = new ScreenShareService();
    }
    return ScreenShareService.instance;
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.screenStream = stream;
      return stream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }
}

export const screenShareService = ScreenShareService.getInstance(); 