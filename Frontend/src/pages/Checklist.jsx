import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { recommendationsAPI, checklistProgressAPI } from "../utils/api";
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
          estimatedDuration: item?.estimated_duration || item?.estimatedDuration || null,
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
  const [savingProgress, setSavingProgress] = useState(false);
  const saveTimeoutRef = useRef(null);
  const [checklistStartTime, setChecklistStartTime] = useState(null);
  const [processingTime, setProcessingTime] = useState("—");

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
          // Start time will be set when progress is first saved
          console.log("No saved progress found, using default");
          setChecklist(checklistItems);
        }
      } catch (error) {
        console.warn("Failed to load checklist progress:", error);
        // On error, just use the default checklist items
        // Start time will be set when progress is first saved
        setChecklist(checklistItems);
      }
    };

    loadProgress();
  }, [checklistItems, visaType]);

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

  // Save progress whenever checklist changes (debounced)
  useEffect(() => {
    if (checklist.length === 0 || !visaType) return;

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
        
        const savedProgress = await checklistProgressAPI.saveProgress(visaType, progressJson);
        
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

  const completedCount = checklist.filter((item) => item && item.completed).length;
  const totalCount = checklist.length;
  // Only calculate progress if we have items, otherwise show 0
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Calculate circumference: 2 * π * radius (52)
  const circumference = 2 * Math.PI * 52; // ≈ 326.73
  // Calculate dash length for the progress circle
  // Ensure we always show something visible - at minimum show 2% of circle
  const progressPercent = Math.max(0, Math.min(100, progress));
  const minVisibleLength = Math.max(5, circumference * 0.02); // At least 5 units or 2% of circle
  const calculatedDashLength = (progressPercent / 100) * circumference;
  // Always show at least minVisibleLength, even at 0%
  const progressDashLength = totalCount > 0 
    ? Math.max(minVisibleLength, calculatedDashLength)
    : minVisibleLength;
  
  // Ensure values are valid numbers
  const finalDashLength = isNaN(progressDashLength) ? minVisibleLength : Math.max(5, Math.round(progressDashLength));
  const finalCircumference = isNaN(circumference) ? 327 : Math.round(circumference);
  
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
      strokeDasharray: `${finalDashLength} ${finalCircumference}`
    });
    
    // Also log the actual DOM element to verify it exists
    setTimeout(() => {
      const circle = document.querySelector('.progress-ring-circle');
      const bgCircle = document.querySelector('.progress-ring-circle-bg');
      const svg = document.querySelector('.progress-ring');
      const progressText = document.querySelector('.progress-text');
      const progressNumber = document.querySelector('.progress-number');
      const progressLabel = document.querySelector('.progress-label');
      
      console.log("Progress circle DOM check:", {
        svg: svg ? 'FOUND' : 'NOT FOUND',
        circle: circle ? {
          strokeDasharray: circle.getAttribute('stroke-dasharray'),
          stroke: circle.getAttribute('stroke'),
          strokeWidth: circle.getAttribute('stroke-width'),
          r: circle.getAttribute('r'),
          cx: circle.getAttribute('cx'),
          cy: circle.getAttribute('cy'),
          opacity: window.getComputedStyle(circle).opacity,
          display: window.getComputedStyle(circle).display,
          visibility: window.getComputedStyle(circle).visibility
        } : 'NOT FOUND',
        bgCircle: bgCircle ? {
          stroke: bgCircle.getAttribute('stroke'),
          display: window.getComputedStyle(bgCircle).display
        } : 'NOT FOUND',
        progressText: progressText ? {
          textContent: progressText.textContent,
          innerHTML: progressText.innerHTML,
          opacity: window.getComputedStyle(progressText).opacity,
          display: window.getComputedStyle(progressText).display,
          visibility: window.getComputedStyle(progressText).visibility,
          zIndex: window.getComputedStyle(progressText).zIndex,
          color: window.getComputedStyle(progressText).color,
          top: window.getComputedStyle(progressText).top,
          left: window.getComputedStyle(progressText).left
        } : 'NOT FOUND',
        progressNumber: progressNumber ? {
          textContent: progressNumber.textContent,
          innerHTML: progressNumber.innerHTML,
          opacity: window.getComputedStyle(progressNumber).opacity,
          display: window.getComputedStyle(progressNumber).display,
          visibility: window.getComputedStyle(progressNumber).visibility,
          color: window.getComputedStyle(progressNumber).color,
          fontSize: window.getComputedStyle(progressNumber).fontSize
        } : 'NOT FOUND',
        progressLabel: progressLabel ? {
          textContent: progressLabel.textContent,
          display: window.getComputedStyle(progressLabel).display
        } : 'NOT FOUND'
      });
    }, 500);
  }, [completedCount, totalCount, progress, checklist.length, finalCircumference, finalDashLength, minVisibleLength, progressPercent]);
  
  // Function to calculate estimated remaining processing time based on incomplete steps
  const calculateEstimatedRemainingTime = () => {
    if (!checklist || checklist.length === 0) {
      return visaOption?.estimated_timeline || "—";
    }
    
    const completed = checklist.filter((item) => item && item.completed).length;
    const total = checklist.length;
    
    // Get all incomplete steps with duration estimates
    const incompleteSteps = checklist.filter((item) => item && !item.completed && item.estimatedDuration);
    
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
      if (typeof duration === 'number' && duration > 0) {
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
      return `~${weeks} week${weeks !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''}`;
    } else if (weeks > 0) {
      return `~${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else {
      return `~${totalDays} day${totalDays !== 1 ? 's' : ''}`;
    }
  };
  
  // Function to get the next incomplete step
  const getNextStep = () => {
    const incompleteStep = checklist.find((item) => item && !item.completed);
    if (incompleteStep) {
      return incompleteStep.title || incompleteStep.name || "Continue with next step";
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
                <svg 
                  className="progress-ring" 
                  width="120" 
                  height="120" 
                  viewBox="0 0 120 120"
                >
                  {/* Background circle - always visible */}
                  <circle
                    className="progress-ring-circle-bg"
                    stroke="#E8F1FF"
                    strokeWidth="8"
                    fill="none"
                    r="52"
                    cx="60"
                    cy="60"
                  />
                  {/* Progress circle - shows completion */}
                  <circle
                    className="progress-ring-circle"
                    stroke="#4A90E2"
                    strokeWidth="8"
                    fill="none"
                    r="52"
                    cx="60"
                    cy="60"
                    strokeDasharray={`${finalDashLength} ${finalCircumference}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="progress-text">
                  <span className="progress-number" style={{ display: 'block', color: '#4A90E2', fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {progress || 0}%
                  </span>
                  <span className="progress-label" style={{ display: 'block', color: '#666666', fontSize: '0.85rem' }}>
                    Complete
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="visa-info-card">
            <div className="info-row">
              <div className="info-col">
                <span className="info-label">Processing Time</span>
                <span className="info-value">
                  {processingTime}
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
                  {getNextStep()}
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
