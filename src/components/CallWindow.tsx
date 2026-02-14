import React, { useEffect, useRef } from 'react';
import './CallWindow.css';

interface CallWindowProps {
  meetLink: string;
}

const CallWindow: React.FC<CallWindowProps> = ({ meetLink }) => {
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    if (webviewRef.current && meetLink) {
      webviewRef.current.src = meetLink;
    }
  }, [meetLink]);

  return (
    <div className="call-window">
      <webview
        ref={webviewRef}
        src={meetLink}
        style={{ width: '100%', height: '100%' }}
        allowFullScreen
      />
    </div>
  );
};

export default CallWindow;
