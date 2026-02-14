import React from 'react';
import './ActionWindow.css';

interface Action {
  id: string;
  type: 'suggestion' | 'reminder' | 'context' | 'question';
  title: string;
  description?: string;
  requiresApproval?: boolean;
  onApprove?: () => void;
  onDeny?: () => void;
}

interface ActionWindowProps {
  actions: Action[];
}

const ActionWindow: React.FC<ActionWindowProps> = ({ actions }) => {
  return (
    <div className="action-window">
      <div className="action-header">Suggested Actions</div>
      <div className="action-content">
        {actions.length === 0 ? (
          <div className="action-empty">Analyzing meeting...</div>
        ) : (
          actions.map((action) => (
            <div key={action.id} className={`action-item action-${action.type}`}>
              <div className="action-title">{action.title}</div>
              {action.description && (
                <div className="action-description">{action.description}</div>
              )}
              {action.requiresApproval && (
                <div className="action-buttons">
                  <button
                    className="action-approve"
                    onClick={action.onApprove}
                  >
                    Approve
                  </button>
                  <button
                    className="action-deny"
                    onClick={action.onDeny}
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionWindow;
