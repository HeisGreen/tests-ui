import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FiUser, FiMail, FiMapPin, FiBriefcase, FiSave } from 'react-icons/fi'
import { initScrollAnimations } from '../utils/scrollAnimation'
import './Profile.css'

function Profile() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    country: user?.country || '',
    age: user?.age || '',
    occupation: user?.occupation || ''
  })
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setSaved(false)
  }

  useEffect(() => {
    initScrollAnimations()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would update the user profile
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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

            <div className="form-group">
              <label htmlFor="country">
                <FiMapPin className="label-icon" />
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="United States"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">
                  <FiUser className="label-icon" />
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="28"
                />
              </div>

              <div className="form-group">
                <label htmlFor="occupation">
                  <FiBriefcase className="label-icon" />
                  Occupation
                </label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <button type="submit" className="btn-save">
              <FiSave />
              {saved ? 'Saved!' : 'Save Changes'}
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
              <span className="info-value">January 2024</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status</span>
              <span className="info-value status-active">Active</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Applications</span>
              <span className="info-value">2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

