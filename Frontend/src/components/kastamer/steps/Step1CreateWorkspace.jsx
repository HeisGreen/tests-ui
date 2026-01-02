import React from 'react';
import './Step1CreateWorkspace.css';

/**
 * Step 1: Create Workspace Screen
 * Maps to: on-design.json -> screen_01
 * Input fields for workspace name and email, plus documentation buttons
 */
function Step1CreateWorkspace({ workspaceName, workspaceEmail, onUpdate }) {
  const handleWorkspaceNameChange = (e) => {
    onUpdate('workspaceName', e.target.value);
  };

  const handleWorkspaceEmailChange = (e) => {
    onUpdate('workspaceEmail', e.target.value);
  };

  return (
    <div className="kastamer-step1">
      <div className="kastamer-step1-form">
        <div className="kastamer-form-group">
          <label htmlFor="workspace-name" className="kastamer-label">
            Workspace Name
          </label>
          <input
            id="workspace-name"
            type="text"
            className="kastamer-input"
            placeholder="Acme Support"
            value={workspaceName}
            onChange={handleWorkspaceNameChange}
          />
        </div>

        <div className="kastamer-form-group">
          <label htmlFor="workspace-email" className="kastamer-label">
            Workspace Email
          </label>
          <input
            id="workspace-email"
            type="email"
            className="kastamer-input"
            placeholder="support@acme.com"
            value={workspaceEmail}
            onChange={handleWorkspaceEmailChange}
          />
        </div>
      </div>

      <div className="kastamer-step1-documentation">
        <h3 className="kastamer-docs-title">Documentation</h3>
        <div className="kastamer-docs-buttons">
          <button type="button" className="kastamer-doc-button">
            Getting Started Guide
          </button>
          <button type="button" className="kastamer-doc-button">
            API Documentation
          </button>
          <button type="button" className="kastamer-doc-button">
            Support Center
          </button>
        </div>
      </div>
    </div>
  );
}

export default Step1CreateWorkspace;

