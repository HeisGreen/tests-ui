import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiCheckCircle, FiGlobe, FiClock, FiShield } from 'react-icons/fi'
import { initScrollAnimations } from '../utils/scrollAnimation'
import './Landing.css'

function Landing() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    initScrollAnimations()
  }, [])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/recommendation')
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="logo">VisaAgent</div>
          <div className="landing-nav-links">
            {isAuthenticated ? (
              <Link to="/home" className="btn-secondary">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="nav-link-text">Log in</Link>
                <Link to="/register" className="btn-primary">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            The smarter way to
            <br />
            get your visa
          </h1>
          <p className="hero-subtitle">
            Get personalized visa recommendations based on your profile. Track your application progress with our comprehensive checklist and document management system.
          </p>
          <button onClick={handleGetStarted} className="btn-hero">
            Get started
          </button>
        </div>
      </section>

      <section className="features">
        <div className="features-container">
          <h2 className="section-title">With us, visa applications are easy</h2>
          <p className="section-subtitle">
            Effortless visa planning for individuals, powerful solutions for your travel needs.
          </p>
          
          <div className="features-grid">
            <div className="feature-card scroll-animate scroll-animate-delay-1">
              <div className="feature-icon blue">
                <FiGlobe />
              </div>
              <h3>Smart Recommendations</h3>
              <p>We analyze your profile and provide personalized visa recommendations that match your needs and eligibility.</p>
            </div>
            
            <div className="feature-card scroll-animate scroll-animate-delay-2">
              <div className="feature-icon purple">
                <FiCheckCircle />
              </div>
              <h3>Track Your Progress</h3>
              <p>Stay organized with our comprehensive checklist system. Know exactly what documents you need and track your application progress.</p>
            </div>
            
            <div className="feature-card scroll-animate scroll-animate-delay-3">
              <div className="feature-icon pink">
                <FiClock />
              </div>
              <h3>Save Time</h3>
              <p>No more searching through confusing government websites. Get all the information you need in one place.</p>
            </div>
            
            <div className="feature-card scroll-animate scroll-animate-delay-4">
              <div className="feature-icon teal">
                <FiShield />
              </div>
              <h3>Secure Document Management</h3>
              <p>Upload and manage all your visa documents securely. Keep everything organized and easily accessible.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="how-it-works-container">
          <h2 className="section-title">How it works</h2>
          <div className="steps">
            <div className="step scroll-animate scroll-animate-delay-1">
              <div className="step-number">1</div>
              <h3>Create Your Profile</h3>
              <p>Tell us about yourself - your country, occupation, travel purpose, and more.</p>
            </div>
            <div className="step scroll-animate scroll-animate-delay-2">
              <div className="step-number">2</div>
              <h3>Get Recommendations</h3>
              <p>Receive personalized visa recommendations based on your profile and preferences.</p>
            </div>
            <div className="step scroll-animate scroll-animate-delay-3">
              <div className="step-number">3</div>
              <h3>Follow Your Checklist</h3>
              <p>Use our detailed checklist to gather required documents and complete your application.</p>
            </div>
            <div className="step scroll-animate scroll-animate-delay-4">
              <div className="step-number">4</div>
              <h3>Track Progress</h3>
              <p>Monitor your application progress and stay on top of deadlines and requirements.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-container">
          <p>&copy; 2024 VisaAgent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing

