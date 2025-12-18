import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { recommendationsAPI } from "../utils/api";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiCircle,
  FiFileText,
  FiInfo,
} from "react-icons/fi";
import { initScrollAnimations } from "../utils/scrollAnimation";
import "./Checklist.css";

function Checklist() {
  const { visaId } = useParams();
  const location = useLocation();
  const visaType = useMemo(() => decodeURIComponent(visaId || ""), [visaId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visaOption, setVisaOption] = useState(null); // Recommendation option

  // Load from navigation state if provided (fast path).
  useEffect(() => {
    const opt = location?.state?.visaOption || null;
    if (opt) {
      setVisaOption(opt);
      setLoading(false);
    }
  }, [location?.state]);

  // Fallback: fetch latest stored recommendation history and pick matching option by visa_type.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!visaType) {
        setError("Missing visa type.");
        setLoading(false);
        return;
      }
      if (visaOption) return;

      try {
        setError(null);
        setLoading(true);
        // Only need the most recent record; keep payload small to avoid slow loads.
        const history = await Promise.race([
          recommendationsAPI.getHistory(1),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "Checklist is taking too long to load. Please try again."
                  )
                ),
              12000
            )
          ),
        ]);
        if (cancelled) return;
        const latest = history?.[0]?.output_data;
        const options = Array.isArray(latest?.options) ? latest.options : [];
        const match =
          options.find(
            (o) =>
              String(o?.visa_type || "").toLowerCase() ===
              String(visaType).toLowerCase()
          ) || null;

        if (!match) {
          setError("Checklist not found for this recommendation.");
        } else {
          setVisaOption(match);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading checklist:", err);
        setError(err.message || "Failed to load checklist");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [visaType, visaOption]);

  useEffect(() => {
    initScrollAnimations();
  }, []);

  const checklistItems = useMemo(() => {
    const raw = visaOption?.checklist;
    if (!Array.isArray(raw)) return [];
    // Normalize for UI: keep an id + required flag.
    return raw.map((item, idx) => ({
      id: item?.id ?? `${idx}`,
      title: item?.title || item?.name || `Task ${idx + 1}`,
      required: true,
      completed: false,
      _raw: item,
    }));
  }, [visaOption]);

  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    // Hydrate checklist state whenever the option changes.
    setChecklist(checklistItems);
  }, [checklistItems]);

  const toggleItem = (itemId) => {
    setChecklist(
      checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length || 1;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="checklist-page">
      <Link to="/recommendation" className="back-link">
        <FiArrowLeft /> Back to Recommendations
      </Link>

      {loading ? (
        <div className="loading-state">
          <p>Loading checklist…</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <FiAlertCircle style={{ fontSize: "2rem", color: "#E74C3C" }} />
          <p>{error}</p>
          <Link to="/recommendation">Back to Recommendations</Link>
        </div>
      ) : (
        <>
          <div className="checklist-header">
            <div>
              <h1>{visaOption?.visa_type || visaType || "Checklist"}</h1>
              <p className="visa-subtitle">
                {visaOption?.likelihood
                  ? `Prediction: ${String(visaOption.likelihood).replaceAll(
                      "_",
                      " "
                    )}`
                  : "Personalized checklist from your recommendation"}
              </p>
            </div>
            <div className="progress-summary">
              <div className="progress-circle">
                <svg className="progress-ring" width="120" height="120">
                  <circle
                    className="progress-ring-circle-bg"
                    stroke="#E8F1FF"
                    strokeWidth="8"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                  />
                  <circle
                    className="progress-ring-circle"
                    stroke="#4A90E2"
                    strokeWidth="8"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                    strokeDasharray={`${progress * 3.27} 327`}
                    strokeDashoffset="0"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="progress-text">
                  <span className="progress-number">{progress}%</span>
                  <span className="progress-label">Complete</span>
                </div>
              </div>
            </div>
          </div>

          <div className="visa-info-card">
            <div className="info-row">
              <div className="info-col">
                <span className="info-label">Processing Time</span>
                <span className="info-value">
                  {visaOption?.estimated_timeline || "—"}
                </span>
              </div>
              <div className="info-col">
                <span className="info-label">Cost</span>
                <span className="info-value">
                  {visaOption?.estimated_costs || "—"}
                </span>
              </div>
              <div className="info-col">
                <span className="info-label">Next Step</span>
                <span className="info-value">
                  {Array.isArray(visaOption?.next_steps) &&
                  visaOption.next_steps.length
                    ? visaOption.next_steps[0]
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="checklist-section">
            <div className="section-header">
              <h2>Application Checklist</h2>
              <span className="checklist-count">
                {completedCount} of {checklist.length} completed
              </span>
            </div>

            <div className="checklist-items">
              {(checklist.length ? checklist : []).map((item, index) => (
                <div
                  key={item.id}
                  className={`checklist-item scroll-animate scroll-animate-delay-${
                    (index % 4) + 1
                  } ${item.completed ? "completed" : ""}`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="check-button"
                  >
                    {item.completed ? (
                      <FiCheckCircle className="check-icon checked" />
                    ) : (
                      <FiCircle className="check-icon" />
                    )}
                  </button>
                  <div className="item-content">
                    <div className="item-title">
                      {item.title}
                      {item.required && (
                        <span className="required-badge">Required</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!checklist.length && (
                <div className="empty-state">
                  <p>
                    No checklist items were provided for this recommendation.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="requirements-section">
            <h2>
              <FiInfo className="section-icon" />
              Eligibility Requirements
            </h2>
            <ul className="requirements-list">
              {(Array.isArray(visaOption?.risk_flags)
                ? visaOption.risk_flags
                : []
              ).map((req, index) => (
                <li key={index}>
                  <FiCheckCircle className="check-icon" />
                  {req}
                </li>
              ))}
              {!Array.isArray(visaOption?.risk_flags) ||
              visaOption.risk_flags.length === 0 ? (
                <li>
                  <FiCheckCircle className="check-icon" />
                  No additional key points provided.
                </li>
              ) : null}
            </ul>
          </div>

          <div className="documents-section">
            <div className="section-header">
              <h2>
                <FiFileText className="section-icon" />
                Required Documents
              </h2>
              <Link to="/documents" className="link-primary">
                Manage Documents
              </Link>
            </div>
            <div className="documents-grid">
              {(Array.isArray(visaOption?.requirements)
                ? visaOption.requirements
                : []
              ).map((doc, index) => (
                <div
                  key={index}
                  className={`document-card scroll-animate scroll-animate-delay-${
                    (index % 4) + 1
                  }`}
                >
                  <FiFileText className="doc-icon" />
                  <span>{doc}</span>
                </div>
              ))}
              {!Array.isArray(visaOption?.requirements) ||
              visaOption.requirements.length === 0 ? (
                <div className="empty-state">
                  <p>No document list provided.</p>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Checklist;
