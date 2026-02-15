import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WherebyService from '../services/WherebyService'; // Import WherebyService

const LandingPage: React.FC = () => {
  // Remove meetLink state as Whereby creates the room
  const [contextText, setContextText] = useState<string>('');
  const [contextFiles, setContextFiles] = useState<FileList | null>(null);
  const navigate = useNavigate();

  // Instantiate WherebyService
  const [wherebyService] = useState(() => new WherebyService());


  const handleJoinCall = async () => {
    try {
      // Calculate endDate for Whereby room (e.g., 1 hour from now)
      const endDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const roomUrl = await wherebyService.createMeetingRoom(endDate);
      console.log('Created Whereby room:', roomUrl);
      navigate('/call', {
        state: {
          roomUrl, // Pass roomUrl directly
          contextText,
          contextFiles: contextFiles ? Array.from(contextFiles) : undefined,
        },
      });
    } catch (error) {
      console.error('Error creating Whereby room:', error);
      alert('Failed to create Whereby meeting room. Please try again.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContextFiles(event.target.files);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: 'auto', backgroundColor: '#1f1f1f', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0, 0,0, 0.3)' }}>
      <h1 style={{ marginBottom: '25px', color: '#e0e0e0', textAlign: 'center' }}>Welcome to meetingmAIte</h1>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="context-text" style={{ display: 'block', marginBottom: '8px', color: '#e0e0e0', fontSize: '1.1em' }}>Meeting Context (optional):</label>
        <textarea
          id="context-text"
          name="contextText"
          rows={5}
          placeholder="Provide any relevant context for the meeting..."
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '6px', backgroundColor: '#282828', color: '#e0e0e0', fontSize: '1em', resize: 'vertical' }}
        ></textarea>
      </div>
      <div style={{ marginBottom: '30px' }}>
        <label htmlFor="context-files" style={{ display: 'block', marginBottom: '8px', color: '#e0e0e0', fontSize: '1.1em' }}>Upload Context Files (optional):</label>
        <input
          type="file"
          id="context-files"
          name="contextFiles"
          multiple
          onChange={handleFileChange}
          style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '6px', backgroundColor: '#282828', color: '#e0e0e0', fontSize: '1em' }}
        />
      </div>
      <button
        onClick={handleJoinCall}
        style={{
          padding: '12px 25px',
          fontSize: '17px',
          backgroundColor: '#42a5f5', // Blue for primary action
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          width: '100%',
          transition: 'background-color 0.2s ease, transform 0.1s ease',
        }}
      >
        Create and Join Call
      </button>
    </div>
  );
};

export default LandingPage;
