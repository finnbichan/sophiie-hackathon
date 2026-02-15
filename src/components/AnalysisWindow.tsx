import React from 'react';
import { AnalysisResult, Action, Question } from '../types/analysis';
import './AnalysisWindow.css';

interface AnalysisWindowProps {
  analysisResults: AnalysisResult[];
}

const AnalysisWindow: React.FC<AnalysisWindowProps> = ({ analysisResults }) => {
  return (
    <div className="analysis-window">
      <div className="analysis-header">Analysis</div>
      <div className="analysis-content">
        {analysisResults.length === 0 ? (
          <div className="analysis-empty">No analysis available yet.</div>
        ) : (
          analysisResults.map((result, index) => {
            if (result.type === 'action') {
              const action = result as Action;
              return (
                <div key={index} className="analysis-item action-item">
                  <p><strong>Action:</strong> {action.description}</p>
                  <div className="action-buttons">
                    <button className="add-btn">Add</button>
                    <button className="reject-btn">Reject</button>
                  </div>
                </div>
              );
            } else if (result.type === 'question') {
              const question = result as Question;
              return (
                <div key={index} className="analysis-item question-item">
                  <p><strong>Question:</strong> {question.text}</p>
                </div>
              );
            }
            // If type is 'null', don't render anything
            return null;
          })
        )}
      </div>
    </div>
  );
};

export default AnalysisWindow;
