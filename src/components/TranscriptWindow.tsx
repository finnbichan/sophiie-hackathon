import React, { useEffect, useRef } from 'react';
import './TranscriptWindow.css';

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

interface TranscriptWindowProps {
  transcripts: TranscriptEntry[];
}

const TranscriptWindow: React.FC<TranscriptWindowProps> = ({ transcripts }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new transcripts come in
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="transcript-window">
      <div className="transcript-header">Transcript</div>
      <div className="transcript-content" ref={scrollContainerRef}>
        {transcripts.length === 0 ? (
          <div className="transcript-empty">Waiting for transcript...</div>
        ) : (
          transcripts.map((entry) => (
            <div key={entry.id} className="transcript-entry">
              <span className="speaker">{entry.speaker}:</span>
              <span className="time">{entry.timestamp}</span>
              <div className="text">{entry.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TranscriptWindow;
