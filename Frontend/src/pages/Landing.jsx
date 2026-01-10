import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  FiArrowRight,
  FiCheck,
  FiGlobe,
  FiClock,
  FiShield,
  FiMail,
  FiMapPin,
  FiUsers,
  FiBriefcase,
  FiZap,
  FiLock,
  FiStar,
  FiFileText,
  FiTarget,
  FiCompass,
  FiAward,
} from "react-icons/fi";
import { FaXTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa6";
import logoMark from "../assets/japa-logo.png";
import "./Landing.css";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const AnimatedSection = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/recommendation");
    } else {
      navigate("/register");
    }
  };

  const features = [
    {
      icon: FiCompass,
      title: "Pathway Discovery",
      description: "AI analyzes your profile to reveal realistic visa routes you never knew existed.",
      accent: "coral"
    },
    {
      icon: FiTarget,
      title: "Smart Matching",
      description: "Get personalized recommendations based on 50+ eligibility factors.",
      accent: "mint"
    },
    {
      icon: FiFileText,
      title: "Document Mastery",
      description: "Never miss a document. Track, organize, and prepare with precision.",
      accent: "lavender"
    },
    {
      icon: FiClock,
      title: "Timeline Intelligence",
      description: "Automated reminders and milestones keep your journey on track.",
      accent: "amber"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Build Your Profile",
      description: "Share your background, skills, and migration goals in our intelligent questionnaire."
    },
    {
      number: "02",
      title: "Get Matched",
      description: "Our AI cross-references your profile against global visa programs to find your best options."
    },
    {
      number: "03",
      title: "Plan Your Journey",
      description: "Receive a personalized roadmap with checklists, timelines, and expert guidance."
    },
    {
      number: "04",
      title: "Move Forward",
      description: "Execute your plan with confidence, supported by tools and resources at every step."
    }
  ];

  const audiences = [
    { icon: FiUsers, label: "Students", desc: "Study abroad pathways" },
    { icon: FiBriefcase, label: "Professionals", desc: "Work visa routes" },
    { icon: FiZap, label: "Entrepreneurs", desc: "Business immigration" },
    { icon: FiGlobe, label: "Families", desc: "Family sponsorship" },
    { icon: FiAward, label: "Talent", desc: "Exceptional ability" },
    { icon: FiCompass, label: "Explorers", desc: "Digital nomad visas" }
  ];

  const trustItems = [
    { icon: FiShield, title: "Not Legal Advice", desc: "Guidance & structure, not representation" },
    { icon: FiLock, title: "Privacy First", desc: "Your data stays secure and private" },
    { icon: FiStar, title: "No Guarantees", desc: "We inform, you decide" },
    { icon: FiCheck, title: "Full Transparency", desc: "Clear about what we can and can't do" }
  ];

  return (
    <div className="landing-redesign">
      {/* Ambient Background */}
      <div className="ambient-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="noise-overlay"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        className="nav-glass"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <img src={logoMark} alt="JAPA" className="nav-logo-img" />
          </Link>
          <div className="nav-links">
            <Link to="/services" className="nav-link">Services</Link>
            {isAuthenticated ? (
              <Link to="/home" className="nav-cta">
                <span>Dashboard</span>
                <FiArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">Sign in</Link>
                <button onClick={handleGetStarted} className="nav-cta">
                  <span>Get Started</span>
                  <FiArrowRight />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <motion.div 
          className="hero-content"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="badge-dot"></span>
            <span>AI-Powered Migration Assistant</span>
          </motion.div>
          
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Navigate your
            <span className="title-gradient"> migration journey </span>
            with clarity
          </motion.h1>
          
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Stop guessing. Start moving. JAPA analyzes your profile and maps 
            personalized visa pathways — so you know exactly what to do next.
          </motion.p>
          
          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <button onClick={handleGetStarted} className="btn-primary-hero">
              <span>Start Free Assessment</span>
              <FiArrowRight className="btn-icon" />
            </button>
            <a href="#how-it-works" className="btn-secondary-hero">
              <span>See How It Works</span>
            </a>
          </motion.div>

          <motion.div 
            className="hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <div className="stat-item">
              <span className="stat-number">195+</span>
              <span className="stat-label">Countries Covered</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Visa Programs</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">AI Assistance</span>
            </div>
          </motion.div>
        </motion.div>

        <div className="hero-scroll-hint">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="scroll-indicator"
          >
            <span>Scroll to explore</span>
            <div className="scroll-line"></div>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="section-dark">
        <div className="container">
          <AnimatedSection>
            <div className="problem-grid">
              <div className="problem-text">
                <span className="section-label">The Challenge</span>
                <h2 className="section-heading">
                  Migration is complex.<br/>
                  <span className="text-muted">Information shouldn't be.</span>
                </h2>
                <p className="section-body">
                  Unclear requirements. Conflicting advice. Scattered documents. 
                  Most people don't fail because they're unqualified — they fail 
                  because the process is impossible to navigate alone.
                </p>
                <p className="section-body accent-text">
                  JAPA exists to change that.
                </p>
              </div>
              <div className="problem-visual">
                <div className="visual-card card-1">
                  <FiGlobe />
                  <span>Complex Requirements</span>
                </div>
                <div className="visual-card card-2">
                  <FiFileText />
                  <span>Scattered Documents</span>
                </div>
                <div className="visual-card card-3">
                  <FiClock />
                  <span>Missed Deadlines</span>
                </div>
                <div className="visual-card card-solution">
                  <FiZap />
                  <span>JAPA Solves This</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="section-features" id="features">
        <div className="container">
          <AnimatedSection>
            <span className="section-label center">What JAPA Does</span>
            <h2 className="section-heading center">
              Your personal migration<br/>command center
            </h2>
          </AnimatedSection>
          
          <motion.div 
            className="bento-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`bento-card bento-card-${feature.accent}`}
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className="bento-icon">
                  <feature.icon />
                </div>
                <h3 className="bento-title">{feature.title}</h3>
                <p className="bento-desc">{feature.description}</p>
                <div className={`bento-glow glow-${feature.accent}`}></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-steps" id="how-it-works">
        <div className="container">
          <AnimatedSection>
            <span className="section-label center">The Process</span>
            <h2 className="section-heading center">
              Four steps to<br/>migration clarity
            </h2>
          </AnimatedSection>

          <div className="steps-timeline">
            {steps.map((step, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="step-card">
                  <div className="step-number">{step.number}</div>
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-desc">{step.description}</p>
                  </div>
                  {index === 0 && (
                    <button onClick={handleGetStarted} className="step-cta">
                      Start Now <FiArrowRight />
                    </button>
                  )}
                </div>
              </AnimatedSection>
            ))}
            <div className="timeline-line"></div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="section-audience">
        <div className="container">
          <AnimatedSection>
            <span className="section-label center">Built For</span>
            <h2 className="section-heading center">
              Wherever you're going,<br/>whatever your story
            </h2>
          </AnimatedSection>

          <motion.div 
            className="audience-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {audiences.map((item, index) => (
              <motion.div
                key={index}
                className="audience-card"
                variants={fadeInUp}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <div className="audience-icon">
                  <item.icon />
                </div>
                <span className="audience-label">{item.label}</span>
                <span className="audience-desc">{item.desc}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section-trust">
        <div className="container">
          <AnimatedSection>
            <div className="trust-content">
              <div className="trust-header">
                <span className="section-label">Our Promise</span>
                <h2 className="section-heading">
                  Transparent about<br/>what we do
                </h2>
                <p className="trust-intro">
                  JAPA helps you prepare and organize — but we're not lawyers, 
                  and we don't guarantee outcomes. Here's exactly what to expect.
                </p>
              </div>

              <div className="trust-grid">
                {trustItems.map((item, index) => (
                  <div key={index} className="trust-card">
                    <div className="trust-icon">
                      <item.icon />
                    </div>
                    <div className="trust-text">
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-cta">
        <div className="container">
          <AnimatedSection>
            <div className="cta-box">
              <div className="cta-glow"></div>
              <h2 className="cta-heading">
                Ready to start your<br/>migration journey?
              </h2>
              <p className="cta-text">
                Join thousands navigating their path with clarity. No credit card required.
              </p>
              <button onClick={handleGetStarted} className="cta-button">
                <span>Get Started Free</span>
                <FiArrowRight />
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-modern">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src={logoMark} alt="JAPA" className="footer-logo" />
              <p className="footer-tagline">
                Making migration accessible, organized, and achievable for everyone.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Twitter" className="social-btn">
                  <FaXTwitter />
                </a>
                <a href="#" aria-label="LinkedIn" className="social-btn">
                  <FaLinkedinIn />
                </a>
                <a href="#" aria-label="Instagram" className="social-btn">
                  <FaInstagram />
                </a>
              </div>
            </div>

            <div className="footer-links-group">
              <h4>Product</h4>
              <Link to="/services">Services</Link>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <Link to="/faq">FAQ</Link>
            </div>

            <div className="footer-links-group">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>

            <div className="footer-links-group">
              <h4>Get in Touch</h4>
              <a href="mailto:support@japa.com" className="footer-contact-item">
                <FiMail />
                <span>support@japa.com</span>
              </a>
              <a href="#" className="footer-contact-item">
                <FiMapPin />
                <span>Global • Remote-first</span>
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} JAPA. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
