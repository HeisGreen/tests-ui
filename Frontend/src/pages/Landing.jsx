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
import logoMark from "../assets/japa-logo.png";
import heroVideo from "../assets/japa-bg.mp4";
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

  const howWorksSteps = [
    {
      id: 1,
      title: "Build your migration profile",
      description:
        "Share your nationality, education, work history, finances, and goals so we can recommend the right pathways.",
      icon: FiUsers,
      cta: "Get started",
    },
    {
      id: 2,
      title: "Discover your migration pathways",
      description:
        "JAPA analyzes your profile and recommends realistic visa and immigration options, including side-by-side alternatives.",
      icon: FiGlobe,
    },
    {
      id: 3,
      title: "Follow a guided migration plan",
      description:
        "Receive checklists, document reminders, timelines, and AI guidance for every milestone.",
      icon: FiClock,
    },
    {
      id: 4,
      title: "Prepare for interviews and decisions",
      description:
        "From applications to embassy interviews, JAPA helps you stay ready and confident.",
      icon: FiStar,
    },
  ];

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-container container">
          <Link to="/" className="logo">
            <img className="logo-mark" src={logoMark} alt="JAPA logo" />
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
        <video className="hero-video" autoPlay loop muted playsInline>
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content container">
          <div className="hero-panel">
            <h1 className="hero-title">
              Navigate migration with <span>clarity</span>, not confusion.
            </h1>
            <p className="hero-subtitle">
              JAPA is an AI-powered migration assistant that guides you through
              visas, documents, interviews, and immigration pathways — step by
              step.
            </p>
            <div className="hero-actions">
              <button onClick={handleGetStarted} className="btn-hero">
                Get started for free
              </button>
            </div>
          </div>
          <div className="hero-scroll-indicator">
            <a className="scroll-link" href="#how-japa-works">
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
          <h2 className="section-title underline">
            Migration is complex. The information shouldn’t be.
          </h2>
          <div className="mission-box">
            <div className="mission-copy">
              <p>
                Migrating to another country often means unclear requirements,
                conflicting advice, scattered documents, and costly mistakes.
                Many people don’t fail because they’re unqualified — they fail
                because the migration process is hard to navigate.
              </p>
              <p>
                <strong>JAPA exists</strong> to bring structure and clarity to
                migration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-we-help" id="what-is-japa">
        <div className="container">
          <h2 className="section-title underline">What is JAPA?</h2>
          <p className="section-subtitle">
            JAPA is your personal AI migration guide.
          </p>
          <div className="features-grid">
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiZap />
              </div>
              <h3>Your personal guide</h3>
              <p>
                It helps you understand where you qualify, how to apply, and
                what to do next — without endless Googling, guesswork, or
                confusion.
              </p>
            </div>
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiCheckCircle />
              </div>
              <h3>Prepare & organize</h3>
              <p>
                JAPA helps you prepare, organize, and navigate migration
                properly with checklists, tasks, and guidance.
              </p>
            </div>
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Not a replacement for lawyers</h3>
              <p>
                JAPA does not replace immigration lawyers or governments. It
                supports you with structure and clarity when legal judgment
                isn’t required.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="unique-features" id="how-japa-works">
        <div className="container">
          <h2 className="section-title underline">How JAPA works</h2>
          <p className="section-subtitle">
            A guided, step-by-step flow — from profile to pathway to plan.
          </p>
          <div className="how-works-flow">
            {howWorksSteps.map((step) => {
              const IconComponent = step.icon;

              return (
                <div
                  key={step.id}
                  className="feature-card how-works-step scroll-animate"
                >
                  <span className="step-pill">Step {step.id}</span>
                  <div className="feature-icon">
                    <IconComponent />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {step.cta && (
                    <button
                      type="button"
                      className="step-cta"
                      onClick={handleGetStarted}
                    >
                      {step.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="who-we-serve">
        <div className="container">
          <h2 className="section-title underline">
            Everything you need to navigate migration — in one place
          </h2>
          <p className="section-subtitle">
            Tools that keep you clear, organized, and moving forward.
          </p>
          <div className="features-grid">
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiGlobe />
              </div>
              <h3>AI Migration Pathway Matching</h3>
              <p>
                Personalized visa and immigration routes based on your
                background.
              </p>
            </div>
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiCheckCircle />
              </div>
              <h3>Smart Document Management</h3>
              <p>
                Country-specific document checklists with deadline tracking.
              </p>
            </div>
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiSmile />
              </div>
              <h3>AI Application & Interview Coaching</h3>
              <p>Help with SOPs, forms, and immigration interviews.</p>
            </div>
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiClock />
              </div>
              <h3>Task & Timeline Tracking</h3>
              <p>Clear milestones so you always know what to do next.</p>
            </div>
            <div className="feature-card scroll-animate">
              <div className="feature-icon">
                <FiBriefcase />
              </div>
              <h3>Expert & Lawyer Connections (Optional)</h3>
              <p>
                Access verified professionals when legal judgment is required.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="vision">
        <div className="container">
          <h2 className="section-title white underline">
            Who JAPA is built for
          </h2>
          <p className="section-subtitle white">
            JAPA is global by design — built for real people navigating real
            migration journeys.
          </p>
          <div className="vision-grid">
            <div className="vision-item">
              <div className="vision-icon">
                <FiUsers />
              </div>
              <h4>Students</h4>
              <p>Planning study routes and transitions</p>
            </div>
            <div className="vision-item">
              <div className="vision-icon">
                <FiBriefcase />
              </div>
              <h4>Skilled workers</h4>
              <p>Finding realistic work and residency pathways</p>
            </div>
            <div className="vision-item">
              <div className="vision-icon">
                <FiZap />
              </div>
              <h4>Founders & freelancers</h4>
              <p>Navigating business, talent, and relocation options</p>
            </div>
            <div className="vision-item">
              <div className="vision-icon">
                <FiGlobe />
              </div>
              <h4>Families</h4>
              <p>Organizing dependents, documents, and timelines</p>
            </div>
            <div className="vision-item">
              <div className="vision-icon">
                <FiClock />
              </div>
              <h4>Status changes</h4>
              <p>Renewals, switches, and in-country processes</p>
            </div>
            <div className="vision-item">
              <div className="vision-icon">
                <FiMapPin />
              </div>
              <h4>Anyone migrating</h4>
              <p>From one country to another — step by step</p>
            </div>
          </div>
        </div>
      </section>

      <section className="why-different">
        <div className="container">
          <h2 className="section-title underline">
            Built for real migration journeys
          </h2>
          <p className="section-subtitle">
            Most tools stop at eligibility checks or generic advice. JAPA guides
            you through the entire migration process — from understanding your
            options to preparing strong applications.
          </p>
          <div className="checklist-box">
            <ul className="checklist">
              <li>
                <FiCheckCircle className="check-icon" />
                It’s not about shortcuts.
              </li>
              <li>
                <FiCheckCircle className="check-icon" />
                It’s about doing migration right.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="trust">
        <div className="container">
          <h2 className="section-title underline">Trust & transparency</h2>
          <p className="section-subtitle">
            Clear boundaries. Clear expectations.
          </p>
          <div className="trust-box">
            <div className="trust-grid">
              <div className="trust-item">
                <FiShield className="trust-icon" />
                <div>
                  <h4>No legal advice</h4>
                  <p>Guidance and organization, not legal representation</p>
                </div>
              </div>
              <div className="trust-item">
                <FiLock className="trust-icon" />
                <div>
                  <h4>Privacy-first</h4>
                  <p>Secure handling of your information</p>
                </div>
              </div>
              <div className="trust-item">
                <FiStar className="trust-icon" />
                <div>
                  <h4>No guarantees</h4>
                  <p>We don’t guarantee visa approvals</p>
                </div>
              </div>
              <div className="trust-item">
                <FiUsers className="trust-icon" />
                <div>
                  <h4>Informed decisions</h4>
                  <p>Clarity so you can act with confidence</p>
                </div>
              </div>
            </div>
            <p className="trust-disclaimer">
              JAPA does not provide legal advice and does not guarantee visa
              approvals. It helps users make informed decisions, stay organized,
              and prepare thoroughly throughout the migration process.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-bottom">
        <div className="container">
          <h2 className="section-title white">
            Start your migration journey with confidence.
          </h2>
          <p className="section-subtitle white">
            No guesswork. No chaos. Just clarity.
          </p>
          <button onClick={handleGetStarted} className="btn-hero">
            Get started for free →
          </button>
          <p className="cta-note">No credit card required.</p>
        </div>
      </section>

      <footer className="landing-footer scroll-animate">
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
                  <Link to="/faq">FAQ</Link>
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
