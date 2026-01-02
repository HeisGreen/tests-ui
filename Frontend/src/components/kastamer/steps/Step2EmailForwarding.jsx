import React, { useState } from 'react';
import './Step2EmailForwarding.css';

/**
 * Step 2: Email Forwarding Screen
 * Maps to: on-design.json -> screen_02
 * Generated email address display, checkbox, and guidance cards
 */
function Step2EmailForwarding({ emailForwardingActivated, onUpdate }) {
  const [generatedEmail] = useState('support@acme.kastamer.com');

  const handleCheckboxChange = (e) => {
    onUpdate('emailForwardingActivated', e.target.checked);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail);
    // Could add a toast notification here
  };

  return (
    <div className="kastamer-step2">
      <div className="kastamer-step2-email-section">
        <label className="kastamer-label">Generated Email Address</label>
        <div className="kastamer-email-copy-field">
          <input
            type="text"
            className="kastamer-input kastamer-input-readonly"
            value={generatedEmail}
            readOnly
          />
          <button
            type="button"
            className="kastamer-copy-button"
            onClick={copyToClipboard}
            aria-label="Copy email address"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="kastamer-step2-checkbox-section">
        <label className="kastamer-checkbox-label">
          <input
            type="checkbox"
            checked={emailForwardingActivated}
            onChange={handleCheckboxChange}
            className="kastamer-checkbox"
          />
          <span>Email forwarding has been activated</span>
        </label>
      </div>

      <div className="kastamer-step2-guidance">
        <h3 className="kastamer-guidance-title">Guidance</h3>
        <div className="kastamer-guidance-cards">
          <div className="kastamer-guidance-card">
            <h4 className="kastamer-guidance-card-title">Step 1</h4>
            <p className="kastamer-guidance-card-text">
              Add this email address to your email provider's forwarding settings
            </p>
          </div>
          <div className="kastamer-guidance-card">
            <h4 className="kastamer-guidance-card-title">Step 2</h4>
            <p className="kastamer-guidance-card-text">
              Verify the forwarding is working by sending a test email
            </p>
          </div>
          <div className="kastamer-guidance-card">
            <h4 className="kastamer-guidance-card-title">Step 3</h4>
            <p className="kastamer-guidance-card-text">
              Check your Kastamer inbox to confirm emails are being received
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step2EmailForwarding;

