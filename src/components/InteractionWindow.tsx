import React, { useState, useEffect, useRef } from 'react';
import './InteractionWindow.css';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface InteractionWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  isWhisperMode?: boolean;
  whisper?: string; // New prop for current whisper text
}

const InteractionWindow: React.FC<InteractionWindowProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  isWhisperMode = false,
  whisper = '',

}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isWhisperMode) {
       setInput(whisper);
    }
  }, [isWhisperMode, whisper]);

    useEffect(() => {
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || (e.key.toLowerCase() === 'p' && isWhisperMode)) {
          handleSend();
        }
      };

      window.addEventListener('keyup', handleKeyUp);
  
      return () => {
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, [isWhisperMode, input]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="interaction-window">
      <div className="interaction-header">
        Interaction {isWhisperMode && <span className="whisper-badge">🎤 Whisper Mode</span>}
      </div>
      <div className="interaction-messages">
        {messages.length === 0 ? (
          <div className="interaction-empty">
            Start a conversation with the AI agent. Press 'P' for Whisper mode.
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`interaction-message interaction-${msg.role}`}>
                <span className="message-role">{msg.role === 'user' ? 'You' : 'Agent'}:</span>
                <span className="message-time">{msg.timestamp}</span>
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className="interaction-message interaction-agent">
                <div className="message-loading">Agent is typing...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <div className="interaction-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isWhisperMode ? 'Listening...' : 'Type a message...'}
          disabled={isLoading}
          className="interaction-input-field"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="interaction-send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default InteractionWindow;
