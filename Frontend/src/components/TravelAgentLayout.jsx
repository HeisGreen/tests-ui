import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { travelAgentAPI } from "../utils/api";
import { FiHome, FiMessageCircle, FiUser, FiLogOut, FiCamera } from "react-icons/fi";
import logoMark from "../assets/japa-logo.png";
import "./TravelAgentLayout.css";

function TravelAgentLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [agentProfile, setAgentProfile] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load agent profile to get profile photo
  useEffect(() => {
    const loadAgentProfile = async () => {
      try {
        const profile = await travelAgentAPI.getProfile();
        setAgentProfile(profile);
      } catch (error) {
        console.error("Error loading agent profile:", error);
      }
    };
    loadAgentProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Get profile photo URL from agent profile or user
  const profilePhotoUrl = agentProfile?.onboarding_data?.profile_photo_url || user?.profile_picture_url;

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = agentProfile?.onboarding_data?.full_name || user?.name || "Agent";

  return (
    <div className="travel-agent-layout">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="agent-sidebar">
          <div className="sidebar-header">
            <Link to="/agent/home" className="sidebar-logo">
              <img className="logo-mark" src={logoMark} alt="JAPA logo" />
            </Link>
          </div>
          <nav className="sidebar-nav">
            <Link
              to="/agent/home"
              className={`sidebar-nav-item ${isActive("/agent/home") ? "active" : ""}`}
            >
              <FiHome />
              <span>Home</span>
            </Link>
            <Link
              to="/agent/messages"
              className={`sidebar-nav-item ${isActive("/agent/messages") ? "active" : ""}`}
            >
              <FiMessageCircle />
              <span>Messages</span>
            </Link>
            <Link
              to="/agent/profile"
              className={`sidebar-nav-item ${isActive("/agent/profile") ? "active" : ""}`}
            >
              <FiUser />
              <span>Profile</span>
            </Link>
          </nav>
          <div className="sidebar-footer">
            <button onClick={handleLogout} className="sidebar-logout">
              <FiLogOut />
              <span>Logout</span>
            </button>
            <Link to="/agent/profile" className="sidebar-user">
              {profilePhotoUrl ? (
                <img 
                  src={profilePhotoUrl} 
                  alt={displayName} 
                  className="user-avatar-img"
                />
              ) : (
                <div className="user-avatar">
                  {getInitials(displayName)}
                </div>
              )}
              <div className="user-info">
                <div className="user-name">{displayName}</div>
                <div className="user-role">Travel Agent</div>
              </div>
            </Link>
          </div>
        </aside>
      )}

      {/* Mobile Top Bar */}
      {isMobile && (
        <header className="agent-mobile-header">
          <Link to="/agent/home" className="mobile-logo">
            <img className="logo-mark" src={logoMark} alt="JAPA logo" />
          </Link>
          <Link to="/agent/profile" className="mobile-user">
            {profilePhotoUrl ? (
              <img 
                src={profilePhotoUrl} 
                alt={displayName} 
                className="user-avatar-small-img"
              />
            ) : (
              <div className="user-avatar-small">
                {getInitials(displayName)}
              </div>
            )}
          </Link>
        </header>
      )}

      {/* Main Content */}
      <main className={`agent-main-content ${isMobile ? "mobile" : "desktop"}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="agent-bottom-nav">
          <Link
            to="/agent/home"
            className={`bottom-nav-item ${isActive("/agent/home") ? "active" : ""}`}
          >
            <FiHome />
            <span>Home</span>
          </Link>
          <Link
            to="/agent/messages"
            className={`bottom-nav-item ${isActive("/agent/messages") ? "active" : ""}`}
          >
            <FiMessageCircle />
            <span>Messages</span>
            {/* Unread badge can be added here */}
          </Link>
          <Link
            to="/agent/profile"
            className={`bottom-nav-item ${isActive("/agent/profile") ? "active" : ""}`}
          >
            <FiUser />
            <span>Profile</span>
          </Link>
        </nav>
      )}
    </div>
  );
}

export default TravelAgentLayout;

