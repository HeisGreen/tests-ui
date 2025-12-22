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
  FiClock,
  FiUser,
  FiBriefcase,
  FiBookOpen,
  FiLoader,
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

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !visaOption) {
        console.warn("Checklist: Loading timeout, creating fallback");
        setVisaOption({
          visa_type: visaType || "Visa",
          reasoning: `Application checklist`,
          likelihood: "possible",
          estimated_timeline: "Varies",
          estimated_costs: "Varies",
          risk_flags: [],
          next_steps: [],
          checklist: null,
          requirements: [],
        });
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading, visaOption, visaType]);

  // Load from navigation state if provided (fast path), then generate checklist if needed.
  useEffect(() => {
    const opt = location?.state?.visaOption || null;
    if (opt) {
      console.log("Checklist: Loading from location.state", opt);
      
      // If checklist is missing or has only 1 step, generate a detailed one
      const existingChecklist = opt?.checklist;
      if (!existingChecklist || !Array.isArray(existingChecklist) || existingChecklist.length <= 1) {
        console.log("Checklist: Generating detailed checklist using ChatGPT");
        setLoading(true);
        
        recommendationsAPI.generateChecklist(opt)
          .then((checklistResponse) => {
            if (checklistResponse?.checklist && Array.isArray(checklistResponse.checklist)) {
              const updatedOption = {
                ...opt,
                checklist: checklistResponse.checklist,
              };
              console.log(`Checklist: Generated ${checklistResponse.checklist.length} steps`);
              setVisaOption(updatedOption);
            } else {
              setVisaOption(opt);
            }
          })
          .catch((err) => {
            console.warn("Checklist: Failed to generate checklist, using existing data", err);
            setVisaOption(opt);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setVisaOption(opt);
        setLoading(false);
      }
    } else {
      console.log("Checklist: No visaOption in location.state, will fetch from API");
    }
  }, [location?.state]);

  // Fallback: fetch latest stored recommendation history and pick matching option by visa_type.
  // Then generate a detailed checklist using ChatGPT.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!visaType) {
        setError("Missing visa type.");
        setLoading(false);
        return;
      }
      if (visaOption) {
        setLoading(false);
        return;
      }

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

        let visaOptionData = match;
        
        if (!match) {
          // Even if no exact match, create a basic visa option from the visa type
          console.log("Checklist: No match found, creating basic visa option");
          visaOptionData = {
            visa_type: visaType,
            reasoning: `Application checklist for ${visaType}`,
            likelihood: "possible",
            estimated_timeline: "Varies",
            estimated_costs: "Varies",
            risk_flags: [],
            next_steps: [],
            checklist: null,
            requirements: [],
          };
        } else {
          console.log("Checklist: Found match", match);
        }

        // If checklist is missing or has only 1 step, generate a detailed one using ChatGPT
        const existingChecklist = visaOptionData?.checklist;
        if (!existingChecklist || !Array.isArray(existingChecklist) || existingChecklist.length <= 1) {
          console.log("Checklist: Generating detailed checklist using ChatGPT");
          try {
            const checklistResponse = await recommendationsAPI.generateChecklist(visaOptionData);
            if (checklistResponse?.checklist && Array.isArray(checklistResponse.checklist)) {
              visaOptionData.checklist = checklistResponse.checklist;
              console.log(`Checklist: Generated ${checklistResponse.checklist.length} steps`);
            }
          } catch (checklistErr) {
            console.warn("Checklist: Failed to generate checklist, using fallback", checklistErr);
            // Continue with existing data or fallback
          }
        }

        setVisaOption(visaOptionData);
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading checklist:", err);
        // Don't show error, just create a basic checklist
        console.log("Checklist: Error occurred, creating fallback visa option");
        setVisaOption({
          visa_type: visaType,
          reasoning: `Application checklist for ${visaType}`,
          likelihood: "possible",
          estimated_timeline: "Varies",
          estimated_costs: "Varies",
          risk_flags: [],
          next_steps: [],
          checklist: null,
          requirements: [],
        });
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

  const checklistItems = useMemo(() => {
    const raw = visaOption?.checklist;
    console.log("Checklist items useMemo - raw checklist:", raw);
    
    // If we have structured checklist data, use it
    if (Array.isArray(raw) && raw.length > 0) {
      const processed = raw.map((item, idx) => {
        // Handle both object and string items
        const processedItem = {
          id: item?.id ?? `step-${idx + 1}`,
          stepNumber: idx + 1,
          title: item?.title || item?.name || (typeof item === 'string' ? item : `Step ${idx + 1}`),
          description: item?.description || "",
          guidance: item?.guidance || "",
          documents: Array.isArray(item?.documents) ? item.documents : [],
          owner: item?.owner || "applicant",
          dueIn: item?.due_in || item?.dueIn || "",
          completed: false,
          _raw: item,
        };
        console.log(`Processed item ${idx + 1}:`, processedItem);
        return processedItem;
      });
      console.log(`Processed ${processed.length} checklist items`);
      return processed;
    }
    
    // Fallback: Generate checklist from next_steps if available
    const nextSteps = visaOption?.next_steps;
    if (Array.isArray(nextSteps) && nextSteps.length > 0) {
      return nextSteps.map((step, idx) => ({
        id: `step-${idx + 1}`,
        stepNumber: idx + 1,
        title: step,
        description: `Complete this step to progress with your ${visaOption?.visa_type || "visa"} application.`,
        guidance: "",
        documents: [],
        owner: "applicant",
        dueIn: "",
        completed: false,
        _raw: { title: step },
      }));
    }
    
    // Final fallback: Create a basic checklist structure
    if (visaOption) {
      return [
        {
          id: "step-1",
          stepNumber: 1,
          title: "Review Eligibility Requirements",
          description: `Review the eligibility requirements for ${visaOption.visa_type} to ensure you meet all criteria.`,
          guidance: "Check the eligibility requirements section below for detailed information.",
          documents: Array.isArray(visaOption?.requirements) ? visaOption.requirements : [],
          owner: "applicant",
          dueIn: "",
          completed: false,
        },
        {
          id: "step-2",
          stepNumber: 2,
          title: "Gather Required Documents",
          description: `Collect all necessary documents for your ${visaOption.visa_type} application.`,
          guidance: "Use the documents section below to see what's needed and upload them.",
          documents: Array.isArray(visaOption?.requirements) ? visaOption.requirements : [],
          owner: "applicant",
          dueIn: "",
          completed: false,
        },
        {
          id: "step-3",
          stepNumber: 3,
          title: "Prepare Application Forms",
          description: `Complete all required application forms for ${visaOption.visa_type}.`,
          guidance: "Visit the official immigration website to download and complete the necessary forms.",
          documents: [],
          owner: "applicant",
          dueIn: "",
          completed: false,
        },
        {
          id: "step-4",
          stepNumber: 4,
          title: "Submit Application",
          description: `Submit your complete ${visaOption.visa_type} application with all required documents.`,
          guidance: `Estimated processing time: ${visaOption?.estimated_timeline || "varies"}. Estimated cost: ${visaOption?.estimated_costs || "varies"}.`,
          documents: [],
          owner: "applicant",
          dueIn: "",
          completed: false,
        },
      ];
    }
    
    return [];
  }, [visaOption]);

  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    // Hydrate checklist state whenever the option changes.
    console.log("Setting checklist state with items:", checklistItems);
    setChecklist(checklistItems);
  }, [checklistItems]);

  // Initialize scroll animations after checklist items are rendered
  useEffect(() => {
    if (checklist.length === 0) return;
    
    const timer = setTimeout(() => {
      // First, manually add animate-in to all checklist items that are in view
      const items = document.querySelectorAll('.checklist-item.scroll-animate');
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInView || rect.top === 0) {
          item.classList.add('animate-in');
        }
      });
      
      // Then initialize the observer for future scroll events
      const observer = initScrollAnimations();
      
      // Fallback: if items still aren't visible after 1 second, force them visible
      setTimeout(() => {
        const hiddenItems = document.querySelectorAll('.checklist-item.scroll-animate:not(.animate-in)');
        hiddenItems.forEach((item) => {
          item.classList.add('animate-in');
        });
      }, 1000);
      
      return () => {
        if (observer) observer.disconnect();
      };
    }, 300);
    
    return () => clearTimeout(timer);
  }, [checklist]);

  const toggleItem = (itemId) => {
    setChecklist(
      checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter((item) => item && item.completed).length;
  const totalCount = checklist.length || 1;
  const progress = Math.round((completedCount / totalCount) * 100);
  
  // Debug logging
  useEffect(() => {
    console.log("Checklist state:", {
      checklistLength: checklist.length,
      checklistItems: checklist,
      visaOption: visaOption,
      checklistItemsLength: checklistItems.length,
    });
  }, [checklist, checklistItems, visaOption]);

  return (
    <div className="checklist-page">
      <Link to="/recommendation" className="back-link">
        <FiArrowLeft /> Back to Recommendations
      </Link>

      {loading ? (
        <div className="loading-state">
          <div className="loading-animation">
            <div className="loading-spinner">
              <FiLoader className="spinner-icon" />
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h2 className="loading-title">Preparing Your Checklist</h2>
          <p className="loading-subtitle">
            {visaType ? `Generating step-by-step guide for ${visaType}` : "Creating your personalized application guide"}
          </p>
          <div className="loading-progress">
            <div className="loading-progress-bar"></div>
          </div>
          <p className="loading-hint">
            This may take a few moments while we analyze your recommendation...
          </p>
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
              <h2>Step-by-Step Application Guide</h2>
              <span className="checklist-count">
                {completedCount} of {checklist.length} steps completed
              </span>
            </div>

            <div className="checklist-items">
              {checklist.length > 0 ? (
                checklist.map((item, index) => {
                  // Ensure we have a valid item with at least a title
                  if (!item) {
                    console.warn(`Checklist item at index ${index} is null or undefined`);
                    return null;
                  }
                  
                  const itemId = item.id || `step-${index + 1}`;
                  const itemTitle = item.title || item.name || `Step ${index + 1}`;
                  const itemStepNumber = item.stepNumber || index + 1;
                  
                  return (
                    <div
                      key={itemId}
                      className={`checklist-item scroll-animate scroll-animate-delay-${
                        (index % 4) + 1
                      } ${item.completed ? "completed" : ""}`}
                    >
                      <div className="step-indicator">
                        <div className="step-number">{itemStepNumber}</div>
                        {index < checklist.length - 1 && (
                          <div className="step-connector"></div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="check-button"
                      >
                        {item.completed ? (
                          <FiCheckCircle className="check-icon checked" />
                        ) : (
                          <FiCircle className="check-icon" />
                        )}
                      </button>
                      
                      <div className="item-content">
                        <div className="item-header">
                          <div className="item-title">
                            {itemTitle}
                          </div>
                          {item.owner && (
                            <span className={`owner-badge ${item.owner === "JAPA" ? "japa" : "applicant"}`}>
                              {item.owner === "JAPA" ? (
                                <FiBriefcase className="owner-icon" />
                              ) : (
                                <FiUser className="owner-icon" />
                              )}
                              {item.owner === "JAPA" ? "JAPA Handles" : "Your Action"}
                            </span>
                          )}
                        </div>
                        
                        {item.description && (
                          <div className="item-description">
                            {item.description}
                          </div>
                        )}
                        
                        {item.guidance && (
                          <div className="item-guidance">
                            <FiBookOpen className="guidance-icon" />
                            <div>
                              <strong>Guidance:</strong> {item.guidance}
                            </div>
                          </div>
                        )}
                        
                        {item.documents && Array.isArray(item.documents) && item.documents.length > 0 && (
                          <div className="item-documents">
                            <FiFileText className="documents-icon" />
                            <div>
                              <strong>Documents needed:</strong>
                              <ul className="documents-list">
                                {item.documents.map((doc, docIdx) => (
                                  <li key={docIdx}>{doc}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        {(item.dueIn || item.due_in) && (
                          <div className="item-due">
                            <FiClock className="due-icon" />
                            <span>
                              <strong>Timeline:</strong> {item.dueIn || item.due_in}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }).filter(Boolean) // Remove any null items
              ) : (
                <div className="empty-state">
                  <p>
                    No checklist items were provided for this recommendation.
                  </p>
                  {visaOption?.next_steps && visaOption.next_steps.length > 0 && (
                    <div className="fallback-steps">
                      <h3>Next Steps:</h3>
                      <ul className="requirements-list">
                        {visaOption.next_steps.map((step, idx) => (
                          <li key={idx}>
                            <FiCheckCircle className="check-icon" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
