export class RecordingService {
  private static instance: RecordingService;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private onDataAvailable?: (blob: Blob) => void;

  private constructor() {}

  static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  startRecording(stream: MediaStream, onDataAvailable?: (blob: Blob) => void) {
    try {
      this.onDataAvailable = onDataAvailable;
      this.recordedChunks = [];

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: 'video/webm',
        });
        this.onDataAvailable?.(blob);
      };

      this.mediaRecorder.start(1000); // Record in 1-second chunks
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  stopRecording() {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
      return true;
    }
    return false;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  downloadRecording(filename: string = 'recording.webm') {
    if (this.recordedChunks.length === 0) return false;

    const blob = new Blob(this.recordedChunks, {
      type: 'video/webm',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  }
}

export const recordingService = RecordingService.getInstance(); 