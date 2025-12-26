import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiUser,
  FiFileText,
  FiCheckSquare,
  FiLogOut,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGithub,
  FiTwitter,
  FiLinkedin,
  FiInstagram,
} from "react-icons/fi";
import { initScrollAnimationsForElement } from "../utils/scrollAnimation";
import logoMark from "../assets/japa-logo.png";
import "./Layout.css";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (footer) {
      initScrollAnimationsForElement(footer);
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/home" className="logo">
            <img className="logo-mark" src={logoMark} alt="JAPA logo" />
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
      <main className="main-content">{children}</main>
      <footer className="footer scroll-animate">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section scroll-animate scroll-animate-delay-1">
              <h3 className="footer-logo">
                <img className="logo-mark" src={logoMark} alt="JAPA logo" />
              </h3>
              <p className="footer-description">
                Your trusted partner for seamless visa applications. Get
                personalized recommendations and track your progress with ease.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Twitter">
                  <FiTwitter />
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <FiLinkedin />
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <FiInstagram />
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <FiGithub />
                </a>
              </div>
            </div>

            <div className="footer-section scroll-animate scroll-animate-delay-2">
              <h4 className="footer-title">Quick Links</h4>
              <ul className="footer-links">
                <li>
                  <Link to="/home">Home</Link>
                </li>
                <li>
                  <Link to="/recommendation">Get Recommendation</Link>
                </li>
                <li>
                  <Link to="/documents">Documents</Link>
                </li>
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
              </ul>
            </div>

            <div className="footer-section scroll-animate scroll-animate-delay-3">
              <h4 className="footer-title">Support</h4>
              <ul className="footer-links">
                <li>
                  <a href="#">Help Center</a>
                </li>
                <li>
                  <a href="#">FAQ</a>
                </li>
                <li>
                  <a href="#">Contact Us</a>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
              </ul>
            </div>

            <div className="footer-section scroll-animate scroll-animate-delay-4">
              <h4 className="footer-title">Contact</h4>
              <ul className="footer-contact">
                <li>
                  <FiMail />
                  <span>support@japa.com</span>
                </li>
                <li>
                  <FiPhone />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li>
                  <FiMapPin />
                  <span>123 Travel Street, Global City</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom scroll-animate scroll-animate-delay-5">
            <p>&copy; {new Date().getFullYear()} Japa. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#">Terms of Service</a>
              <span>•</span>
              <a href="#">Privacy Policy</a>
              <span>•</span>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
