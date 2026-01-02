import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHelpCircle } from 'react-icons/fi';
import logoMark from '../../assets/japa-logo.png';
import './NavigationHeader.css';

/**
 * Navigation Header Component for Onboarding
 * JAPA-branded header with logo, user info, help, and logout
 */
function NavigationHeader({ userEmail }) {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (logout) {
      logout();
    }
  };

  return (
    <header className="onboarding-nav-header">
      <div className="nav-header-decoration nav-header-decoration-1"></div>
      <div className="nav-header-decoration nav-header-decoration-2"></div>
      
      <div className="onboarding-nav-header-content">
        <Link to="/home" className="onboarding-nav-logo">
          <div className="logo-wrapper">
            <img className="onboarding-logo-mark" src={logoMark} alt="JAPA logo" />
            <div className="logo-glow"></div>
          </div>
        </Link>
        
        <div className="onboarding-nav-right">
          <span className="onboarding-nav-user-email">
            {userEmail}
          </span>
          <Link to="/faq" className="onboarding-nav-link">
            <FiHelpCircle />
            <span>Help</span>
          </Link>
          <button
            onClick={handleLogout}
            className="onboarding-nav-link onboarding-nav-link-button"
            type="button"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

export default NavigationHeader;

