import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { recommendationsAPI } from "../utils/api";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiFileText,
} from "react-icons/fi";
import { initScrollAnimations } from "../utils/scrollAnimation";
import "./Home.css";

function Home() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latest, setLatest] = useState(null); // latest RecommendationRecord
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    initScrollAnimations();
  }, []);

  const options = useMemo(() => {
    const out = latest?.output_data;
    const opts = out?.options;
    return Array.isArray(opts) ? opts : [];
  }, [latest]);

  useEffect(() => {
    // When cards load dynamically, re-init scroll animations.
    if (!options.length) return;
    initScrollAnimations();
  }, [options.length]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        setLoading(true);

        // Pull recent stored recommendations for this user.
        // This uses the real, persisted database data (not dummy data).
        const history = await recommendationsAPI.getHistory(20);
        if (cancelled) return;

        setHistoryCount(history.length);
        setLatest(history[0] || null);
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading recommendation history:", err);
        setError(err.message || "Failed to load recommendations");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const getVisaStateText = (visa) => {
    const raw = visa?.state ?? visa?.status ?? visa?.likelihood ?? "";
    return String(raw).trim();
  };

  const getVisaStateLabel = (visa) => {
    const text = getVisaStateText(visa);
    if (!text) return "Possible";
    return text
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getVisaStateColor = (visa) => {
    const l = getVisaStateText(visa).toLowerCase();
    if (
      l.includes("approved") ||
      l.includes("granted") ||
      l.includes("eligible") ||
      l.includes("high") ||
      l.includes("strong") ||
      l.includes("good")
    ) {
      return "#22C55E"; // green
    }
    if (
      l.includes("denied") ||
      l.includes("rejected") ||
      l.includes("refused") ||
      l.includes("not_eligible") ||
      l.includes("ineligible") ||
      l.includes("not eligible")
    ) {
      return "#EF4444"; // red
    }
    if (
      l.includes("pending") ||
      l.includes("in_review") ||
      l.includes("in review") ||
      l.includes("review") ||
      l.includes("processing") ||
      l.includes("awaiting")
    ) {
      return "#F59E0B"; // amber
    }
    if (
      l.includes("unlikely") ||
      l.includes("low") ||
      l.includes("challenging")
    ) {
      return "#8B5CF6"; // violet
    }
    if (
      l.includes("possible") ||
      l.includes("medium") ||
      l.includes("moderate") ||
      (l.includes("likely") && !l.includes("unlikely"))
    ) {
      return "#3B82F6"; // blue
    }
    return "#64748B"; // slate
  };

  const getStateIcon = (visa) => {
    const l = getVisaStateText(visa).toLowerCase();
    if (
      l.includes("approved") ||
      l.includes("granted") ||
      l.includes("eligible") ||
      l.includes("high") ||
      l.includes("strong") ||
      l.includes("good")
    )
      return <FiCheckCircle />;
    if (
      l.includes("pending") ||
      l.includes("in_review") ||
      l.includes("in review") ||
      l.includes("review") ||
      l.includes("processing") ||
      l.includes("awaiting")
    )
      return <FiClock />;
    if (
      l.includes("denied") ||
      l.includes("rejected") ||
      l.includes("refused") ||
      l.includes("not_eligible") ||
      l.includes("ineligible") ||
      l.includes("not eligible")
    )
      return <FiAlertCircle />;
    return <FiFileText />;
  };

  return (
    <div className="home">
      <div className="home-header">
        <h1>Welcome back, {user?.name || "User"}!</h1>
        <p>Here's an overview of your visa applications and recommendations</p>
      </div>

      <div className="home-stats">
        <div className="stat-card scroll-animate scroll-animate-delay-1">
          <div className="stat-value">{historyCount}</div>
          <div className="stat-label">Saved Recommendations</div>
        </div>
        <div className="stat-card scroll-animate scroll-animate-delay-2">
          <div className="stat-value">{options.length}</div>
          <div className="stat-label">Latest Options</div>
        </div>
        <div className="stat-card scroll-animate scroll-animate-delay-3">
          <div className="stat-value">
            {latest?.created_at
              ? new Date(latest.created_at).toLocaleDateString()
              : "—"}
          </div>
          <div className="stat-label">Last Generated</div>
        </div>
      </div>

      <div className="home-section">
        <div className="section-header">
          <h2>Your Recommendations</h2>
          <Link to="/recommendation" className="link-primary">
            Get New Recommendation <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading your recommendations…</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p>{error}</p>
            <Link to="/recommendation" className="btn-primary">
              Open Recommendations
            </Link>
          </div>
        ) : options.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any recommendations yet.</p>
            <Link to="/recommendation" className="btn-primary">
              Get Your First Recommendation
            </Link>
          </div>
        ) : (
          <div className="recommendations-grid">
            {options.slice(0, 6).map((visa, index) => {
              return (
                <div
                  key={`${visa.visa_type}-${index}`}
                  className={`recommendation-card scroll-animate scroll-animate-delay-${
                    (index % 3) + 1
                  }`}
                >
                  <div className="card-header">
                    <div>
                      <h3>{visa.visa_type || "Visa option"}</h3>
                      <p className="card-subtitle">
                        {latest?.output_data?.summary ||
                          "Personalized based on your profile"}
                      </p>
                    </div>
                    <div
                      className="status-badge"
                      style={{ color: getVisaStateColor(visa) }}
                    >
                      {getStateIcon(visa)}
                      <span>{getVisaStateLabel(visa)}</span>
                    </div>
                  </div>

                  <div className="card-info">
                    <div className="info-item">
                      <span className="info-label">Processing Time:</span>
                      <span className="info-value">
                        {visa.estimated_timeline || "—"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estimated Cost:</span>
                      <span className="info-value">
                        {visa.estimated_costs || "—"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Next Step:</span>
                      <span className="info-value">
                        {Array.isArray(visa.next_steps) &&
                        visa.next_steps.length > 0
                          ? visa.next_steps[0]
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/checklist/${encodeURIComponent(
                      visa.visa_type || "visa"
                    )}`}
                    state={{ visaOption: visa }}
                    className="btn-card-action"
                  >
                    View Checklist <FiArrowRight />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="home-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <Link to="/recommendation" className="action-card">
            <div className="action-icon blue">
              <FiFileText />
            </div>
            <h3>Get Recommendation</h3>
            <p>Find the best visa options for you</p>
          </Link>
          <Link to="/documents" className="action-card">
            <div className="action-icon purple">
              <FiFileText />
            </div>
            <h3>Manage Documents</h3>
            <p>Upload and organize your visa documents</p>
          </Link>
          <Link to="/profile" className="action-card">
            <div className="action-icon teal">
              <FiCheckCircle />
            </div>
            <h3>Update Profile</h3>
            <p>Keep your information up to date</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
