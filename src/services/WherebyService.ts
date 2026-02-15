// src/services/WherebyService.ts

// This service handles interaction with the backend for Whereby room management.

// No need for declare global for window.ipcRenderer here anymore, as it's defined in preload.ts

class WherebyService {
  constructor() {
    // API key is no longer handled in the renderer process
  }

  /**
   * Creates a new Whereby meeting room by invoking a main process handler.
   * @param endDate The deactivation time for the room (ISO 8601 format, e.g., "2024-12-31T23:59:59.000Z").
   * @returns A promise that resolves to the room URL.
   */
  async createMeetingRoom(endDate: string): Promise<string> {
    try {
      if (!window.ipcRenderer) {
        throw new Error('ipcRenderer is not available. This service must run in an Electron environment.');
      }
      const roomUrl = await window.ipcRenderer.invoke('create-whereby-room', endDate);
      return roomUrl;
    } catch (error) {
      console.error('Error creating Whereby room via main process:', error);
      throw error;
    }
  }
}

export default WherebyService;