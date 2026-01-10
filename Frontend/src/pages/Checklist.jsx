import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { recommendationsAPI, checklistProgressAPI } from "../utils/api";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiCircle,
  FiFileText,
  FiInfo,
  FiClock,
  FiUser,
  FiBriefcase,
  FiBookOpen,
  FiLoader,
  FiDollarSign,
  FiTarget,
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

  // Single unified loader: Check DB first, generate only if needed
  useEffect(() => {
    let cancelled = false;

    const loadChecklist = async () => {
      if (!visaType) {
        setError("Missing visa type.");
        setLoading(false);
        return;
      }

      try {
        setError(null);
        setLoading(true);

        // Get visa_option from location state if available, otherwise fetch from history
        let visaOptionData = location?.state?.visaOption || null;

        if (!visaOptionData) {
          // Try to fetch from recommendation history
          try {
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
            visaOptionData =
              options.find(
                (o) =>
                  String(o?.visa_type || "").toLowerCase() ===
                  String(visaType).toLowerCase()
              ) || null;
          } catch (err) {
            console.warn("Could not fetch recommendation history:", err);
          }
        }

        // If still no visa option, create a basic one
        if (!visaOptionData) {
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
        }

        // Call API - backend will check DB first, only generate if needed
        let response;
        try {
          response = await recommendationsAPI.getChecklistCached(
            visaType,
            visaOptionData
          );
        } catch (err) {
          // If request fails but checklist might have been saved, retry once after a short delay
          // This handles the case where the backend saves the checklist but response fails
          if (err?.message?.includes("Network error") || err?.message?.includes("Failed to fetch")) {
            console.warn("Initial request failed, retrying after delay...", err);
            // Wait 2 seconds and retry - checklist might be cached now
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              response = await recommendationsAPI.getChecklistCached(
                visaType,
                visaOptionData
              );
              console.log("Retry successful, checklist loaded from cache");
            } catch (retryErr) {
              // If retry also fails, throw the original error
              throw err;
            }
          } else {
            // For other errors, throw immediately
            throw err;
          }
        }

        if (cancelled) return;

        // Set visa option with checklist data
        setVisaOption({
          ...visaOptionData,
          checklist: response?.checklist || visaOptionData.checklist || null,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading checklist:", err);
        setError(err?.message || "Failed to load checklist");
        // Create fallback visa option
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

    loadChecklist();

    return () => {
      cancelled = true;
    };
  }, [visaType, location?.state]);

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
          title:
            item?.title ||
            item?.name ||
            (typeof item === "string" ? item : `Step ${idx + 1}`),
          description: item?.description || "",
          guidance: item?.guidance || "",
          documents: Array.isArray(item?.documents) ? item.documents : [],
          owner: item?.owner || "applicant",
          dueIn: item?.due_in || item?.dueIn || "",
          estimatedDuration:
            item?.estimated_duration || item?.estimatedDuration || null,
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
        description: `Complete this step to progress with your ${
          visaOption?.visa_type || "visa"
        } application.`,
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
          guidance:
            "Check the eligibility requirements section below for detailed information.",
          documents: Array.isArray(visaOption?.requirements)
            ? visaOption.requirements
            : [],
          owner: "applicant",
          dueIn: "",
          completed: false,
        },
        {
          id: "step-2",
          stepNumber: 2,
          title: "Gather Required Documents",
          description: `Collect all necessary documents for your ${visaOption.visa_type} application.`,
          guidance:
            "Use the documents section below to see what's needed and upload them.",
          documents: Array.isArray(visaOption?.requirements)
            ? visaOption.requirements
            : [],
          owner: "applicant",
          dueIn: "",
          completed: false,
        },
        {
          id: "step-3",
          stepNumber: 3,
          title: "Prepare Application Forms",
          description: `Complete all required application forms for ${visaOption.visa_type}.`,
          guidance:
            "Visit the official immigration website to download and complete the necessary forms.",
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
          guidance: `Estimated processing time: ${
            visaOption?.estimated_timeline || "varies"
          }. Estimated cost: ${visaOption?.estimated_costs || "varies"}.`,
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
  const [savingProgress, setSavingProgress] = useState(false);
  const saveTimeoutRef = useRef(null);
  const [checklistStartTime, setChecklistStartTime] = useState(null);
  const [processingTime, setProcessingTime] = useState("—");
  const isInitialLoadRef = useRef(true); // Track if this is the initial load

  // Fetch and merge saved progress when checklist items are loaded
  useEffect(() => {
    if (!checklistItems.length || !visaType) {
      setChecklist(checklistItems);
      return;
    }

    // Fetch saved progress from backend
    const loadProgress = async () => {
      try {
        const savedProgress = await checklistProgressAPI.getProgress(visaType);

        if (savedProgress && savedProgress.progress_json) {
          // Store the start time (created_at) for processing time calculation
          if (savedProgress.created_at) {
            setChecklistStartTime(new Date(savedProgress.created_at));
          }

          // Merge saved progress into checklist items
          const mergedChecklist = checklistItems.map((item) => {
            const isCompleted = savedProgress.progress_json[item.id] === true;
            return {
              ...item,
              completed: isCompleted,
            };
          });
          console.log("Loaded saved progress:", savedProgress.progress_json);
          setChecklist(mergedChecklist);
        } else {
          // No saved progress, use default (all incomplete)
          // Progress was already initialized by backend when checklist was generated
          console.log("No saved progress found, using default");
          setChecklist(checklistItems);
        }
      } catch (error) {
        console.warn("Failed to load checklist progress:", error);
        // On error, just use the default checklist items
        setChecklist(checklistItems);
      } finally {
        // Mark initial load as complete
        isInitialLoadRef.current = false;
      }
    };

    loadProgress();
  }, [checklistItems, visaType]);

  // Initialize scroll animations after checklist items are rendered
  useEffect(() => {
    if (checklist.length === 0) return;

    const timer = setTimeout(() => {
      // First, manually add animate-in to all checklist items that are in view
      const items = document.querySelectorAll(".checklist-item.scroll-animate");
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInView || rect.top === 0) {
          item.classList.add("animate-in");
        }
      });

      // Then initialize the observer for future scroll events
      const observer = initScrollAnimations();

      // Fallback: if items still aren't visible after 1 second, force them visible
      setTimeout(() => {
        const hiddenItems = document.querySelectorAll(
          ".checklist-item.scroll-animate:not(.animate-in)"
        );
        hiddenItems.forEach((item) => {
          item.classList.add("animate-in");
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

  // Save progress whenever checklist changes (debounced)
  // BUT skip saving on initial load - only save when user actually toggles items
  useEffect(() => {
    if (checklist.length === 0 || !visaType) return;
    
    // Skip saving on initial load - backend already initialized progress when checklist was generated
    if (isInitialLoadRef.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 500ms of inactivity
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSavingProgress(true);
        const progressJson = {};
        checklist.forEach((item) => {
          if (item && item.id) {
            progressJson[item.id] = item.completed || false;
          }
        });

        const savedProgress = await checklistProgressAPI.saveProgress(
          visaType,
          progressJson
        );

        // Update start time if it was just created (first save)
        if (savedProgress && savedProgress.created_at && !checklistStartTime) {
          setChecklistStartTime(new Date(savedProgress.created_at));
        }

        console.log("Saved checklist progress:", progressJson);
      } catch (error) {
        console.error("Failed to save checklist progress:", error);
      } finally {
        setSavingProgress(false);
      }
    }, 500);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [checklist, visaType, checklistStartTime]);

  const completedCount = checklist.filter(
    (item) => item && item.completed
  ).length;
  const totalCount = checklist.length;
  // Only calculate progress if we have items, otherwise show 0
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate circumference: 2 * π * radius (52)
  const circumference = 2 * Math.PI * 52; // ≈ 326.73
  // Calculate dash length for the progress circle
  // Ensure we always show something visible - at minimum show 2% of circle
  const progressPercent = Math.max(0, Math.min(100, progress));
  const minVisibleLength = Math.max(5, circumference * 0.02); // At least 5 units or 2% of circle
  const calculatedDashLength = (progressPercent / 100) * circumference;
  // Always show at least minVisibleLength, even at 0%
  const progressDashLength =
    totalCount > 0
      ? Math.max(minVisibleLength, calculatedDashLength)
      : minVisibleLength;

  // Ensure values are valid numbers
  const finalDashLength = isNaN(progressDashLength)
    ? minVisibleLength
    : Math.max(5, Math.round(progressDashLength));
  const finalCircumference = isNaN(circumference)
    ? 327
    : Math.round(circumference);

  // Debug logging for progress
  useEffect(() => {
    console.log("Checklist progress calculation:", {
      completedCount,
      totalCount,
      progress,
      progressPercent,
      checklistLength: checklist.length,
      circumference: finalCircumference,
      progressDashLength: finalDashLength,
      minVisibleLength,
      strokeDasharray: `${finalDashLength} ${finalCircumference}`,
    });

    // Also log the actual DOM element to verify it exists
    setTimeout(() => {
      const circle = document.querySelector(".progress-ring-circle");
      const bgCircle = document.querySelector(".progress-ring-circle-bg");
      const svg = document.querySelector(".progress-ring");
      const progressText = document.querySelector(".progress-text");
      const progressNumber = document.querySelector(".progress-number");
      const progressLabel = document.querySelector(".progress-label");

      console.log("Progress circle DOM check:", {
        svg: svg ? "FOUND" : "NOT FOUND",
        circle: circle
          ? {
              strokeDasharray: circle.getAttribute("stroke-dasharray"),
              stroke: circle.getAttribute("stroke"),
              strokeWidth: circle.getAttribute("stroke-width"),
              r: circle.getAttribute("r"),
              cx: circle.getAttribute("cx"),
              cy: circle.getAttribute("cy"),
              opacity: window.getComputedStyle(circle).opacity,
              display: window.getComputedStyle(circle).display,
              visibility: window.getComputedStyle(circle).visibility,
            }
          : "NOT FOUND",
        bgCircle: bgCircle
          ? {
              stroke: bgCircle.getAttribute("stroke"),
              display: window.getComputedStyle(bgCircle).display,
            }
          : "NOT FOUND",
        progressText: progressText
          ? {
              textContent: progressText.textContent,
              innerHTML: progressText.innerHTML,
              opacity: window.getComputedStyle(progressText).opacity,
              display: window.getComputedStyle(progressText).display,
              visibility: window.getComputedStyle(progressText).visibility,
              zIndex: window.getComputedStyle(progressText).zIndex,
              color: window.getComputedStyle(progressText).color,
              top: window.getComputedStyle(progressText).top,
              left: window.getComputedStyle(progressText).left,
            }
          : "NOT FOUND",
        progressNumber: progressNumber
          ? {
              textContent: progressNumber.textContent,
              innerHTML: progressNumber.innerHTML,
              opacity: window.getComputedStyle(progressNumber).opacity,
              display: window.getComputedStyle(progressNumber).display,
              visibility: window.getComputedStyle(progressNumber).visibility,
              color: window.getComputedStyle(progressNumber).color,
              fontSize: window.getComputedStyle(progressNumber).fontSize,
            }
          : "NOT FOUND",
        progressLabel: progressLabel
          ? {
              textContent: progressLabel.textContent,
              display: window.getComputedStyle(progressLabel).display,
            }
          : "NOT FOUND",
      });
    }, 500);
  }, [
    completedCount,
    totalCount,
    progress,
    checklist.length,
    finalCircumference,
    finalDashLength,
    minVisibleLength,
    progressPercent,
  ]);

  // Function to calculate estimated remaining processing time based on incomplete steps
  const calculateEstimatedRemainingTime = () => {
    if (!checklist || checklist.length === 0) {
      return visaOption?.estimated_timeline || "—";
    }

    const completed = checklist.filter((item) => item && item.completed).length;
    const total = checklist.length;

    // Get all incomplete steps with duration estimates
    const incompleteSteps = checklist.filter(
      (item) => item && !item.completed && item.estimatedDuration
    );

    if (incompleteSteps.length === 0) {
      // All steps completed or no duration estimates
      if (completed === total && total > 0) {
        return "Completed";
      }
      // Fallback to visa option estimated timeline if no duration data
      return visaOption?.estimated_timeline || "—";
    }

    // Sum up estimated durations for incomplete steps
    const totalDays = incompleteSteps.reduce((sum, step) => {
      const duration = step.estimatedDuration;
      if (typeof duration === "number" && duration > 0) {
        return sum + duration;
      }
      return sum;
    }, 0);

    if (totalDays === 0) {
      return visaOption?.estimated_timeline || "—";
    }

    // Format the duration nicely
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    if (weeks > 0 && days > 0) {
      return `~${weeks} week${weeks !== 1 ? "s" : ""}, ${days} day${
        days !== 1 ? "s" : ""
      }`;
    } else if (weeks > 0) {
      return `~${weeks} week${weeks !== 1 ? "s" : ""}`;
    } else {
      return `~${totalDays} day${totalDays !== 1 ? "s" : ""}`;
    }
  };

  // Function to get the next incomplete step
  const getNextStep = () => {
    const incompleteStep = checklist.find((item) => item && !item.completed);
    if (incompleteStep) {
      return (
        incompleteStep.title || incompleteStep.name || "Continue with next step"
      );
    }
    // All steps completed
    return "All steps completed! 🎉";
  };

  // Update processing time based on remaining steps
  useEffect(() => {
    // Calculate estimated remaining time based on incomplete steps
    const estimatedTime = calculateEstimatedRemainingTime();
    setProcessingTime(estimatedTime);
  }, [checklist, visaOption]);

  // Note: Start time is set when progress is first saved (from backend created_at)
  // or when loading existing progress. No need to set it here.

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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/recommendation" className="back-link">
          <FiArrowLeft /> Back to Recommendations
        </Link>
      </motion.div>

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
            {visaType
              ? `Generating step-by-step guide for ${visaType}`
              : "Creating your personalized application guide"}
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
          <FiAlertCircle />
          <p>{error}</p>
          <Link to="/recommendation">
            <FiArrowLeft /> Back to Recommendations
          </Link>
        </div>
      ) : (
        <>
          <motion.div 
            className="checklist-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1>{visaOption?.visa_type || visaType || "Checklist"}</h1>
              <p className="visa-subtitle">
                {visaOption?.likelihood
                  ? `Eligibility: ${String(visaOption.likelihood).replaceAll(
                      "_",
                      " "
                    ).charAt(0).toUpperCase() + String(visaOption.likelihood).replaceAll("_", " ").slice(1)}`
                  : "Your personalized application roadmap"}
              </p>
            </div>
            <div className="progress-summary">
              <div className="progress-circle">
                <svg
                  className="progress-ring"
                  width="140"
                  height="140"
                  viewBox="0 0 140 140"
                >
                  <circle
                    className="progress-ring-circle-bg"
                    r="60"
                    cx="70"
                    cy="70"
                  />
                  <circle
                    className="progress-ring-circle"
                    r="60"
                    cx="70"
                    cy="70"
                    strokeDasharray={`${(progressPercent / 100) * (2 * Math.PI * 60)} ${2 * Math.PI * 60}`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="progress-text">
                  <span className="progress-number">
                    {progress || 0}%
                  </span>
                  <span className="progress-label">
                    Complete
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="visa-info-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="info-row">
              <div className="info-col">
                <span className="info-label">
                  <FiClock style={{ marginRight: '6px', opacity: 0.6 }} />
                  Est. Time Remaining
                </span>
                <span className="info-value">{processingTime}</span>
              </div>
              <div className="info-col">
                <span className="info-label">
                  <FiDollarSign style={{ marginRight: '6px', opacity: 0.6 }} />
                  Estimated Cost
                </span>
                <span className="info-value">
                  {visaOption?.estimated_costs || "—"}
                </span>
              </div>
              <div className="info-col">
                <span className="info-label">
                  <FiTarget style={{ marginRight: '6px', opacity: 0.6 }} />
                  Next Action
                </span>
                <span className="info-value">{getNextStep()}</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="checklist-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="section-header">
              <h2>
                <FiTarget className="section-icon" />
                Step-by-Step Application Guide
              </h2>
              <span className="checklist-count">
                {completedCount} of {checklist.length} completed
              </span>
            </div>

            <div className="checklist-items">
              {checklist.length > 0 ? (
                checklist
                  .map((item, index) => {
                    // Ensure we have a valid item with at least a title
                    if (!item) {
                      console.warn(
                        `Checklist item at index ${index} is null or undefined`
                      );
                      return null;
                    }

                    const itemId = item.id || `step-${index + 1}`;
                    const itemTitle =
                      item.title || item.name || `Step ${index + 1}`;
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
                            <div className="item-title">{itemTitle}</div>
                            {item.owner && (
                              <span
                                className={`owner-badge ${
                                  item.owner === "JAPA" ? "japa" : "applicant"
                                }`}
                              >
                                {item.owner === "JAPA" ? (
                                  <FiBriefcase className="owner-icon" />
                                ) : (
                                  <FiUser className="owner-icon" />
                                )}
                                {item.owner === "JAPA"
                                  ? "JAPA Handles"
                                  : "Your Action"}
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

                          {item.documents &&
                            Array.isArray(item.documents) &&
                            item.documents.length > 0 && (
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
                                <strong>Timeline:</strong>{" "}
                                {item.dueIn || item.due_in}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                  .filter(Boolean) // Remove any null items
              ) : (
                <div className="empty-state">
                  <p>
                    No checklist items were provided for this recommendation.
                  </p>
                  {visaOption?.next_steps &&
                    visaOption.next_steps.length > 0 && (
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
          </motion.div>

          <motion.div 
            className="requirements-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2>
              <FiInfo className="section-icon" />
              Key Points & Requirements
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
                  Review the checklist steps above for detailed requirements.
                </li>
              ) : null}
            </ul>
          </motion.div>

          <motion.div 
            className="documents-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="section-header">
              <h2>
                <FiFileText className="section-icon" />
                Required Documents
              </h2>
              <Link to="/documents" className="link-primary">
                Manage Documents <FiArrowRight />
              </Link>
            </div>
            <div className="documents-grid">
              {(Array.isArray(visaOption?.requirements)
                ? visaOption.requirements
                : []
              ).map((doc, index) => (
                <motion.div
                  key={index}
                  className="document-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <FiFileText className="doc-icon" />
                  <span>{doc}</span>
                </motion.div>
              ))}
              {!Array.isArray(visaOption?.requirements) ||
              visaOption.requirements.length === 0 ? (
                <div className="empty-state">
                  <p>Documents will be listed in each checklist step above.</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

export default Checklist;
