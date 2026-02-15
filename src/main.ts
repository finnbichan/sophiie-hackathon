import { app, BrowserWindow, session, ipcMain } from 'electron';
import path from 'path';
import dotenv from 'dotenv';
import { createClient, DeepgramClient, LiveTranscriptionEvents, LiveClient } from '@deepgram/sdk'; // Import createClient and LiveClient
import Groq from 'groq-sdk'; // Import Groq SDK

declare const MAIN_WINDOW_WEBPACK_ENTRY: string; // Declare this global variable for TypeScript

// Load environment variables from .env file
dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
});

const CSP_DOMAINS = {
  // Domains for various services
  geminiApi: ['https://generativelanguage.googleapis.com', 'https://*.googleapis.com'],
  groqApi: ['https://api.groq.com'],
  wherebyApi: ['https://api.whereby.dev'],
  wherebyEmbed: [
    'https://*.whereby.com',
    'https://*.sfu.whereby.com',
    'https://*.sfu.svc.whereby.com',
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
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${CSP_DOMAINS.cloudfront.join(' ')} ${CSP_DOMAINS.wherebyEmbed.join(' ')};
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' ${CSP_DOMAINS.geminiApi.join(' ')} ${CSP_DOMAINS.groqApi.join(' ')} ${CSP_DOMAINS.wherebyApi.join(' ')} ${CSP_DOMAINS.wherebyEmbed.join(' ')} ${CSP_DOMAINS.cloudfront.join(' ')} ${CSP_DOMAINS.amazonS3.join(' ')} ${CSP_DOMAINS.posthog.join(' ')} ${CSP_DOMAINS.sentry.join(' ')} ${CSP_DOMAINS.helpscout.join(' ')};
  frame-src 'self' ${CSP_DOMAINS.wherebyEmbed.join(' ')};
`;

// Clean up newlines and extra spaces
const CLEAN_CSP = CONTENT_SECURITY_POLICY.replace(/\s{2,}/g, ' ').trim();

// Define Deepgram client and connection globally in main process
let deepgram: DeepgramClient | null = null;
let deepgramLive: LiveClient | null = null; // Type will be DeepgramClient.live.v(x)

ipcMain.handle('start-transcription', async (event) => {
  try {
    const deepgramApiKey = process.env.REACT_APP_DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
      throw new Error('Deepgram API key is not set in the main process environment variables.');
    }

    deepgram = createClient(deepgramApiKey);
    deepgramLive = deepgram.listen.live({
      smartFormat: true,
      channels: 1,
      encoding: 'linear16',
      sample_rate: 16000,
      language: 'en-US',
      // Add other Deepgram options as needed
    });

    deepgramLive.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection opened.');
    });

    deepgramLive.on(LiveTranscriptionEvents.Close, () => {
      console.log('Deepgram connection closed.');
    });

    deepgramLive.on(LiveTranscriptionEvents.Transcript, (transcription: any) => {
      const { channel } = transcription;
      const alternatives = channel.alternatives;
      const transcript = alternatives[0]?.transcript;

      if (transcript && transcript.length > 0) {
        // Send transcript back to the renderer process
        event.sender.send('transcription-result', transcript);
      }
    });

    deepgramLive.on(LiveTranscriptionEvents.Error, (error: any) => {
      console.error('Deepgram error:', error);
      event.sender.send('transcription-error', error.message);
    });

    return true;
  } catch (error) {
    console.error('Error starting Deepgram transcription in main process:', error);
    throw error;
  }
});

ipcMain.handle('stop-transcription', async () => {
  if (deepgramLive) {
    deepgramLive.finish();
    deepgramLive = null;
    deepgram = null;
    console.log('Deepgram transcription stopped.');
  }
  return true;
});

// IPC handler for receiving audio data chunks from the renderer
ipcMain.handle('audio-data', async (event, audioChunk: ArrayBuffer) => {
  if (deepgramLive && deepgramLive.getReadyState() === 1) { // Check if connection is open
    deepgramLive.send(audioChunk);
  }
});

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

// IPC handler for analyzing transcript with Groq
ipcMain.handle('analyze-transcript', async (event, transcript: string) => {
  try {
    const groqApiKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('Groq API key is not set in the main process environment variables.');
    }

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b", // Using a capable model
      messages: [
        { role: "system", content: "Extract actions or questions from the transcript so far. If there are no actions or questions, return type 'null'. Only return the most relevant item if multiple are present." },
        {
          role: "user",
          content: transcript,
        },
      ],
      response_format: {
        type: "json_schema", // Correct type for structured schema output
        json_schema: {
          name: "analysis_result", // A name for our schema
          strict: true, // Enforce strict schema validation as per user's example
          schema: {
            "type": "object",
            "properties": {
              "analysis": {
                              "type": "array",
                                                          "items": {
                                                            "type": "object",
                                                            "properties": {
                                                              "type": {
                                                                "type": "string",
                                                                "enum": ["action", "question", "null"]
                                                              },
                                                              "description": { "type": "string" }, // Re-added as optional property here
                                                              "text": { "type": "string" }         // Re-added as optional property here
                                                            },
                                                            "required": ["type"],
                                                            "additionalProperties": false,
                                                            "oneOf": [
                                                              {
                                                                "properties": {
                                                                  "type": { "const": "action" }
                                                                  // description is already defined above as a property, now it's made required below
                                                                },
                                                                "required": ["type", "description"],
                                                                "additionalProperties": false
                                                              },
                                                              {
                                                                "properties": {
                                                                  "type": { "const": "question" }
                                                                  // text is already defined above as a property, now it's made required below
                                                                },
                                                                "required": ["type", "text"],
                                                                "additionalProperties": false
                                                              },
                                                              {
                                                                "properties": {
                                                                  "type": { "const": "null" }
                                                                },
                                                                "required": ["type"],
                                                                "additionalProperties": false
                                                              }
                                                            ]
                                                          }              }
            },
            "required": ["analysis"],
            "additionalProperties": false
          }
        }
      }    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    // Ensure the result matches our expected AnalysisResult[] type
    return result.analysis || []; // Return the array of analysis results
  } catch (error) {
    console.error('Error analyzing transcript with Groq:', error);
    // Return an empty array or null analysis in case of error
    return [];
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
