import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { 
  FiUser, 
  FiMail, 
  FiCamera, 
  FiX, 
  FiEdit3, 
  FiCheck, 
  FiCalendar,
  FiShield,
  FiSettings,
  FiChevronRight,
  FiGlobe,
  FiTarget,
  FiBriefcase,
  FiDollarSign,
  FiFileText,
  FiAward,
  FiMapPin,
} from 'react-icons/fi'
import { authAPI, profileAPI } from '../utils/api'
import { supabase } from '../config/firebase'
import './Profile.css'

function Profile() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  
  // Profile picture state
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)
  
  // Onboarding data
  const [onboardingData, setOnboardingData] = useState(null)
  const [loadingOnboarding, setLoadingOnboarding] = useState(true)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      })
    }
  }, [user])
  
  // Load onboarding data
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        const profile = await profileAPI.getProfile()
        setOnboardingData(profile?.onboarding_data || null)
      } catch (err) {
        console.error('Error loading onboarding data:', err)
      } finally {
        setLoadingOnboarding(false)
      }
    }
    loadOnboardingData()
  }, [])
  
  // Profile picture upload handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be less than 5MB')
      return
    }
    
    setPhotoError('')
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
    }
    reader.readAsDataURL(file)
    
    uploadProfilePhoto(file)
  }
  
  const uploadProfilePhoto = async (file) => {
    setUploadingPhoto(true)
    setPhotoError('')
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `avatars/${user.id}_${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload image')
      }
      
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)
      
      const publicUrl = urlData?.publicUrl
      
      if (!publicUrl) {
        throw new Error('Failed to get public URL')
      }
      
      await authAPI.updateCurrentUser({
        profile_picture_url: publicUrl
      })
      
      await refreshUser()
      setPreviewUrl(null)
      
    } catch (err) {
      console.error('Error uploading profile photo:', err)
      setPhotoError(err.message || 'Failed to upload photo')
      setPreviewUrl(null)
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  const removeProfilePhoto = async () => {
    setUploadingPhoto(true)
    setPhotoError('')
    
    try {
      await authAPI.updateCurrentUser({
        profile_picture_url: ''
      })
      await refreshUser()
    } catch (err) {
      console.error('Error removing profile photo:', err)
      setPhotoError(err.message || 'Failed to remove photo')
    } finally {
      setUploadingPhoto(false)
    }
  }
  
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }
  
  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  const displayPhotoUrl = previewUrl || user?.profile_picture_url

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
      await authAPI.updateCurrentUser({
        name: formData.name,
        email: formData.email
      })
      
      await refreshUser()
      
      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save profile')
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }
  
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A'
    try {
      let date
      if (dateValue instanceof Date) {
        date = dateValue
      } else if (typeof dateValue === 'string') {
        let cleanDate = dateValue
        if (cleanDate.includes('+') && cleanDate.endsWith('Z')) {
          cleanDate = cleanDate.replace(/Z$/, '')
        }
        date = new Date(cleanDate)
      } else if (typeof dateValue === 'number') {
        date = new Date(dateValue)
      } else {
        date = new Date(dateValue)
      }
      
      if (isNaN(date.getTime())) {
        return 'N/A'
      }
      
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    } catch (error) {
      return 'N/A'
    }
  }
  
  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let completed = 0
    let total = 6
    
    if (user?.name) completed++
    if (user?.email) completed++
    if (user?.profile_picture_url) completed++
    if (onboardingData?.nationality) completed++
    if (onboardingData?.preferred_destinations) completed++
    if (onboardingData?.education_level) completed++
    
    return Math.round((completed / total) * 100)
  }
  
  const completionPercentage = calculateProfileCompletion()

  // Quick stats from onboarding data
  const quickStats = [
    { 
      icon: FiMapPin, 
      label: 'From', 
      value: onboardingData?.nationality || 'Not set',
      color: '#ff6b4a'
    },
    { 
      icon: FiTarget, 
      label: 'Destination', 
      value: onboardingData?.preferred_destinations || 'Not set',
      color: '#4ade80'
    },
    { 
      icon: FiBriefcase, 
      label: 'Experience', 
      value: onboardingData?.total_experience_years ? `${onboardingData.total_experience_years} years` : 'Not set',
      color: '#a78bfa'
    },
  ]

  return (
    <div className="profile-page-redesign">
      {/* Ambient Background */}
      <div className="profile-ambient">
        <div className="profile-gradient-orb orb-1"></div>
        <div className="profile-gradient-orb orb-2"></div>
        <div className="profile-gradient-orb orb-3"></div>
      </div>

      {/* Profile Hero Section */}
      <motion.div 
        className="profile-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profile-hero-content">
          {/* Avatar Section */}
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-ring">
              <svg className="progress-ring" viewBox="0 0 160 160">
                <circle 
                  className="progress-ring-bg" 
                  cx="80" 
                  cy="80" 
                  r="74" 
                  fill="none" 
                  strokeWidth="6"
                />
                <circle 
                  className="progress-ring-fill" 
                  cx="80" 
                  cy="80" 
                  r="74" 
                  fill="none" 
                  strokeWidth="6"
                  strokeDasharray={`${completionPercentage * 4.65} 465`}
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="profile-avatar-container">
              {displayPhotoUrl ? (
                <img 
                  src={displayPhotoUrl} 
                  alt="Profile" 
                    className={`profile-avatar-img ${uploadingPhoto ? 'uploading' : ''}`}
                />
              ) : (
                  <div className={`profile-avatar-initials ${uploadingPhoto ? 'uploading' : ''}`}>
                  {getInitials(user?.name)}
                </div>
              )}
              
              {uploadingPhoto && (
                  <div className="avatar-loading">
                  <div className="avatar-spinner"></div>
                </div>
              )}
              </div>
              
              <button 
                className="avatar-camera-btn"
                onClick={triggerFileInput}
                disabled={uploadingPhoto}
              >
                <FiCamera />
              </button>
            </div>
            
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoSelect}
              className="hidden-input"
            />
            
            <div className="profile-completion-badge">
              <span className="completion-percent">{completionPercentage}%</span>
              <span className="completion-label">Complete</span>
            </div>
          </div>

          {/* User Info */}
          <div className="profile-hero-info">
            <div className="profile-name-section">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="profile-name-input"
                  placeholder="Your name"
                  autoFocus
                />
              ) : (
                <h1 className="profile-name">{user?.name || 'Your Name'}</h1>
              )}
              
              {!isEditing && (
                <button 
                  className="edit-name-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <FiEdit3 />
                </button>
              )}
            </div>
            
            <p className="profile-email">{user?.email}</p>
            
            <div className="profile-badges">
              <span className={`badge badge-status ${user?.is_active ? 'active' : 'inactive'}`}>
                <FiShield />
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="badge badge-date">
                <FiCalendar />
                Joined {formatDate(user?.created_at)}
              </span>
            </div>

            {isEditing && (
              <motion.div 
                className="edit-actions"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="edit-email-group">
                  <FiMail className="edit-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                    className="edit-email-input"
                    placeholder="Email address"
              />
            </div>

                {error && <p className="edit-error">{error}</p>}
                
                <div className="edit-buttons">
                  <button 
                    className="btn-cancel"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({ name: user?.name || '', email: user?.email || '' })
                      setError('')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-save-profile"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                    {!saving && !saved && <FiCheck />}
            </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Photo Actions */}
        {(user?.profile_picture_url || photoError) && (
          <div className="photo-actions-bar">
            {user?.profile_picture_url && (
              <button 
                className="btn-remove-avatar"
                onClick={removeProfilePhoto}
                disabled={uploadingPhoto}
              >
                <FiX />
                Remove Photo
              </button>
            )}
            {photoError && <span className="photo-error-msg">{photoError}</span>}
          </div>
        )}
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        className="profile-quick-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {quickStats.map((stat, index) => (
          <div key={index} className="quick-stat-card">
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              <stat.icon />
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="profile-grid">
        {/* Migration Profile Card */}
        <motion.div 
          className="profile-card migration-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="card-header-fancy">
            <div className="card-icon-wrapper">
              <FiGlobe />
            </div>
            <div>
              <h2>Migration Profile</h2>
              <p>Your journey details</p>
            </div>
          </div>
          
          {loadingOnboarding ? (
            <div className="card-loading">
              <div className="loading-spinner"></div>
              <p>Loading your profile...</p>
            </div>
          ) : onboardingData ? (
            <div className="migration-details">
              <div className="detail-row">
                <span className="detail-label">Nationality</span>
                <span className="detail-value">{onboardingData.nationality || 'Not set'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Current Residence</span>
                <span className="detail-value">{onboardingData.current_residence_country || 'Not set'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Destination</span>
                <span className="detail-value highlight">{onboardingData.preferred_destinations || 'Not set'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Timeline</span>
                <span className="detail-value">{onboardingData.migration_timeline || onboardingData.target_timeline || 'Not set'}</span>
              </div>
              
              <button 
                className="btn-edit-migration"
                onClick={() => navigate('/onboarding')}
              >
                <FiEdit3 />
                Update Migration Info
                <FiChevronRight />
              </button>
            </div>
          ) : (
            <div className="no-migration-data">
              <div className="no-data-icon">
                <FiGlobe />
              </div>
              <h3>Start Your Journey</h3>
              <p>Complete your migration profile to get personalized visa recommendations.</p>
              <button 
                className="btn-start-journey"
                onClick={() => navigate('/onboarding')}
              >
                Complete Profile
                <FiChevronRight />
              </button>
            </div>
          )}
        </motion.div>

        {/* Education & Career Card */}
        <motion.div 
          className="profile-card education-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="card-header-fancy">
            <div className="card-icon-wrapper purple">
              <FiAward />
            </div>
            <div>
              <h2>Education & Career</h2>
              <p>Your qualifications</p>
            </div>
          </div>
          
          {loadingOnboarding ? (
            <div className="card-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : onboardingData ? (
            <div className="education-details">
              <div className="detail-row">
                <span className="detail-label">Education Level</span>
                <span className="detail-value">{onboardingData.education_level || 'Not set'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Field of Study</span>
                <span className="detail-value">{onboardingData.field_of_study || 'Not set'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Current Role</span>
                <span className="detail-value">{onboardingData.current_job_title || 'Not set'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Industry</span>
                <span className="detail-value">{onboardingData.industry || 'Not set'}</span>
              </div>
              
              {onboardingData.languages_known && onboardingData.languages_known.length > 0 && (
                <div className="languages-section">
                  <span className="detail-label">Languages</span>
                  <div className="language-tags">
                    {onboardingData.languages_known.map((lang, idx) => (
                      <span key={idx} className="language-tag">{lang}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-data-compact">
              <p>No education data yet</p>
            </div>
          )}
        </motion.div>

        {/* Financial Info Card */}
        <motion.div 
          className="profile-card financial-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="card-header-fancy">
            <div className="card-icon-wrapper green">
              <FiDollarSign />
            </div>
            <div>
              <h2>Financial Overview</h2>
              <p>Budget & resources</p>
            </div>
          </div>
          
          {loadingOnboarding ? (
            <div className="card-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : onboardingData ? (
            <div className="financial-details">
              <div className="detail-row">
                <span className="detail-label">Max Budget</span>
                <span className="detail-value highlight-green">
                  {onboardingData.max_budget_usd 
                    ? `$${onboardingData.max_budget_usd.toLocaleString()}`
                    : onboardingData.budget_amount 
                      ? `${onboardingData.budget_currency || '$'}${onboardingData.budget_amount.toLocaleString()}`
                      : 'Not set'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Annual Income</span>
                <span className="detail-value">
                  {onboardingData.annual_income_usd 
                    ? `$${onboardingData.annual_income_usd.toLocaleString()}`
                    : 'Not disclosed'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Proof of Funds</span>
                <span className="detail-value">{onboardingData.proof_of_funds_source || 'Not specified'}</span>
              </div>
            </div>
          ) : (
            <div className="no-data-compact">
              <p>No financial data yet</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions Card */}
        <motion.div 
          className="profile-card actions-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="card-header-fancy">
            <div className="card-icon-wrapper amber">
              <FiSettings />
            </div>
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your account</p>
          </div>
        </div>

          <div className="actions-list">
            <button className="action-item" onClick={() => navigate('/onboarding')}>
              <FiFileText />
              <span>Update Migration Profile</span>
              <FiChevronRight />
            </button>
            <button className="action-item" onClick={() => navigate('/documents')}>
              <FiFileText />
              <span>Manage Documents</span>
              <FiChevronRight />
            </button>
            <button className="action-item" onClick={() => navigate('/recommendation')}>
              <FiTarget />
              <span>Get New Recommendation</span>
              <FiChevronRight />
            </button>
            <button className="action-item" onClick={() => navigate('/agents')}>
              <FiUser />
              <span>Find Travel Agents</span>
              <FiChevronRight />
            </button>
        </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Profile
