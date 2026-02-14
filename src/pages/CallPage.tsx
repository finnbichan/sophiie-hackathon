import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CallWindow from '../components/CallWindow';
import TranscriptWindow from '../components/TranscriptWindow';
import ActionWindow from '../components/ActionWindow';
import InteractionWindow from '../components/InteractionWindow';
import GeminiService from '../services/GeminiService';
import './CallPage.css';

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

interface Action {
  id: string;
  type: 'suggestion' | 'reminder' | 'context' | 'question';
  title: string;
  description?: string;
  requiresApproval?: boolean;
  onApprove?: () => void;
  onDeny?: () => void;
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
  const { meetLink, contextText, contextFiles } = (location.state || {}) as {
    meetLink?: string;
    contextText?: string;
    contextFiles?: File[];
  };

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isWhisperMode, setIsWhisperMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Gemini service
  const [geminiService] = useState(
    () => new GeminiService(process.env.REACT_APP_GEMINI_API_KEY)
  );

  if (!meetLink) {
    return <div className="error-message">Error: No meeting link provided.</div>;
  }

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

    // Call Gemini API for response
    geminiService
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
        // TODO: Auto-mute in Google Meet
        // TODO: Start voice dictation
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && isWhisperMode) {
        setIsWhisperMode(false);
        // TODO: Stop voice dictation
        // TODO: Unmute in Google Meet
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isWhisperMode]);

  // Generate suggestions when transcript updates
  useEffect(() => {
    if (transcripts.length > 0 && actions.length === 0) {
      const transcriptText = transcripts
        .map((t) => `${t.speaker}: ${t.text}`)
        .join('\n');

      geminiService.setTranscriptContext(transcriptText);

      /*geminiService
        .generateSuggestions(transcriptText)
        .then((suggestions) => {
          const newActions: Action[] = (suggestions || []).map(
            (suggestion, index) => ({
              id: `action-${index}`,
              type: (suggestion.type as 'suggestion' | 'reminder' | 'context' | 'question') || 'suggestion',
              title: suggestion.title,
              description: suggestion.description,
              requiresApproval: suggestion.type === 'reminder',
              onApprove: () =>
                console.log('Approved:', suggestion.title),
              onDeny: () =>
                console.log('Denied:', suggestion.title),
            })
          );
          setActions(newActions);
        })
        .catch((error) =>
          console.error('Error generating suggestions:', error)
        );*/
    }
  }, [transcripts.length, actions.length]);

  return (
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
          <CallWindow meetLink={meetLink} />
        </div>
        <div className="call-right">
          <div className="call-right-top">
            <TranscriptWindow transcripts={transcripts} />
          </div>
          <div className="call-right-middle">
            <ActionWindow actions={actions} />
          </div>
          <div className="call-right-bottom">
            <InteractionWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isWhisperMode={isWhisperMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPage;
