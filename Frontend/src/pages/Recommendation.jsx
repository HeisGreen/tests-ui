import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { recommendationsAPI } from "../utils/api";
import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiArrowRight,
  FiStar,
  FiRefreshCw,
  FiAlertCircle,
  FiZap,
  FiDatabase,
} from "react-icons/fi";
import { initScrollAnimations } from "../utils/scrollAnimation";
import "./Recommendation.css";

function Recommendation() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [useCached, setUseCached] = useState(true); // Toggle state
  const scrollObserverRef = useRef(null);
  const navigate = useNavigate();

  const options = Array.isArray(recommendations?.options)
    ? recommendations.options
    : [];

  const fetchRecommendations = async (cached) => {
    try {
      setError(null);
      setLoading(true);
      if (!cached) {
        setRefreshing(true);
      }
      const data = await recommendationsAPI.getRecommendations(cached);
      setRecommendations(data);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initialize scroll animations for elements rendered on mount.
    scrollObserverRef.current?.disconnect?.();
    scrollObserverRef.current = initScrollAnimations();

    return () => {
      scrollObserverRef.current?.disconnect?.();
      scrollObserverRef.current = null;
    };
  }, []);

  useEffect(() => {
    // When recommendations load dynamically, re-init scroll animations so the new
    // `.scroll-animate` cards become visible (otherwise they stay opacity: 0).
    if (!options.length) return;
    scrollObserverRef.current?.disconnect?.();
    scrollObserverRef.current = initScrollAnimations();
  }, [options.length]);

  const handleViewChecklist = (visaType) => {
    navigate(`/checklist/${encodeURIComponent(visaType)}`);
  };

  const handleFetch = () => {
    fetchRecommendations(useCached);
  };

  const getVisaStateText = (visa) => {
    const raw = visa?.state ?? visa?.status ?? visa?.likelihood ?? "";
    return String(raw).trim();
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
      // Positive / high confidence
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
      // Negative
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
      // Uncertain but active (waiting on decision)
      return "#F59E0B"; // amber
    }
    if (
      l.includes("unlikely") ||
      l.includes("low") ||
      l.includes("challenging")
    ) {
      // Caution / low confidence (distinct from pending)
      return "#8B5CF6"; // violet
    }
    if (
      l.includes("possible") ||
      l.includes("medium") ||
      l.includes("moderate") ||
      (l.includes("likely") && !l.includes("unlikely"))
    ) {
      // Neutral / plausible
      return "#3B82F6"; // blue
    }
    // Unknown/default: keep neutral (not overly optimistic)
    return "#64748B"; // slate
  };

  const getVisaStateLabel = (visa) => {
    const text = getVisaStateText(visa);
    if (!text) return "Possible";
    // Capitalize first letter of each word
    return text
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="recommendation-page">
      <div className="page-header">
        <h1>Visa Recommendations</h1>
        <p>
          {recommendations?.summary ||
            "Get personalized visa recommendations based on your profile"}
        </p>

        {/* Toggle Control Panel */}
        <div className="toggle-panel">
          <div className="toggle-container">
            <span className={`toggle-label ${!useCached ? "active" : ""}`}>
              <FiZap /> Call AI
            </span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={useCached}
                onChange={(e) => setUseCached(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className={`toggle-label ${useCached ? "active" : ""}`}>
              <FiDatabase /> Use Cache
            </span>
          </div>
          <p className="toggle-description">
            {useCached
              ? "Will load previously stored recommendations (fast, no API cost)"
              : "Will call ChatGPT for fresh recommendations (slower, uses API)"}
          </p>
          <button
            onClick={handleFetch}
            className="btn-primary fetch-btn"
            disabled={loading || refreshing}
          >
            {loading || refreshing ? (
              <>
                <FiRefreshCw className="spinning" />{" "}
                {useCached ? "Loading..." : "Generating..."}
              </>
            ) : (
              <>
                {useCached ? <FiDatabase /> : <FiZap />}
                {useCached ? "Load Cached" : "Generate New"} Recommendations
              </>
            )}
          </button>
        </div>

        {/* Source Badge */}
        {recommendations && (
          <div className="header-actions">
            {recommendations.source && (
              <span className="source-badge">
                Last Result:{" "}
                {recommendations.source === "cache"
                  ? "From Cache"
                  : "AI Generated"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <FiRefreshCw className="spinning" />
          <p>{useCached ? "Loading cached data..." : "Calling ChatGPT..."}</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-state">
          <FiAlertCircle
            style={{ fontSize: "2rem", color: "#E74C3C", marginBottom: "1rem" }}
          />
          <p>{error}</p>
          {error.includes("No cached recommendation") && (
            <p className="error-hint">
              Try toggling to "Call AI" mode and click the button to generate
              new recommendations.
            </p>
          )}
        </div>
      )}

      {/* Recommendations List */}
      {!loading && !error && options.length > 0 && (
        <div className="recommendations-list">
          {options.map((visa, index) => (
            <div
              key={index}
              className={`visa-card scroll-animate scroll-animate-delay-${
                (index % 4) + 1
              }`}
            >
              <div className="visa-card-header">
                <div className="visa-title-section">
                  <h2>{visa.visa_type}</h2>
                </div>
                <div className="match-score">
                  <div
                    className="score-circle"
                    style={{ borderColor: getVisaStateColor(visa) }}
                  >
                    <span style={{ color: getVisaStateColor(visa) }}>
                      {getVisaStateLabel(visa)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="visa-description">
                <p>{visa.reasoning}</p>
              </div>

              <div className="visa-details">
                {visa.estimated_timeline && (
                  <div className="detail-item">
                    <FiClock className="detail-icon" />
                    <div>
                      <div className="detail-label">Processing Time</div>
                      <div className="detail-value">
                        {visa.estimated_timeline}
                      </div>
                    </div>
                  </div>
                )}
                {visa.estimated_costs && (
                  <div className="detail-item">
                    <FiDollarSign className="detail-icon" />
                    <div>
                      <div className="detail-label">Estimated Cost</div>
                      <div className="detail-value">{visa.estimated_costs}</div>
                    </div>
                  </div>
                )}
              </div>

              {visa.next_steps && visa.next_steps.length > 0 && (
                <div className="visa-requirements">
                  <h3>Next Steps</h3>
                  <ul className="requirements-list">
                    {visa.next_steps.slice(0, 4).map((step, stepIndex) => (
                      <li key={stepIndex}>
                        <FiCheckCircle className="check-icon" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {visa.risk_flags && visa.risk_flags.length > 0 && (
                <div className="visa-requirements">
                  <h3>Key Points</h3>
                  <ul className="requirements-list">
                    {visa.risk_flags.slice(0, 4).map((flag, flagIndex) => (
                      <li key={flagIndex}>
                        <FiAlertCircle
                          className="check-icon"
                          style={{ color: "#F39C12" }}
                        />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="visa-actions">
                <button
                  onClick={() => handleViewChecklist(visa.visa_type)}
                  className="btn-primary"
                >
                  View Checklist <FiArrowRight />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state - no recommendations yet */}
      {!loading && !error && !recommendations && (
        <div className="empty-state">
          <FiStar
            style={{ fontSize: "3rem", color: "#4A90E2", marginBottom: "1rem" }}
          />
          <p>No recommendations loaded yet.</p>
          <p>
            Use the toggle above to choose your source, then click the button.
          </p>
        </div>
      )}
    </div>
  );
}

export default Recommendation;
