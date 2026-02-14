import React from 'react';
import "@whereby.com/browser-sdk/embed"; // Import the Whereby embed web component
import './CallWindow.css';

interface CallWindowProps {
  meetLink: string; // This will actually be the Whereby room URL
}

const CallWindow: React.FC<CallWindowProps> = ({ meetLink }) => {
  return (
    <div className="call-window-container">
      {meetLink ? (
        <whereby-embed
          room={meetLink}
          className="whereby-embed"
          // You can add other Whereby embed attributes here if needed
          // For example:
          // style={{ width: '100%', height: '100%' }}
        ></whereby-embed>
      ) : (
        <div className="no-meet-link">
          Please provide a Whereby room link to start the call.
        </div>
      )}
    </div>
  );
};

export default CallWindow;
