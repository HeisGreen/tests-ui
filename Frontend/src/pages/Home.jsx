import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { recommendationsAPI, checklistProgressAPI, messagingAPI } from "../utils/api";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiList,
  FiTrendingUp,
  FiCalendar,
  FiTarget,
  FiMessageCircle,
  FiUsers,
  FiUser,
} from "react-icons/fi";
import { initScrollAnimations } from "../utils/scrollAnimation";
import "./Home.css";

function Home() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latest, setLatest] = useState(null); // latest RecommendationRecord
  const [historyCount, setHistoryCount] = useState(0);
  const [activeChecklists, setActiveChecklists] = useState([]);
  const [loadingChecklists, setLoadingChecklists] = useState(true);
  const [checklistData, setChecklistData] = useState({}); // Map of visa_type -> checklist items
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

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

  // Show only checklists with progress > 0%
  // Defined early so it can be used in useEffect hooks
  const activeChecklistsWithProgress = useMemo(() => {
    return activeChecklists.filter((checklist) => {
      if (!checklist || !(checklist.visa_type || checklist.visaType)) {
        return false;
      }
      // Calculate progress percentage
      const progressJson = checklist.progress_json || checklist.progressJson || {};
      const items = Object.values(progressJson);
      if (items.length === 0) return false;
      const completed = items.filter((v) => v === true).length;
      const progressPercent = Math.round((completed / items.length) * 100);
      // Only show checklists with progress > 0%
      return progressPercent > 0;
    });
  }, [activeChecklists]);

  // Re-initialize scroll animations when checklist cards are loaded
  useEffect(() => {
    if (!loadingChecklists && activeChecklistsWithProgress.length > 0) {
      // Use multiple attempts to ensure cards become visible
      const makeCardsVisible = () => {
        const cards = document.querySelectorAll('.checklist-card.scroll-animate');
        
        // First pass: Check if cards are already in viewport and make them visible immediately
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const isInView = rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0 && rect.height > 0;
          // If card is in viewport or close to it, make it visible immediately
          if (isInView || rect.top < 300) {
            card.classList.add('animate-in');
          }
        });
        
        // Initialize scroll animations for cards not yet visible
        initScrollAnimations();
      };
      
      // Multiple attempts with increasing delays to catch cards at different render stages
      requestAnimationFrame(() => {
        makeCardsVisible();
        
        // Second attempt after a short delay
        setTimeout(() => {
          makeCardsVisible();
        }, 100);
        
        // Final fallback: Force all cards visible if they're still not animated after 300ms
        setTimeout(() => {
          const hiddenCards = document.querySelectorAll('.checklist-card.scroll-animate:not(.animate-in)');
          hiddenCards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            // If card exists in DOM and has dimensions, make it visible
            if (rect.width > 0 && rect.height > 0) {
              card.classList.add('animate-in');
            }
          });
        }, 300);
      });
    }
  }, [loadingChecklists, activeChecklistsWithProgress.length]);

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
        const latestRecord = history[0] || null;

        // Debug: Check what we're getting
        if (latestRecord) {
          console.log("=== DEBUG: Latest record ===");
          console.log("Full record:", JSON.stringify(latestRecord, null, 2));
          console.log("created_at value:", latestRecord.created_at);
          console.log("created_at type:", typeof latestRecord.created_at);
          console.log("All keys:", Object.keys(latestRecord));
        } else {
          console.log(
            "No latest record found. History length:",
            history.length
          );
        }

        setLatest(latestRecord);
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

  // Load active checklists (checklists with saved progress) and fetch checklist data
  useEffect(() => {
    let cancelled = false;

    const loadChecklists = async () => {
      try {
        setLoadingChecklists(true);
        const progressList = await checklistProgressAPI.getAllProgress();
        if (cancelled) return;
        console.log("Loaded checklist progress:", progressList);
        console.log("Progress list length:", progressList?.length);
        if (progressList && Array.isArray(progressList)) {
          console.log("Setting active checklists:", progressList);
          setActiveChecklists(progressList);
          // Fetch cached checklist items per visa_type so we can show durations/steps
          try {
            const entries = await Promise.all(
              progressList.map(async (p) => {
                const vt = p?.visa_type || p?.visaType;
                if (!vt) return null;
                try {
                  const res = await recommendationsAPI.getChecklistCached(vt);
                  if (res?.checklist && Array.isArray(res.checklist)) {
                    return [vt, res.checklist];
                  }
                } catch (err) {
                  console.warn("Error loading cached checklist for", vt, err);
                }
                return null;
              })
            );
            const checklistMap = {};
            entries.filter(Boolean).forEach(([vt, list]) => {
              checklistMap[vt] = list;
            });
            if (!cancelled) {
              setChecklistData(checklistMap);
            }
          } catch (err) {
            console.warn("Error loading checklist data from cache:", err);
          }
        } else {
          console.warn("Progress list is not an array:", progressList);
          setActiveChecklists([]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading active checklists:", err);
        setActiveChecklists([]);
      } finally {
        if (cancelled) return;
        setLoadingChecklists(false);
      }
    };

    loadChecklists();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load recent conversations for users
  useEffect(() => {
    if (user?.role === "USER") {
      const loadConversations = async () => {
        try {
          setLoadingConversations(true);
          const data = await messagingAPI.getConversations();
          setConversations(data);
        } catch (err) {
          console.error("Error loading conversations:", err);
        } finally {
          setLoadingConversations(false);
        }
      };
      loadConversations();
    }
  }, [user]);

  // Calculate progress percentage for a checklist
  const getChecklistProgress = (progressJson) => {
    if (!progressJson || typeof progressJson !== "object") return 0;
    const items = Object.values(progressJson);
    if (items.length === 0) return 0;
    const completed = items.filter((v) => v === true).length;
    return Math.round((completed / items.length) * 100);
  };

  // Calculate estimated remaining processing time for a checklist
  const calculateEstimatedRemainingTime = (visaType, progressJson) => {
    const checklistItems = checklistData[visaType];
    if (
      !checklistItems ||
      !Array.isArray(checklistItems) ||
      checklistItems.length === 0
    ) {
      return "—";
    }

    // Get incomplete steps with duration estimates
    const incompleteSteps = checklistItems.filter((item, idx) => {
      const itemId = item?.id || `step-${idx + 1}`;
      const isCompleted = progressJson[itemId] === true;
      return !isCompleted && item?.estimated_duration;
    });

    if (incompleteSteps.length === 0) {
      // Check if all steps are completed
      const allCompleted = Object.values(progressJson).every((v) => v === true);
      return allCompleted ? "Completed" : "—";
    }

    // Sum up estimated durations for incomplete steps
    const totalDays = incompleteSteps.reduce((sum, step) => {
      const duration = step.estimated_duration;
      if (typeof duration === "number" && duration > 0) {
        return sum + duration;
      }
      return sum;
    }, 0);

    if (totalDays === 0) {
      return "—";
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
      return "#22C55E"; // green
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
            {(() => {
              if (!latest) {
                return "—";
              }

              // Log everything for debugging
              console.log("Latest object:", latest);
              console.log("Latest keys:", Object.keys(latest));

              // Try different possible field names
              const dateValue =
                latest.created_at ||
                latest.createdAt ||
                latest.date ||
                latest["created_at"];

              console.log("Date value found:", dateValue);

              if (!dateValue) {
                console.warn("No date field found. Full object:", latest);
                return "—";
              }

              try {
                // Handle string dates
                let date;
                if (typeof dateValue === "string") {
                  // Remove trailing Z if present for better compatibility
                  const cleanDate = dateValue.replace(/Z$/, "");
                  date = new Date(cleanDate);
                } else if (dateValue instanceof Date) {
                  date = dateValue;
                } else {
                  date = new Date(dateValue);
                }

                if (isNaN(date.getTime())) {
                  console.warn("Invalid date:", dateValue, "parsed as:", date);
                  return "—";
                }

                const formatted = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                console.log("Formatted date:", formatted);
                return formatted;
              } catch (e) {
                console.error("Date parsing error:", e, "value:", dateValue);
                return "—";
              }
            })()}
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
                        {visa.estimated_timeline || visa.processing_time || "—"}
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

      {loadingChecklists ? (
        <div className="home-section">
          <div className="section-header">
            <h2>Active Checklists</h2>
          </div>
          <div className="empty-state">
            <p>Loading your checklists…</p>
          </div>
        </div>
      ) : activeChecklistsWithProgress.length > 0 ? (
        <div className="home-section">
          <div className="section-header">
            <h2>Active Checklists</h2>
            <span className="section-subtitle">
              {activeChecklistsWithProgress.length} checklist
              {activeChecklistsWithProgress.length !== 1 ? "s" : ""} in progress
            </span>
          </div>
          <div className="checklists-grid">
            {activeChecklistsWithProgress.length === 0 ? (
              <div className="empty-state">
                <p>No active checklists found.</p>
              </div>
            ) : activeChecklistsWithProgress.filter(
                (c) => c && (c.visa_type || c.visaType)
              ).length === 0 ? (
              <div className="empty-state">
                <p>Checklists found but missing visa_type field.</p>
                <pre
                  style={{
                    fontSize: "0.8rem",
                    textAlign: "left",
                    maxWidth: "100%",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(activeChecklistsWithProgress, null, 2)}
                </pre>
              </div>
            ) : (
              activeChecklistsWithProgress
                .map((checklist, index) => {
                  console.log(`Rendering checklist card ${index}:`, checklist);

                  // Handle missing or invalid data
                  if (!checklist) {
                    console.warn(
                      `Checklist at index ${index} is null/undefined`
                    );
                    return null;
                  }

                  const visaType =
                    checklist.visa_type ||
                    checklist.visaType ||
                    `Checklist ${index + 1}`;
                  const progressJson =
                    checklist.progress_json || checklist.progressJson || {};
                  const progressPercent = getChecklistProgress(progressJson);
                  const completedCount = Object.values(progressJson).filter(
                    (v) => v === true
                  ).length;
                  const totalCount = Object.keys(progressJson).length || 0;
                  const estimatedTime = calculateEstimatedRemainingTime(
                    visaType,
                    progressJson
                  );

                  console.log(`Checklist ${index} details:`, {
                    visaType,
                    progressPercent,
                    completedCount,
                    totalCount,
                    progressJson,
                    estimatedTime,
                  });

                  return (
                    <Link
                      key={checklist.id || `checklist-${index}`}
                      to={`/checklist/${encodeURIComponent(visaType)}`}
                      className={`checklist-card scroll-animate ${progressPercent === 100 ? 'checklist-completed' : ''}`}
                    >
                      <div className="checklist-card-header">
                        <div className={`checklist-icon ${progressPercent === 100 ? 'completed' : ''}`}>
                          {progressPercent === 100 ? (
                            <FiCheckCircle />
                          ) : (
                            <FiTarget />
                          )}
                        </div>
                        <div className="checklist-title-section">
                          <h3>{visaType}</h3>
                          <p className="checklist-meta">
                            {totalCount > 0 ? (
                              <>
                                <span className="checklist-stats">
                                  <FiTrendingUp className="stats-icon" />
                                  {completedCount} of {totalCount} steps
                                </span>
                              </>
                            ) : (
                              "Getting started..."
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="checklist-progress-container">
                        <div className="checklist-progress-header">
                          <span className="progress-label">Progress</span>
                          <span className="progress-percentage">{progressPercent}%</span>
                        </div>
                        <div className="checklist-progress-bar">
                          <div
                            className="checklist-progress-fill"
                            style={{ width: `${Math.max(progressPercent, 0)}%` }}
                          >
                            {progressPercent > 0 && (
                              <div className="progress-shine"></div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="checklist-footer">
                        <div className="checklist-progress-info">
                          {estimatedTime !== "—" &&
                            estimatedTime !== "Completed" && (
                              <div className="checklist-time-badge">
                                <FiClock className="clock-icon" />
                                <span>{estimatedTime}</span>
                              </div>
                            )}
                          {estimatedTime === "Completed" && (
                            <div className="checklist-completed-badge">
                              <FiCheckCircle className="check-icon" />
                              <span>All done!</span>
                            </div>
                          )}
                          {totalCount > 0 && (
                            <div className="checklist-steps-badge">
                              <FiCalendar className="calendar-icon" />
                              <span>{totalCount - completedCount} remaining</span>
                            </div>
                          )}
                        </div>
                        <div className="checklist-action">
                          <span className="action-text">View Details</span>
                          <FiArrowRight className="arrow-icon" />
                        </div>
                      </div>
                    </Link>
                  );
                })
                .filter(Boolean)
            )}
          </div>
        </div>
      ) : null}

      {/* Recent Conversations Section (for users) */}
      {user?.role === "USER" && (
        <div className="home-section">
          <div className="section-header">
            <h2>Recent Messages</h2>
            <Link to="/messages" className="link-primary">
              View All <FiArrowRight />
            </Link>
          </div>

          {loadingConversations ? (
            <div className="empty-state">
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <FiMessageCircle size={48} style={{ color: "#999", marginBottom: "1rem" }} />
              <p>No conversations yet</p>
              <Link to="/agents" className="btn-primary">
                Find a Travel Agent
              </Link>
            </div>
          ) : (
            <div className="conversations-preview-grid">
              {conversations.slice(0, 3).map((conv) => {
                const formatTime = (dateString) => {
                  if (!dateString) return "Just now";
                  
                  try {
                    let date;
                    if (typeof dateString === "string") {
                      const cleanDate = dateString.replace(/Z$/, "");
                      date = new Date(cleanDate);
                    } else if (dateString instanceof Date) {
                      date = dateString;
                    } else {
                      date = new Date(dateString);
                    }

                    if (isNaN(date.getTime())) {
                      return "Just now";
                    }

                    const now = new Date();
                    const diffMs = now - date;
                    
                    if (diffMs < 0) {
                      return "Just now";
                    }

                    const diffMins = Math.floor(diffMs / 60000);

                    // Less than 1 minute: "Just now"
                    if (diffMins < 1) return "Just now";
                    
                    // 1 minute or more: Show time in HH:MM format
                    const hours = date.getHours().toString().padStart(2, "0");
                    const minutes = date.getMinutes().toString().padStart(2, "0");
                    return `${hours}:${minutes}`;
                  } catch (error) {
                    return "Just now";
                  }
                };

                return (
                  <Link
                    key={conv.id}
                    to={`/messages/${conv.id}`}
                    className="conversation-preview-card"
                  >
                    <div className="conversation-preview-header">
                      <div className="conversation-preview-avatar">
                        <FiUser />
                      </div>
                      <div className="conversation-preview-info">
                        <div className="conversation-preview-name-group">
                          <h4>{conv.agent_name || conv.agent_business_name || "Travel Agent"}</h4>
                          {conv.agent_business_name && conv.agent_owner_name && (
                            <span className="conversation-preview-subtitle">
                              {conv.agent_owner_name}
                            </span>
                          )}
                        </div>
                        <span className="conversation-preview-time">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      {conv.unread_count > 0 && (
                        <div className="conversation-preview-badge">
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                    <p className="conversation-preview-text">
                      {conv.last_message_preview || "No messages yet"}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

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
          <Link to="/messages" className="action-card">
            <div className="action-icon green">
              <FiMessageCircle />
            </div>
            <h3>Messages</h3>
            <p>Chat with travel agents</p>
          </Link>
          <Link to="/profile" className="action-card">
            <div className="action-icon teal">
              <FiCheckCircle />
            </div>
            <h3>Update Profile</h3>
            <p>Keep your information up to date</p>
          </Link>
          {user?.role !== "TRAVEL_AGENT" && (
            <Link to="/agents" className="action-card">
              <div className="action-icon orange">
                <FiMessageCircle />
              </div>
              <h3>Talk to a Travel Agent</h3>
              <p>Get personalized help from experts</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
