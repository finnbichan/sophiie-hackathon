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
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Welcome to meetingmAIte</h1>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="context-text" style={{ display: 'block', marginBottom: '5px' }}>Meeting Context (optional):</label>
        <textarea
          id="context-text"
          name="contextText"
          rows={5}
          placeholder="Provide any relevant context for the meeting..."
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        ></textarea>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="context-files" style={{ display: 'block', marginBottom: '5px' }}>Upload Context Files (optional):</label>
        <input
          type="file"
          id="context-files"
          name="contextFiles"
          multiple
          onChange={handleFileChange}
          style={{ width: '100%' }}
        />
      </div>
      <button
        onClick={handleJoinCall}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Create and Join Call
      </button>
    </div>
  );
};

export default LandingPage;
