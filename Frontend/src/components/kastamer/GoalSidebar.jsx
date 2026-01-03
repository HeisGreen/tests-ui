import React from 'react';
import { FaTrophy, FaStar } from 'react-icons/fa';
import './GoalSidebar.css';

/**
 * Goal Sidebar Component
 * Displays goal information in a compact container with progress tracking
 */
function GoalSidebar({ currentStep, totalSteps = 9, questionsAnswered = 0, scorePercent = 0 }) {

  return (
    <div className="goal-sidebar">
      <div className="goal-sidebar-content">
        {/* Goal Section */}
        <div className="goal-section">
          <div className="goal-header">
            <FaTrophy className="goal-icon" />
            <span className="goal-label">Goal:</span>
          </div>
          <div className="goal-title">Free Visa Recommendations</div>
          
          {/* Score Circle */}
          <div className="goal-score-circle">
            <svg className="score-circle-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#32d74b" />
                  <stop offset="50%" stopColor="#28c143" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <circle
                className="score-circle-bg"
                cx="60"
                cy="60"
                r="52"
                fill="none"
              />
              <circle
                className="score-circle-progress"
                cx="60"
                cy="60"
                r="52"
                fill="none"
                strokeDasharray={`${(scorePercent / 100) * 326.73} 326.73`}
                strokeDashoffset="0"
              />
            </svg>
            <div className="score-text">
              <span className="score-percent">{scorePercent}%</span>
              <span className="score-label">Score</span>
            </div>
          </div>

          {/* Stages and Questions Info */}
          <div className="goal-stats">
            <div className="goal-stat-item">Stages {currentStep}/{totalSteps}</div>
            <div className="goal-stat-item">Questions {questionsAnswered}/9</div>
          </div>

          {/* Motivational Message */}
          <div className="goal-message">
            <FaStar className="message-icon" />
            <span>Just getting started! Each step brings you closer to your goal.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalSidebar;

