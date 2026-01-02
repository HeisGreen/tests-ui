import React, { useState } from 'react';
import './Step4CreateIssueTypes.css';

/**
 * Step 4: Create Issue Types Screen
 * Maps to: on-design.json -> screen_04
 * Input field with add button, selected tags, and suggestion tags
 */
function Step4CreateIssueTypes({ issueTypes, onUpdate }) {
  const [inputValue, setInputValue] = useState('');
  
  const suggestionTags = [
    'General question',
    'Technical support',
    'Billing inquiry',
    'Feature request',
    'Bug report',
  ];

  const handleAddIssueType = () => {
    if (inputValue.trim() && !issueTypes.includes(inputValue.trim())) {
      const updated = [...issueTypes, inputValue.trim()];
      onUpdate('issueTypes', updated);
      setInputValue('');
    }
  };

  const handleRemoveIssueType = (tagToRemove) => {
    const updated = issueTypes.filter(tag => tag !== tagToRemove);
    onUpdate('issueTypes', updated);
  };

  const handleAddSuggestion = (suggestion) => {
    if (!issueTypes.includes(suggestion)) {
      const updated = [...issueTypes, suggestion];
      onUpdate('issueTypes', updated);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIssueType();
    }
  };

  return (
    <div className="kastamer-step4">
      <div className="kastamer-step4-input-section">
        <div className="kastamer-step4-input-wrapper">
          <input
            type="text"
            className="kastamer-input kastamer-step4-input"
            placeholder="Enter issue type..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            type="button"
            className="kastamer-btn-add"
            onClick={handleAddIssueType}
            disabled={!inputValue.trim()}
          >
            + Add
          </button>
        </div>
      </div>

      {issueTypes.length > 0 && (
        <div className="kastamer-step4-selected">
          <h3 className="kastamer-step4-section-title">Selected Issue Types</h3>
          <div className="kastamer-step4-tags">
            {issueTypes.map((tag, index) => (
              <span key={index} className="kastamer-tag kastamer-tag-selected">
                {tag}
                <button
                  type="button"
                  className="kastamer-tag-remove"
                  onClick={() => handleRemoveIssueType(tag)}
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="kastamer-step4-suggestions">
        <h3 className="kastamer-step4-section-title">Suggestions</h3>
        <div className="kastamer-step4-tags">
          {suggestionTags.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className={`kastamer-tag kastamer-tag-suggestion ${
                issueTypes.includes(suggestion) ? 'disabled' : ''
              }`}
              onClick={() => handleAddSuggestion(suggestion)}
              disabled={issueTypes.includes(suggestion)}
            >
              + {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Step4CreateIssueTypes;

