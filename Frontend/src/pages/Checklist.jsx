import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { dummyVisas, dummyChecklistItems } from '../data/dummyData'
import { FiCheckCircle, FiCircle, FiArrowLeft, FiFileText, FiInfo } from 'react-icons/fi'
import { initScrollAnimations } from '../utils/scrollAnimation'
import './Checklist.css'

function Checklist() {
  const { visaId } = useParams()
  const visa = dummyVisas.find(v => v.id === parseInt(visaId))
  const [checklist, setChecklist] = useState(
    dummyChecklistItems[visaId] || []
  )

  if (!visa) {
    return (
      <div className="checklist-page">
        <div className="error-state">
          <p>Visa not found</p>
          <Link to="/recommendation">Back to Recommendations</Link>
        </div>
      </div>
    )
  }

  useEffect(() => {
    initScrollAnimations()
  }, [])

  const toggleItem = (itemId) => {
    setChecklist(
      checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const completedCount = checklist.filter((item) => item.completed).length
  const totalCount = checklist.length
  const progress = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="checklist-page">
      <Link to="/recommendation" className="back-link">
        <FiArrowLeft /> Back to Recommendations
      </Link>

      <div className="checklist-header">
        <div>
          <h1>{visa.name}</h1>
          <p className="visa-subtitle">{visa.country} • {visa.type} Visa</p>
        </div>
        <div className="progress-summary">
          <div className="progress-circle">
            <svg className="progress-ring" width="120" height="120">
              <circle
                className="progress-ring-circle-bg"
                stroke="#E8F1FF"
                strokeWidth="8"
                fill="transparent"
                r="52"
                cx="60"
                cy="60"
              />
              <circle
                className="progress-ring-circle"
                stroke="#4A90E2"
                strokeWidth="8"
                fill="transparent"
                r="52"
                cx="60"
                cy="60"
                strokeDasharray={`${progress * 3.27} 327`}
                strokeDashoffset="0"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="progress-text">
              <span className="progress-number">{progress}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
        </div>
      </div>

      <div className="visa-info-card">
        <div className="info-row">
          <div className="info-col">
            <span className="info-label">Processing Time</span>
            <span className="info-value">{visa.processingTime}</span>
          </div>
          <div className="info-col">
            <span className="info-label">Cost</span>
            <span className="info-value">{visa.cost}</span>
          </div>
          <div className="info-col">
            <span className="info-label">Duration</span>
            <span className="info-value">{visa.duration}</span>
          </div>
        </div>
      </div>

      <div className="checklist-section">
        <div className="section-header">
          <h2>Application Checklist</h2>
          <span className="checklist-count">
            {completedCount} of {totalCount} completed
          </span>
        </div>

        <div className="checklist-items">
          {checklist.map((item, index) => (
            <div
              key={item.id}
              className={`checklist-item scroll-animate scroll-animate-delay-${(index % 4) + 1} ${item.completed ? 'completed' : ''}`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="check-button"
              >
                {item.completed ? (
                  <FiCheckCircle className="check-icon checked" />
                ) : (
                  <FiCircle className="check-icon" />
                )}
              </button>
              <div className="item-content">
                <div className="item-title">
                  {item.title}
                  {item.required && (
                    <span className="required-badge">Required</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="requirements-section">
        <h2>
          <FiInfo className="section-icon" />
          Eligibility Requirements
        </h2>
        <ul className="requirements-list">
          {visa.eligibility.map((req, index) => (
            <li key={index}>
              <FiCheckCircle className="check-icon" />
              {req}
            </li>
          ))}
        </ul>
      </div>

      <div className="documents-section">
        <div className="section-header">
          <h2>
            <FiFileText className="section-icon" />
            Required Documents
          </h2>
          <Link to="/documents" className="link-primary">
            Manage Documents
          </Link>
        </div>
        <div className="documents-grid">
          {visa.requirements.map((doc, index) => (
            <div key={index} className={`document-card scroll-animate scroll-animate-delay-${(index % 4) + 1}`}>
              <FiFileText className="doc-icon" />
              <span>{doc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Checklist

