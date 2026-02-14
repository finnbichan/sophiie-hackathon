import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [meetLink, setMeetLink] = useState<string>('');
  const [contextText, setContextText] = useState<string>('');
  const [contextFiles, setContextFiles] = useState<FileList | null>(null);
  const navigate = useNavigate();

  const handleJoinCall = () => {
    if (meetLink) {
      navigate('/call', {
        state: {
          meetLink,
          contextText,
          contextFiles: contextFiles ? Array.from(contextFiles) : undefined,
        },
      });
    } else {
      alert('Please enter a Google Meet link.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContextFiles(event.target.files);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Welcome to meetingmAIte</h1>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="meet-link" style={{ display: 'block', marginBottom: '5px' }}>Google Meet Link:</label>
        <input
          type="text"
          id="meet-link"
          name="meetLink"
          placeholder="e.g., https://meet.google.com/abc-defg-hij"
          value={meetLink}
          onChange={(e) => setMeetLink(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>
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
        Join Call
      </button>
    </div>
  );
};

export default LandingPage;
