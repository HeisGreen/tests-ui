import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dummyUserRecommendations, dummyVisas } from '../data/dummyData'
import { FiArrowRight, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi'
import { initScrollAnimations } from '../utils/scrollAnimation'
import './Home.css'

function Home() {
  const { user } = useAuth()

  useEffect(() => {
    initScrollAnimations()
  }, [])

  const getVisaDetails = (visaId) => {
    return dummyVisas.find(v => v.id === visaId)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return '#4A90E2'
      case 'completed':
        return '#1ABC9C'
      case 'not_started':
        return '#95A5A6'
      default:
        return '#95A5A6'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress':
        return <FiClock />
      case 'completed':
        return <FiCheckCircle />
      default:
        return <FiFileText />
    }
  }

  return (
    <div className="home">
      <div className="home-header">
        <h1>Welcome back, {user?.name || 'User'}!</h1>
        <p>Here's an overview of your visa applications and recommendations</p>
      </div>

      <div className="home-stats">
        <div className="stat-card scroll-animate scroll-animate-delay-1">
          <div className="stat-value">{dummyUserRecommendations.length}</div>
          <div className="stat-label">Active Applications</div>
        </div>
        <div className="stat-card scroll-animate scroll-animate-delay-2">
          <div className="stat-value">
            {dummyUserRecommendations.filter(r => r.status === 'in_progress').length}
          </div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card scroll-animate scroll-animate-delay-3">
          <div className="stat-value">
            {Math.round(
              dummyUserRecommendations.reduce((acc, r) => acc + r.progress, 0) /
              dummyUserRecommendations.length
            )}%
          </div>
          <div className="stat-label">Average Progress</div>
        </div>
      </div>

      <div className="home-section">
        <div className="section-header">
          <h2>Your Recommendations</h2>
          <Link to="/recommendation" className="link-primary">
            Get New Recommendation <FiArrowRight />
          </Link>
        </div>

        {dummyUserRecommendations.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any recommendations yet.</p>
            <Link to="/recommendation" className="btn-primary">
              Get Your First Recommendation
            </Link>
          </div>
        ) : (
          <div className="recommendations-grid">
            {dummyUserRecommendations.map((rec, index) => {
              const visa = getVisaDetails(rec.visaId)
              return (
                <div key={rec.id} className={`recommendation-card scroll-animate scroll-animate-delay-${(index % 3) + 1}`}>
                  <div className="card-header">
                    <div>
                      <h3>{rec.visaName}</h3>
                      <p className="card-subtitle">{visa?.country}</p>
                    </div>
                    <div
                      className="status-badge"
                      style={{ color: getStatusColor(rec.status) }}
                    >
                      {getStatusIcon(rec.status)}
                      <span>{rec.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Progress</span>
                      <span className="progress-percent">{rec.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${rec.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="card-info">
                    <div className="info-item">
                      <span className="info-label">Documents:</span>
                      <span className="info-value">
                        {rec.documentsSubmitted}/{rec.documentsTotal}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Next Step:</span>
                      <span className="info-value">{rec.nextStep}</span>
                    </div>
                  </div>

                  <Link
                    to={`/checklist/${rec.visaId}`}
                    className="btn-card-action"
                  >
                    View Checklist <FiArrowRight />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="home-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <Link to="/recommendation" className="action-card">
            <div className="action-icon blue">
              <FiFileText />
            </div>
            <h3>Get Recommendation</h3>
            <p>Find the best visa options for you</p>
          </Link>
          <Link to="/documents" className="action-card">
            <div className="action-icon purple">
              <FiFileText />
            </div>
            <h3>Manage Documents</h3>
            <p>Upload and organize your visa documents</p>
          </Link>
          <Link to="/profile" className="action-card">
            <div className="action-icon teal">
              <FiCheckCircle />
            </div>
            <h3>Update Profile</h3>
            <p>Keep your information up to date</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home

