// src/services/TranscriptionService.ts
import AudioProcessor from './AudioProcessor';

// This service acts as a proxy for the renderer process to interact
// with the Deepgram transcription in the main process.

// No need for declare global for window.ipcRenderer here anymore, as it's defined in preload.ts

class TranscriptionService {
  private transcriptCallback: ((transcript: string) => void) | null = null;
  private readonly transcriptionChannel = 'start-transcription';
  private readonly transcriptResultChannel = 'transcription-result';
  private audioProcessor: AudioProcessor;

  constructor() {
    if (typeof window !== 'undefined' && window.ipcRenderer) {
      window.ipcRenderer.on(this.transcriptResultChannel, this.handleTranscriptResult);
    }
    this.audioProcessor = new AudioProcessor();
  }

  private handleTranscriptResult = (event: Electron.IpcRendererEvent, transcript: string) => {
    if (this.transcriptCallback) {
      this.transcriptCallback(transcript);
    }
  };

  /**
   * Starts sending audio stream to the main process for transcription.
   * @param audioStream The MediaStream containing the audio tracks.
   * @param callback A function to be called with new transcriptions.
   */
  async startTranscription(audioStream: MediaStream, callback: (transcript: string) => void): Promise<void> {
    if (!window.ipcRenderer) {
      throw new Error('ipcRenderer is not available. This service must run in an Electron environment.');
    }

    this.transcriptCallback = callback;

    // Start processing audio and sending chunks to main process
    this.audioProcessor.start(audioStream, window.ipcRenderer);

    // Notify main process to start Deepgram connection
    await window.ipcRenderer.invoke(this.transcriptionChannel, 'start');
  }

  /**
   * Stops the transcription process.
   */
  async stopTranscription(): Promise<void> {
    if (!window.ipcRenderer) {
      throw new Error('ipcRenderer is not available. This service must run in an Electron environment.');
    }

    this.transcriptCallback = null;

    // Stop processing audio
    this.audioProcessor.stop();

    // Notify main process to stop Deepgram connection
    await window.ipcRenderer.invoke(this.transcriptionChannel, 'stop');
    window.ipcRenderer.removeListener(this.transcriptResultChannel, this.handleTranscriptResult);
  }
}

export default TranscriptionService;