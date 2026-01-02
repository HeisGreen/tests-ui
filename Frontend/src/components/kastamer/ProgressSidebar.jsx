import React from 'react';
import { FaFolder, FaCheck, FaPaperPlane, FaTag } from 'react-icons/fa';
import './ProgressSidebar.css';

/**
 * Progress Sidebar Component
 * Maps to: on-design.json -> ui_sidebar
 * Displays vertical stepper with step indicators
 */
function ProgressSidebar({ currentStep, totalSteps = 9, stepNames = [] }) {
  // Create steps array from stepNames or use default
  const steps = stepNames.length > 0 
    ? stepNames.map((name, index) => ({
        id: index + 1,
        label: name,
        icon: index === 0 ? FaFolder : index === stepNames.length - 1 ? FaTag : FaCheck,
        description: index === 0 ? 'Get started by setting up your workspace...' : '',
      }))
    : [
        {
          id: 1,
          label: 'Add Workspace',
          icon: FaFolder,
          description: 'Get started by setting up your workspace...',
        },
        {
          id: 2,
          label: 'Verification & Setting',
          icon: FaCheck,
          description: '',
        },
        {
          id: 3,
          label: 'Sending Emails',
          icon: FaPaperPlane,
          description: '',
        },
        {
          id: 4,
          label: 'Create Issue',
          icon: FaTag,
          description: '',
        },
      ];

  return (
    <div className="kastamer-sidebar">
      <div className="kastamer-sidebar-content">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div
              key={step.id}
              className={`kastamer-sidebar-step ${isActive ? 'active' : ''} ${
                isCompleted ? 'completed' : ''
              }`}
            >
              <div className="kastamer-sidebar-step-indicator">
                {isCompleted ? (
                  <span className="kastamer-sidebar-checkmark">✓</span>
                ) : (
                  <span className="kastamer-sidebar-icon">
                    {React.createElement(step.icon)}
                  </span>
                )}
              </div>
              <div className="kastamer-sidebar-step-content">
                <div className="kastamer-sidebar-step-label">{step.label}</div>
                {step.id === 1 && step.description && (
                  <div className="kastamer-sidebar-step-description">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressSidebar;

