import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FiUser, FiMail, FiMapPin, FiBriefcase, FiSave } from 'react-icons/fi'
import { initScrollAnimations } from '../utils/scrollAnimation'
import OnboardingDataSection from '../components/OnboardingDataSection'
import { authAPI } from '../utils/api'
import './Profile.css'

function Profile() {
  const { user, refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      })
      // Debug: log user object to check for created_at field
      console.log('Profile - User object:', user);
      console.log('Profile - User created_at:', user.created_at);
      console.log('Profile - User keys:', Object.keys(user));
    }
  }, [user])

  useEffect(() => {
    initScrollAnimations()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setSaved(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    try {
      // Update user info via API
      await authAPI.updateCurrentUser({
        name: formData.name,
        email: formData.email
      })
      
      // Refresh user data in context
      await refreshUser()
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save profile')
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-card scroll-animate scroll-animate-delay-1">
          <div className="card-header">
            <h2>
              <FiUser className="header-icon" />
              Personal Information
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">
                <FiUser className="label-icon" />
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <FiMail className="label-icon" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="btn-save" disabled={saving}>
              <FiSave />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="profile-card scroll-animate scroll-animate-delay-2">
          <div className="card-header">
            <h2>Account Information</h2>
          </div>
          <div className="account-info">
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">
                {(() => {
                  if (!user) {
                    return 'N/A';
                  }
                  
                  // Check for created_at in various possible formats
                  const dateValue = user.created_at || user.createdAt || user['created_at'];
                  
                  if (!dateValue) {
                    console.warn('No created_at field found. User object:', user);
                    return 'N/A';
                  }
                  
                  try {
                    let date;
                    
                    // Handle Date object
                    if (dateValue instanceof Date) {
                      date = dateValue;
                    } 
                    // Handle string dates
                    else if (typeof dateValue === 'string') {
                      // Clean up malformed date strings (remove trailing Z if timezone offset exists)
                      let cleanDate = dateValue;
                      // If string has both timezone offset (+XX:XX) and Z, remove the Z
                      if (cleanDate.includes('+') && cleanDate.endsWith('Z')) {
                        cleanDate = cleanDate.replace(/Z$/, '');
                      }
                      // Try parsing the ISO string
                      date = new Date(cleanDate);
                    } 
                    // Handle number (timestamp)
                    else if (typeof dateValue === 'number') {
                      date = new Date(dateValue);
                    }
                    // Fallback: try to parse as-is
                    else {
                      date = new Date(dateValue);
                    }
                    
                    // Validate the date
                    if (isNaN(date.getTime())) {
                      console.error('Invalid date:', dateValue, 'type:', typeof dateValue);
                      return 'N/A';
                    }
                    
                    // Format the date with day, month, and year
                    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                  } catch (error) {
                    console.error('Error parsing date:', error, 'value:', dateValue);
                    return 'N/A';
                  }
                })()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status</span>
              <span className="info-value status-active">
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Onboarding Data Section */}
        <div className="profile-card scroll-animate scroll-animate-delay-3">
          <OnboardingDataSection />
        </div>
      </div>
    </div>
  )
}

export default Profile

