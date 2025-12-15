import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiHome, FiUser, FiFileText, FiCheckSquare, FiLogOut } from 'react-icons/fi'
import './Layout.css'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/home" className="logo">
            VisaAgent
          </Link>
          <div className="nav-links">
            <Link to="/home" className="nav-link">
              <FiHome /> Home
            </Link>
            <Link to="/recommendation" className="nav-link">
              Get Recommendation
            </Link>
            <Link to="/documents" className="nav-link">
              <FiFileText /> Documents
            </Link>
            <Link to="/profile" className="nav-link">
              <FiUser /> Profile
            </Link>
            <button onClick={handleLogout} className="nav-link logout-btn">
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout

