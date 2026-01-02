import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiGlobe,
  FiClock,
  FiBriefcase,
  FiSmile,
} from "react-icons/fi";
import logoMark from "../assets/japa-logo.png";
import { services } from "../data/services";
import "./Services.css";

function Services() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const iconMap = {
    FiGlobe,
    FiCheckCircle,
    FiClock,
    FiBriefcase,
    FiSmile,
  };

  return (
    <div className="services-page">
      <nav className="services-nav">
        <div className="services-nav-container">
          <Link to="/" className="services-logo">
            <img className="logo-mark" src={logoMark} alt="JAPA logo" />
          </Link>
          <div className="services-nav-actions">
            <Link to="/login" className="nav-link-text">
              Log in
            </Link>
            <Link to="/register" className="btn-primary">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <header className="services-hero">
        <div className="services-hero-inner">
          <h1>Services</h1>
          <p>
            Everything you need to navigate migration — in one place. Some
            features are still coming soon.
          </p>
          <div className="services-hero-actions">
            <Link to="/register" className="btn-primary">
              Create free account
            </Link>
            <Link to="/" className="btn-secondary">
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="services-content">
        <div className="services-grid">
          {services.map((service) => {
            const IconComponent = iconMap[service.icon] || FiCheckCircle;
            const badgeLabel =
              service.status === "available" ? "Available" : "Coming soon";

            return (
              <div key={service.id} className="services-card">
                <span
                  className={`service-badge service-badge--${service.status}`}
                >
                  {badgeLabel}
                </span>
                <div className="services-icon">
                  <IconComponent />
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <div className="services-detail">
                  <div className="services-detail-block">
                    <h4>Who it’s for</h4>
                    <p>{service.whoItsFor}</p>
                  </div>
                  <div className="services-detail-block">
                    <h4>What you get</h4>
                    <ul>
                      {(service.whatYouGet || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="services-detail-block">
                    <h4>Example output</h4>
                    <p className="services-example">{service.exampleOutput}</p>
                  </div>
                </div>
                <div className="services-card-actions">
                  <Link to="/register" className="btn-primary">
                    Sign up
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default Services;
