import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dummyVisas } from '../data/dummyData'
import { FiCheckCircle, FiClock, FiDollarSign, FiArrowRight, FiStar } from 'react-icons/fi'
import { initScrollAnimations } from '../utils/scrollAnimation'
import './Recommendation.css'

function Recommendation() {
  const [selectedVisas, setSelectedVisas] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    initScrollAnimations()
  }, [])

  const handleSelectVisa = (visaId) => {
    if (selectedVisas.includes(visaId)) {
      setSelectedVisas(selectedVisas.filter(id => id !== visaId))
    } else {
      setSelectedVisas([...selectedVisas, visaId])
    }
  }

  const handleViewChecklist = (visaId) => {
    navigate(`/checklist/${visaId}`)
  }

  const getMatchColor = (score) => {
    if (score >= 90) return '#1ABC9C'
    if (score >= 80) return '#4A90E2'
    if (score >= 70) return '#F39C12'
    return '#E74C3C'
  }

  return (
    <div className="recommendation-page">
      <div className="page-header">
        <h1>Visa Recommendations</h1>
        <p>Based on your profile, here are the best visa options for you</p>
      </div>

      <div className="recommendations-list">
        {dummyVisas.map((visa, index) => (
          <div key={visa.id} className={`visa-card scroll-animate scroll-animate-delay-${(index % 4) + 1}`}>
            <div className="visa-card-header">
              <div className="visa-title-section">
                <h2>{visa.name}</h2>
                <p className="visa-country">{visa.country}</p>
              </div>
              <div className="match-score">
                <div
                  className="score-circle"
                  style={{ borderColor: getMatchColor(visa.matchScore) }}
                >
                  <span style={{ color: getMatchColor(visa.matchScore) }}>
                    {visa.matchScore}%
                  </span>
                </div>
                <span className="match-label">Match</span>
              </div>
            </div>

            <div className="visa-description">
              <p>{visa.description}</p>
            </div>

            <div className="visa-details">
              <div className="detail-item">
                <FiClock className="detail-icon" />
                <div>
                  <div className="detail-label">Processing Time</div>
                  <div className="detail-value">{visa.processingTime}</div>
                </div>
              </div>
              <div className="detail-item">
                <FiDollarSign className="detail-icon" />
                <div>
                  <div className="detail-label">Cost</div>
                  <div className="detail-value">{visa.cost}</div>
                </div>
              </div>
              <div className="detail-item">
                <FiCheckCircle className="detail-icon" />
                <div>
                  <div className="detail-label">Duration</div>
                  <div className="detail-value">{visa.duration}</div>
                </div>
              </div>
            </div>

            <div className="visa-requirements">
              <h3>Key Requirements</h3>
              <ul className="requirements-list">
                {visa.requirements.slice(0, 4).map((req, index) => (
                  <li key={index}>
                    <FiCheckCircle className="check-icon" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="visa-actions">
              <button
                onClick={() => handleViewChecklist(visa.id)}
                className="btn-primary"
              >
                View Full Checklist <FiArrowRight />
              </button>
            </div>
          </div>
        ))}
      </div>

      {dummyVisas.length === 0 && (
        <div className="empty-state">
          <p>No recommendations available at the moment.</p>
          <p>Please update your profile to get personalized recommendations.</p>
        </div>
      )}
    </div>
  )
}

export default Recommendation

