// src/types/global.d.ts
import { IpcRendererEvent } from 'electron';

declare global {
  interface Window {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
      removeListener: (channel: string, listener: (...args: any[]) => void) => void;
      // Add other Electron ipcRenderer methods if used in preload.ts
      // send: (channel: string, ...args: any[]) => void;
      // sendSync: (channel: string, ...args: any[]) => any;
    };
  }
}
