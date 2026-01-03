import React from 'react';
import { Link } from 'react-router-dom';
import logoMark from '../../assets/japa-logo.png';
import './NavigationHeader.css';

/**
 * Navigation Header Component for Onboarding
 * JAPA-branded header with logo only
 */
function NavigationHeader() {
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
        <h1 className="onboarding-nav-title">Onboarding Section</h1>
      </div>
    </header>
  );
}

export default NavigationHeader;

