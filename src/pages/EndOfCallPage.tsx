import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractionWindow from '../components/InteractionWindow';
import GeminiService from '../services/GeminiService';
import './EndOfCallPage.css';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface Action {
  title: string;
  status: 'completed' | 'pending' | 'approved' | 'denied';
}

const EndOfCallPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      text: 'Meeting summary: You discussed the Q4 roadmap, upcoming features, and timeline for release. Three action items were identified.',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Gemini service
  const [geminiService] = useState(
    () => new GeminiService(process.env.REACT_APP_GEMINI_API_KEY)
  );

  const [actions] = useState<Action[]>([
    { title: 'Schedule follow-up meeting for Q4 planning', status: 'completed' },
    { title: 'Send design mockups to team', status: 'approved' },
    { title: 'Review budget allocation', status: 'pending' },
  ]);

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

  const handleFinish = () => {
    navigate('/');
  };

  return (
    <div className="end-of-call-page">
      <div className="end-of-call-container">
        <div className="end-of-call-summary">
          <h1>Call Summary</h1>
          <p>
            Meeting concluded. Here's a summary of what was discussed and actions taken:
          </p>

          <div className="actions-list">
            <h2>Action Items</h2>
            {actions.map((action, index) => (
              <div key={index} className={`action-item action-status-${action.status}`}>
                <span className="action-status-badge">{action.status}</span>
                <span className="action-text">{action.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="end-of-call-interaction">
          <InteractionWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="end-of-call-footer">
        <button onClick={handleFinish} className="finish-button">
          Finish
        </button>
      </div>
    </div>
  );
};

export default EndOfCallPage;
