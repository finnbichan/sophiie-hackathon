// Define a minimal interface for ipcRenderer that only includes the 'invoke' method.
// This is because contextBridge only exposes a subset of ipcRenderer methods.
interface MinimalIpcRenderer {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private ipcRenderer: MinimalIpcRenderer | null = null; // Use MinimalIpcRenderer type
  private mediaStream: MediaStream | null = null; // Reintroduce to store the stream
  private readonly audioDataChannel = 'audio-data';
  private readonly targetSampleRate = 16000; // Deepgram's expected sample rate

  /**
   * Starts processing the audio stream and sending data to the main process.
   * @param stream The MediaStream to process.
   * @param ipcRendererInstance The ipcRenderer instance from Electron.
   */
  public start(stream: MediaStream, ipcRendererInstance: MinimalIpcRenderer): void {
    if (this.audioContext) {
      console.warn('AudioProcessor already started.');
      return;
    }

    this.ipcRenderer = ipcRendererInstance;
    this.mediaStream = stream; // Store the stream

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('AudioProcessor: AudioContext sample rate:', this.audioContext.sampleRate);
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);

    // Create a ScriptProcessorNode.
    // The buffer size is 4096 (or other power of 2), number of input and output channels are 1.
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!this.ipcRenderer || !this.mediaStream) return;

      const audioTrack = this.mediaStream.getAudioTracks()[0];
      if (!audioTrack || !audioTrack.enabled) {
        // If audio track is not enabled (e.g., muted), do not send data
        // console.log('AudioProcessor: Audio track disabled, skipping audio data send.');
        return;
      }

      // Get input audio data
      const inputBuffer = event.inputBuffer.getChannelData(0);

      // Check if the buffer contains any non-zero audio data (for logging)
      const hasAudio = inputBuffer.some(sample => sample !== 0);
      if (hasAudio) {
        // console.log('AudioProcessor: onaudioprocess firing, audio detected! Buffer length:', inputBuffer.length);
      } else {
        // console.log('AudioProcessor: onaudioprocess firing, but no audio detected (silent). Buffer length:', inputBuffer.length);
      }

      // Resample the audio if necessary
      let processedBuffer: Float32Array = inputBuffer;
      if (this.audioContext!.sampleRate !== this.targetSampleRate) {
        processedBuffer = this.resample(inputBuffer, this.audioContext!.sampleRate, this.targetSampleRate);
      }

      // Convert Float32Array to Int16Array
      const pcm16 = this.floatTo16BitPCM(processedBuffer);

      // Send the audio data to the main process
      this.ipcRenderer.invoke(this.audioDataChannel, pcm16.buffer);
    };

    // Connect the nodes
    this.mediaStreamSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);

    console.log('AudioProcessor started.');
  }

  /**
   * Stops processing the audio stream and cleans up resources.
   */
  public stop(): void {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.ipcRenderer = null;
    this.mediaStream = null; // Clear the stream reference
    console.log('AudioProcessor stopped.');
  }

  /**
   * Converts a Float32Array of audio data to an Int16Array (16-bit PCM).
   * @param input The Float32Array to convert.
   * @returns An Int16Array containing the 16-bit PCM data.
   */
  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      output[i] = s;
    }
    return output;
  }

  /**
   * Resamples a Float32Array of audio data from one sample rate to another.
   * Basic linear interpolation for downsampling.
   * @param buffer The input Float32Array buffer.
   * @param inputSampleRate The original sample rate of the buffer.
   * @param outputSampleRate The desired sample rate.
   * @returns A new Float32Array with the resampled audio data.
   */
  private resample(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return buffer;
    }

    const ratio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < newLength) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      // Use average for simple downsampling.
      // More advanced methods like linear interpolation or polyphase filters could be used for better quality.
      let accumulator = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accumulator += buffer[i];
        count++;
      }
      result[offsetResult] = accumulator / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }
}

export default AudioProcessor;