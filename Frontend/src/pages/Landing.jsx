import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiCheckCircle,
  FiGlobe,
  FiClock,
  FiShield,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGithub,
  FiTwitter,
  FiLinkedin,
  FiInstagram,
  FiUsers,
  FiBriefcase,
  FiZap,
  FiSmile,
  FiLock,
  FiStar,
} from "react-icons/fi";
import { initScrollAnimations } from "../utils/scrollAnimation";
import "./Landing.css";

function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    initScrollAnimations();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/recommendation");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-container container">
          <Link to="/" className="logo">
            <span className="logo-icon">✈</span>
            <span className="logo-text">JAPA</span>
          </Link>
          <div className="landing-nav-links">
            {isAuthenticated ? (
              <Link to="/home" className="btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-link-text">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content container">
          <div className="hero-panel">
            <h1 className="hero-title">
              Immigration, Done Right.
              <br />
              <span>For People Like You.</span>
            </h1>
            <p className="hero-subtitle">
              Japa is an AI-powered immigration support platform helping
              migrants, students, and families find the best visa path -
              clearly, quickly, and affordably.
            </p>
            <div className="hero-actions">
              <button onClick={handleGetStarted} className="btn-hero">
                Get Your Visa Match
              </button>
            </div>
          </div>
          <div className="hero-scroll-indicator">
            <a className="scroll-link" href="#how-we-help">
              <span>See How It Works</span>
              <span className="arrow-down" aria-hidden="true">
                ↓
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="why-we-exist">
        <div className="container">
          <h2 className="section-title underline">Why We Exist</h2>
          <div className="mission-box">
            <p>
              Immigration shouldn't be a maze of confusion, costly mistakes, and
              misinformation. Our <strong>AI immigration platform</strong> was
              born from the real-world challenges faced by millions seeking{" "}
              <strong>visa options</strong> and{" "}
              <strong>trusted immigration services</strong>. We recognized the
              need for a transparent, technology-driven solution that puts users
              first.
            </p>
          </div>
        </div>
      </section>

      <section className="how-we-help" id="how-we-help">
        <div className="container">
          <h2 className="section-title underline">How We Help</h2>
          <p className="section-subtitle">
            Our platform combines AI intelligence with human expertise to guide
            your immigration journey
          </p>
          <div className="features-grid">
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiZap />
              </div>
              <h3>Smart Matching</h3>
              <p>
                Our AI guides you to visa paths that fit your real profile and
                goals.
              </p>
            </div>
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Verified Experts</h3>
              <p>
                Connect with qualified professionals who understand your
                specific needs.
              </p>
            </div>
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiLock />
              </div>
              <h3>Full Privacy</h3>
              <p>
                Your data is secure and encrypted. We never sell or exploit your
                information.
              </p>
            </div>
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiSmile />
              </div>
              <h3>Seamless Experience</h3>
              <p>
                Manage documents and track progress in one simple, clean
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="unique-features">
        <div className="container">
          <h2 className="section-title underline">What Makes Japa Unique</h2>
          <p className="section-subtitle">
            Our platform combines cutting-edge technology with human expertise
            to deliver unmatched immigration support
          </p>
          <div className="checklist-box glass-light">
            <ul className="checklist">
              <li>
                <FiCheckCircle className="check-icon" /> AI-powered visa pathway
                engine
              </li>
              <li>
                <FiCheckCircle className="check-icon" /> Verified immigration
                experts, not agencies
              </li>
              <li>
                <FiCheckCircle className="check-icon" /> Personalized relocation
                services (SIM, housing, etc.)
              </li>
              <li>
                <FiCheckCircle className="check-icon" /> Available in multiple
                languages
              </li>
              <li>
                <FiCheckCircle className="check-icon" /> Secure, data-driven
                platform
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="who-we-serve">
        <div className="container">
          <h2 className="section-title underline">Who We Serve</h2>
          <p className="section-subtitle">
            Supporting diverse communities on their immigration journey
          </p>
          <div className="serve-grid">
            <div className="serve-card">
              <div className="serve-icon">
                <FiGlobe />
              </div>
              <h3>First-time Immigrants</h3>
              <p>
                Students, skilled workers, and families taking their first steps
                toward a new country.
              </p>
            </div>
            <div className="serve-card">
              <div className="serve-icon">
                <FiUsers />
              </div>
              <h3>People Already Abroad</h3>
              <p>
                Those seeking status changes, renewals, or exploring new visa
                pathways.
              </p>
            </div>
            <div className="serve-card">
              <div className="serve-icon">
                <FiBriefcase />
              </div>
              <h3>Service Providers</h3>
              <p>
                Immigration professionals and legal experts serving their
                clients better.
              </p>
            </div>
          </div>
          <div className="serve-tags-box glass-light">
            <p>
              Japa serves students, skilled workers, entrepreneurs, and families
              from 80+ countries.
            </p>
            <div className="serve-tags">
              <span className="tag">Students</span>
              <span className="tag">Skilled Workers</span>
              <span className="tag">Entrepreneurs</span>
              <span className="tag">Job Seekers</span>
              <span className="tag">Families</span>
            </div>
          </div>
        </div>
      </section>

      <section className="vision">
        <div className="container">
          <h2 className="section-title white underline">
            Our Vision for the Future
          </h2>
          <p className="section-subtitle white">
            We believe the future of immigration is ethical, data-driven, and
            human-first.
          </p>
          <div className="vision-grid">
            <div className="vision-item">
              <div className="vision-icon">
                <FiGlobe />
              </div>
              <h4>Global Expansion</h4>
              <p>Serving immigration needs worldwide</p>
            </div>
            <div className="vision-item">
              <div className="vision-icon">
                <FiZap />
              </div>
              <h4>End-to-End Automation</h4>
              <p>Streamlining every step of the process</p>
            </div>
            <div className="vision-item">
              <div className="vision-icon">
                <FiBriefcase />
              </div>
              <h4>Career Ecosystem</h4>
              <p>Connecting opportunities with pathways</p>
            </div>
          </div>
        </div>
      </section>

      <section className="trust">
        <div className="container">
          <h2 className="section-title underline">A Platform You Can Trust</h2>
          <p className="section-subtitle">
            Your journey deserves the highest standards of security and
            transparency
          </p>
          <div className="trust-box glass-light">
            <div className="trust-grid">
              <div className="trust-item">
                <FiShield className="trust-icon" />
                <div>
                  <h4>Verified Experts</h4>
                  <p>Top immigration professionals</p>
                </div>
              </div>
              <div className="trust-item">
                <FiLock className="trust-icon" />
                <div>
                  <h4>Secure & Encrypted</h4>
                  <p>Full data protection</p>
                </div>
              </div>
              <div className="trust-item">
                <FiStar className="trust-icon" />
                <div>
                  <h4>Transparent Process</h4>
                  <p>No hidden fees or surprises</p>
                </div>
              </div>
              <div className="trust-item">
                <FiUsers className="trust-icon" />
                <div>
                  <h4>5-Star Reviews</h4>
                  <p>From users in 70+ countries</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-bottom">
        <div className="container">
          <h2 className="section-title white">
            You're Not Alone in This Journey
          </h2>
          <p className="section-subtitle white">
            Japa helps you move from questions to action with personalized
            guidance.
          </p>
          <button onClick={handleGetStarted} className="btn-hero">
            Get Your Visa Match →
          </button>
        </div>
      </section>

      <footer className="landing-footer scroll-animate">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section scroll-animate scroll-animate-delay-1">
              <h3 className="footer-logo">
                <span className="logo-icon">✈</span>
                <span className="logo-text">JAPA</span>
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
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Sign Up</Link>
                </li>
                {isAuthenticated && (
                  <li>
                    <Link to="/home">Dashboard</Link>
                  </li>
                )}
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

export default Landing;
