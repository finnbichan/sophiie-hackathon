/// <reference path="../types/window.d.ts" />
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CallWindow from '../components/CallWindow';
import TranscriptWindow from '../components/TranscriptWindow';
import AnalysisWindow from '../components/AnalysisWindow'; // Import AnalysisWindow
import InteractionWindow from '../components/InteractionWindow';
import GroqService from '../services/GroqService';
import TranscriptionService from '../services/TranscriptionService'; // Import TranscriptionService
import { AnalysisResult } from '../types/analysis'; // Import AnalysisResult type
import './CallPage.css';

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

const CallPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomUrl, /* @ts-ignore */ contextText, /* @ts-ignore */ contextFiles } = (location.state || {}) as {
    roomUrl?: string;
    contextText?: string;
    contextFiles?: File[];
  };

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]); // New state for analysis results
  const [messages, setMessages] = useState<Message[]>([]);
  const [isWhisperMode, setIsWhisperMode] = useState(false);
  const [whisper, setWhisper] = useState(''); // State for current whisper input
  const [isLoading, setIsLoading] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null); // New state for audio stream

  // Initialize Interaction service
  const [groqService] = useState(
    () => new GroqService()
  );

  // Initialize Transcription service
  const [transcriptionService] = useState(
    () => new TranscriptionService()
  );

  // New handler for when the audio stream is ready from CallWindow
  const handleAudioStreamReady = useCallback((stream: MediaStream) => {
    console.log('Audio stream ready:', stream);
    setAudioStream(stream);
  }, []);

  // Handler for receiving transcription results
  const handleTranscriptResult = useCallback((transcript: string) => {
    console.log("whisper", isWhisperMode, transcript)
    console.log('Received transcript:', transcript);
    // For simplicity, add as a new entry. In real app, you might aggregate partials.
    if(isWhisperMode) {
      setWhisper((prev) => prev + transcript);
      console.log("Updated whisper state:", transcript);
    } else {
      setTranscripts((prev) => [
        ...prev,
        {
          id: `transcript-${Date.now()}`,
          speaker: 'Participant', // TODO: Identify speaker
          text: transcript,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isWhisperMode]);

  // Effect to start/stop transcription when audioStream changes
  useEffect(() => {
    if (audioStream) {
      console.log('Starting transcription...');
      transcriptionService.startTranscription(audioStream, handleTranscriptResult)
        .catch((error) => console.error('Error starting transcription:', error));
    }

    return () => {
      if (audioStream) {
        console.log('Stopping transcription...');
        transcriptionService.stopTranscription()
          .catch((error) => console.error('Error stopping transcription:', error));
      }
    };
  }, [audioStream, transcriptionService, handleTranscriptResult]);


  // Mock function to handle sending messages
  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages([...messages, newMessage]);
    setIsLoading(true);

    // Call Interaction service for response
    groqService
      .chat(text)
      .then((response) => {
        const agentMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'agent',
          text: response,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, agentMessage]);
      })
      .catch((error) => {
        console.error('Error getting agent response:', error);
        const errorMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'agent',
          text: 'Sorry, I encountered an error processing your request.',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Handle hotkey for Whisper mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && !isWhisperMode) {
        setIsWhisperMode(true);
        console.log('Whisper mode activated', isWhisperMode);
        // TODO: Auto-mute in Google Meet
        // TODO: Start voice dictation
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && isWhisperMode) {
        setIsWhisperMode(false);
        console.log('Whisper mode deactivated');
        setWhisper(''); // Clear whisper text when exiting whisper mode
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isWhisperMode]);

  // Effect for periodic transcript analysis
  useEffect(() => {
    const analyzeInterval = setInterval(async () => {
      if (transcripts.length > 0) {
        const fullTranscript = transcripts
          .map((t) => `${t.speaker}: ${t.text}`)
          .join('\n');

        try {
          const result = await window.ipcRenderer.analyzeTranscript(fullTranscript);
          if (result && result.length > 0) {
            setAnalysisResults(result); // Update with the latest analysis
          } else {
            setAnalysisResults([]); // Clear if no new analysis
          }
        } catch (error) {
          console.error('Error fetching analysis from main process:', error);
          setAnalysisResults([]);
        }
      } else {
        setAnalysisResults([]); // Clear analysis if no transcript
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(analyzeInterval);
  }, [transcripts]); // Re-run effect if transcripts change (to get latest content for analysis)


  return (
    <>
      {roomUrl ? (
        <div className="call-page">
          <div className="call-header">
            <div className="call-title">Meeting in Progress</div>
            <button
              onClick={() => navigate('/end-of-call')}
              className="end-call-button"
            >
              End Call
            </button>
          </div>
          <div className="call-container">
            <div className="call-left">
              <CallWindow meetLink={roomUrl} onAudioStreamReady={handleAudioStreamReady} />
            </div>
            <div className="call-right">
              <div className="call-right-top">
                <TranscriptWindow transcripts={transcripts} />
              </div>
              <div className="call-right-middle">
                {/* Replaced ActionWindow with AnalysisWindow */}
                <AnalysisWindow analysisResults={analysisResults} />
              </div>
              <div className="call-right-bottom">
                <InteractionWindow
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  isWhisperMode={isWhisperMode}
                  whisper={whisper}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="error-message">Error: No Whereby room link provided.</div>
      )}
    </>
  );
};

export default CallPage;