import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiHome, FiMessageCircle, FiUser, FiLogOut } from "react-icons/fi";
import logoMark from "../assets/japa-logo.png";
import "./TravelAgentLayout.css";

function TravelAgentLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

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
            <div className="sidebar-user">
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.name || "Agent"}</div>
                <div className="user-role">Travel Agent</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Top Bar */}
      {isMobile && (
        <header className="agent-mobile-header">
          <Link to="/agent/home" className="mobile-logo">
            <img className="logo-mark" src={logoMark} alt="JAPA logo" />
          </Link>
          <div className="mobile-user">
            <div className="user-avatar-small">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
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

