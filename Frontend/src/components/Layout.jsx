import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiUser,
  FiFileText,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiCompass,
  FiChevronDown,
} from "react-icons/fi";
import { FaXTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa6";
import logoMark from "../assets/japa-logo.png";
import "./Layout.css";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { to: "/home", icon: FiHome, label: "Home" },
    { to: "/recommendation", icon: FiCompass, label: "Get Recommendation" },
    { to: "/messages", icon: FiMessageCircle, label: "Messages" },
    { to: "/documents", icon: FiFileText, label: "Documents" },
  ];

  return (
    <div className="layout-dark">
      {/* Ambient Background */}
      <div className="layout-ambient">
        <div className="layout-orb layout-orb-1"></div>
        <div className="layout-orb layout-orb-2"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar-dark">
        <div className="nav-container-dark">
          <Link to="/home" className="nav-logo-dark">
            <img src={logoMark} alt="JAPA" className="nav-logo-img" />
          </Link>
          
          <div className="nav-links-dark">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link-dark ${isActive(item.to) ? "active" : ""}`}
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* User Profile Dropdown */}
            <div className="nav-profile-dropdown">
              <Link 
                to="/profile" 
                className={`nav-profile-trigger ${isActive("/profile") ? "active" : ""}`}
              >
                {user?.profile_picture_url ? (
                  <img 
                    src={user.profile_picture_url} 
                    alt={user.name} 
                    className="nav-profile-avatar"
                  />
                ) : (
                  <div className="nav-profile-avatar-placeholder">
                    {getInitials(user?.name)}
                  </div>
                )}
                <span className="nav-profile-name">{user?.name?.split(" ")[0] || "Profile"}</span>
                <FiChevronDown className="nav-profile-chevron" />
              </Link>
              
              <div className="nav-profile-menu">
                <Link to="/profile" className="nav-profile-menu-item">
                  <FiUser />
                  <span>Profile Settings</span>
                </Link>
                <button onClick={handleLogout} className="nav-profile-menu-item logout">
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content-dark">{children}</main>

      {/* Footer */}
      <footer className="footer-dark">
        <div className="footer-container-dark">
          <div className="footer-grid-dark">
            <div className="footer-brand-dark">
              <img src={logoMark} alt="JAPA" className="footer-logo-dark" />
              <p className="footer-tagline-dark">
                Making migration accessible, organized, and achievable for everyone.
              </p>
              <div className="footer-social-dark">
                <a href="#" aria-label="Twitter" className="social-btn-dark">
                  <FaXTwitter />
                </a>
                <a href="#" aria-label="LinkedIn" className="social-btn-dark">
                  <FaLinkedinIn />
                </a>
                <a href="#" aria-label="Instagram" className="social-btn-dark">
                  <FaInstagram />
                </a>
              </div>
            </div>

            <div className="footer-links-group-dark">
              <h4>Navigation</h4>
              <Link to="/home">Home</Link>
              <Link to="/recommendation">Get Recommendation</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/documents">Documents</Link>
            </div>

            <div className="footer-links-group-dark">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <Link to="/faq">FAQ</Link>
              <a href="#">Contact Us</a>
              <a href="#">Privacy Policy</a>
            </div>

            <div className="footer-links-group-dark">
              <h4>Contact</h4>
              <a href="mailto:support@japa.com" className="footer-contact-item-dark">
                <FiMail />
                <span>support@japa.com</span>
              </a>
              <a href="#" className="footer-contact-item-dark">
                <FiMapPin />
                <span>Global • Remote-first</span>
              </a>
            </div>
          </div>

          <div className="footer-bottom-dark">
            <p>© {new Date().getFullYear()} JAPA. All rights reserved.</p>
            <div className="footer-legal-dark">
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
