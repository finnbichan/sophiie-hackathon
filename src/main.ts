import { app, BrowserWindow, session, ipcMain } from 'electron';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const CSP_DOMAINS = {
  // Domains for various services
  geminiApi: ['https://generativelanguage.googleapis.com', 'https://*.googleapis.com'],
  groqApi: ['https://api.groq.com'],
  wherebyApi: ['https://api.whereby.dev'],
  wherebyEmbed: [
    'https://*.whereby.com',
    'https://*.sfu.whereby.com',
    'https://*.sfu.svc.whereby.com',
    'https://*.srv.whereby.com',
    'wss://*.srv.whereby.com', // Added for WebSocket connections
    'https://*.svc.whereby.com',
    'https://*.appearin.net',
    'wss://*.appearin.net', // Already added
    'https://*.turn.whereby.com',
    'https://*.turn.svc.whereby.com',
  ],
  // CDNs and third-party services
  cloudfront: ['https://*.cloudfront.net'],
  amazonS3: ['https://*.amazonaws.net'], // For user avatars
  posthog: ['https://*.posthog.com'],
  sentry: ['https://*.sentry.io'],
  helpscout: ['https://*.helpscout.net'],
};

// Construct the CSP string
const CONTENT_SECURITY_POLICY = `
  default-src 'self' https: data:;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: ${CSP_DOMAINS.cloudfront.join(' ')} ${CSP_DOMAINS.wherebyEmbed.join(' ')} ${CSP_DOMAINS.posthog.join(' ')} ${CSP_DOMAINS.sentry.join(' ')} ${CSP_DOMAINS.helpscout.join(' ')};
  style-src 'self' 'unsafe-inline' ${CSP_DOMAINS.cloudfront.join(' ')} ${CSP_DOMAINS.wherebyEmbed.join(' ')};
  connect-src 'self' ${CSP_DOMAINS.geminiApi.join(' ')} ${CSP_DOMAINS.groqApi.join(' ')} ${CSP_DOMAINS.wherebyApi.join(' ')} ${CSP_DOMAINS.wherebyEmbed.join(' ')} ${CSP_DOMAINS.cloudfront.join(' ')} ${CSP_DOMAINS.amazonS3.join(' ')} ${CSP_DOMAINS.posthog.join(' ')} ${CSP_DOMAINS.sentry.join(' ')} ${CSP_DOMAINS.helpscout.join(' ')};
  frame-src 'self' ${CSP_DOMAINS.wherebyEmbed.join(' ')};
`;

// Clean up newlines and extra spaces
const CLEAN_CSP = CONTENT_SECURITY_POLICY.replace(/\s{2,}/g, ' ').trim();

// IPC handler for creating Whereby rooms
ipcMain.handle('create-whereby-room', async (event, endDate: string) => {
  const wherebyApiKey = process.env.REACT_APP_WHEREBY_API_KEY;
  if (!wherebyApiKey) {
    throw new Error('Whereby API key is not set in the main process environment variables.');
  }

  const baseUrl = 'https://api.whereby.dev/v1/meetings';

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wherebyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endDate: endDate,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to create Whereby room: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.roomUrl;
  } catch (error) {
    console.error('Error in main process creating Whereby room:', error);
    throw error;
  }
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
  });



  // Set CSP headers to allow API calls - only once per session
  const filter = { urls: ['<all_urls>'] };
  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          CLEAN_CSP,
        ],
      },
    });
  });

  // and load the index.html of the app.
  // In development, this will be served by webpack dev server.
  // In production, this will be a file path.
  if (MAIN_WINDOW_WEBPACK_ENTRY) {
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/main_window/index.html'));
  }


  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
