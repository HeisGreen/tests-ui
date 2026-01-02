import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProgressSidebar from './ProgressSidebar';
import NavigationHeader from './NavigationHeader';
import Step1CreateWorkspace from './steps/Step1CreateWorkspace';
import Step2EmailForwarding from './steps/Step2EmailForwarding';
import Step3OutboundEmails from './steps/Step3OutboundEmails';
import Step4CreateIssueTypes from './steps/Step4CreateIssueTypes';
import './KastamerOnboarding.css';

/**
 * Kastamer Onboarding Flow
 * Based on on-design.json specification
 * 4-step SaaS onboarding wizard
 */
function KastamerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    workspaceName: '',
    workspaceEmail: '',
    
    // Step 2
    emailForwardingActivated: false,
    
    // Step 3
    dnsVerified: false,
    
    // Step 4
    issueTypes: [],
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Handle final submission
    console.log('Onboarding complete:', formData);
    // Navigate to home or dashboard
    navigate('/home');
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CreateWorkspace
            workspaceName={formData.workspaceName}
            workspaceEmail={formData.workspaceEmail}
            onUpdate={updateFormData}
          />
        );
      case 2:
        return (
          <Step2EmailForwarding
            emailForwardingActivated={formData.emailForwardingActivated}
            onUpdate={updateFormData}
          />
        );
      case 3:
        return (
          <Step3OutboundEmails
            dnsVerified={formData.dnsVerified}
            onUpdate={updateFormData}
          />
        );
      case 4:
        return (
          <Step4CreateIssueTypes
            issueTypes={formData.issueTypes}
            onUpdate={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="kastamer-onboarding">
      <NavigationHeader userEmail={user?.email || 'jonathan@acme.com'} />
      
      <div className="kastamer-onboarding-container">
        <ProgressSidebar currentStep={currentStep} />
        
        <div className="kastamer-onboarding-content">
          <div className="kastamer-step-header">
            {currentStep === 4 ? (
              <h1 className="kastamer-step-title">LAST STEP</h1>
            ) : (
              <h1 className="kastamer-step-title">STEP {currentStep} OF {totalSteps}</h1>
            )}
            <h2 className="kastamer-step-subtitle">
              {currentStep === 1 && 'Create your workspace'}
              {currentStep === 2 && 'Set up email forwarding'}
              {currentStep === 3 && 'Outbound emails'}
              {currentStep === 4 && 'Create issue types'}
            </h2>
          </div>

          <div className="kastamer-step-content">
            {renderStep()}
          </div>

          <div className="kastamer-step-actions">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="kastamer-btn-secondary"
                type="button"
              >
                Previous
              </button>
            )}
            <div className="kastamer-spacer" />
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="kastamer-btn-primary"
                type="button"
              >
                Save and continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="kastamer-btn-primary kastamer-btn-primary-final"
                type="button"
              >
                Process and set up →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KastamerOnboarding;

