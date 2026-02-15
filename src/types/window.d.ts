// src/types/window.d.ts
import { AnalysisResult } from './analysis';

declare global {
  interface Window {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      removeListener: (channel: string, listener: (...args: any[]) => void) => void;
      analyzeTranscript: (transcript: string) => Promise<AnalysisResult[]>; // Corrected return type
    };
  }
}
