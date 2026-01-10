import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { recommendationsAPI, checklistProgressAPI, messagingAPI, documentsAPI } from "../utils/api";
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiTrendingUp,
  FiCalendar,
  FiTarget,
  FiMessageCircle,
  FiUser,
  FiGlobe,
  FiFolder,
  FiCompass,
  FiZap,
  FiUsers,
  FiPlus,
  FiChevronRight,
  FiActivity,
  FiAward,
  FiMapPin,
  FiStar,
  FiSend,
  FiBookOpen,
  FiHeart,
  FiShield,
  FiTrendingDown,
  FiAlertCircle,
  FiInfo,
  FiUpload,
  FiEdit3,
  FiNavigation,
  FiFlag,
  FiCoffee,
  FiSun,
  FiMoon,
  FiCloudRain,
  FiWind,
  FiRefreshCw,
  FiExternalLink,
  FiBriefcase,
  FiHome,
  FiDollarSign,
  FiPercent,
  FiLayers,
  FiPieChart,
  FiBarChart2,
} from "react-icons/fi";
import "./Home.css";

// Animation variants
const pageTransition = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  }
};

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerCards = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

// Tips data
const migrationTips = [
  { id: 1, icon: FiShield, title: "Keep documents updated", desc: "Ensure all your documents are current and valid for at least 6 months" },
  { id: 2, icon: FiClock, title: "Apply early", desc: "Start your visa application process at least 3-6 months before your planned move" },
  { id: 3, icon: FiDollarSign, title: "Financial preparation", desc: "Have proof of funds ready showing you can support yourself abroad" },
  { id: 4, icon: FiBriefcase, title: "Job market research", desc: "Research job opportunities and requirements in your destination country" },
];

// Popular destinations
const popularDestinations = [
  { country: "Canada", flag: "🇨🇦", visaTypes: 12, avgTime: "6-12 months" },
  { country: "Germany", flag: "🇩🇪", visaTypes: 8, avgTime: "3-6 months" },
  { country: "Australia", flag: "🇦🇺", visaTypes: 15, avgTime: "4-8 months" },
  { country: "United Kingdom", flag: "🇬🇧", visaTypes: 10, avgTime: "3-8 weeks" },
  { country: "United States", flag: "🇺🇸", visaTypes: 20, avgTime: "varies" },
];

// Journey milestones
const journeyMilestones = [
  { id: 1, title: "Profile Created", icon: FiUser, completed: true },
  { id: 2, title: "First Recommendation", icon: FiCompass, completed: false },
  { id: 3, title: "Documents Uploaded", icon: FiFolder, completed: false },
  { id: 4, title: "Agent Connected", icon: FiUsers, completed: false },
  { id: 5, title: "Checklist Started", icon: FiTarget, completed: false },
  { id: 6, title: "Application Ready", icon: FiAward, completed: false },
];

function Home() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latest, setLatest] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [activeChecklists, setActiveChecklists] = useState([]);
  const [loadingChecklists, setLoadingChecklists] = useState(true);
  const [checklistData, setChecklistData] = useState({});
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Rotate tips
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % migrationTips.length);
    }, 8000);
    return () => clearInterval(tipTimer);
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const options = useMemo(() => {
    const out = latest?.output_data;
    const opts = out?.options;
    return Array.isArray(opts) ? opts : [];
  }, [latest]);

  const activeChecklistsWithProgress = useMemo(() => {
    return activeChecklists.filter((checklist) => {
      if (!checklist || !(checklist.visa_type || checklist.visaType)) {
        return false;
      }
      const progressJson = checklist.progress_json || checklist.progressJson || {};
      const items = Object.values(progressJson);
      if (items.length === 0) return false;
      const completed = items.filter((v) => v === true).length;
      const progressPercent = Math.round((completed / items.length) * 100);
      return progressPercent > 0;
    });
  }, [activeChecklists]);

  const totalProgress = useMemo(() => {
    if (activeChecklistsWithProgress.length === 0) return 0;
    const sum = activeChecklistsWithProgress.reduce((acc, checklist) => {
      const progressJson = checklist.progress_json || checklist.progressJson || {};
      const items = Object.values(progressJson);
      if (items.length === 0) return acc;
      const completed = items.filter((v) => v === true).length;
      return acc + Math.round((completed / items.length) * 100);
    }, 0);
    return Math.round(sum / activeChecklistsWithProgress.length);
  }, [activeChecklistsWithProgress]);

  // Calculate profile completion
  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    let score = 0;
    if (user.name) score += 15;
    if (user.email) score += 15;
    if (user.profile_picture_url) score += 10;
    if (user.nationality) score += 15;
    if (user.current_country) score += 10;
    if (user.occupation) score += 10;
    if (user.education_level) score += 10;
    if (user.budget) score += 5;
    if (user.preferred_countries?.length > 0) score += 10;
    return Math.min(score, 100);
  }, [user]);

  // Calculate milestones
  const completedMilestones = useMemo(() => {
    let completed = [];
    completed.push(1); // Profile created (since they're logged in)
    if (historyCount > 0) completed.push(2);
    if (documents.length > 0) completed.push(3);
    if (conversations.length > 0) completed.push(4);
    if (activeChecklistsWithProgress.length > 0) completed.push(5);
    if (totalProgress === 100) completed.push(6);
    return completed;
  }, [historyCount, documents, conversations, activeChecklistsWithProgress, totalProgress]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        setLoading(true);
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
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadChecklists = async () => {
      try {
        setLoadingChecklists(true);
        const progressList = await checklistProgressAPI.getAllProgress();
        if (cancelled) return;
        if (progressList && Array.isArray(progressList)) {
          setActiveChecklists(progressList);
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
    return () => { cancelled = true; };
  }, []);

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

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const docs = await documentsAPI.getDocuments();
        setDocuments(docs || []);
      } catch (err) {
        console.error("Error loading documents:", err);
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };
    loadDocuments();
  }, []);

  const getChecklistProgress = (progressJson) => {
    if (!progressJson || typeof progressJson !== "object") return 0;
    const items = Object.values(progressJson);
    if (items.length === 0) return 0;
    const completed = items.filter((v) => v === true).length;
    return Math.round((completed / items.length) * 100);
  };

  const calculateEstimatedRemainingTime = (visaType, progressJson) => {
    const checklistItems = checklistData[visaType];
    if (!checklistItems || !Array.isArray(checklistItems) || checklistItems.length === 0) {
      return "—";
    }

    const incompleteSteps = checklistItems.filter((item, idx) => {
      const itemId = item?.id || `step-${idx + 1}`;
      const isCompleted = progressJson[itemId] === true;
      return !isCompleted && item?.estimated_duration;
    });

    if (incompleteSteps.length === 0) {
      const allCompleted = Object.values(progressJson).every((v) => v === true);
      return allCompleted ? "Completed" : "—";
    }

    const totalDays = incompleteSteps.reduce((sum, step) => {
      const duration = step.estimated_duration;
      if (typeof duration === "number" && duration > 0) {
        return sum + duration;
      }
      return sum;
    }, 0);

    if (totalDays === 0) return "—";

    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    if (weeks > 0 && days > 0) {
      return `~${weeks}w ${days}d`;
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
    if (l.includes("approved") || l.includes("granted") || l.includes("eligible") || l.includes("high") || l.includes("strong") || l.includes("good")) {
      return "success";
    }
    if (l.includes("denied") || l.includes("rejected") || l.includes("refused") || l.includes("not_eligible") || l.includes("ineligible")) {
      return "danger";
    }
    if (l.includes("pending") || l.includes("in_review") || l.includes("review") || l.includes("processing") || l.includes("awaiting")) {
      return "warning";
    }
    if (l.includes("unlikely") || l.includes("low") || l.includes("challenging")) {
      return "muted";
    }
    return "success";
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Just now";
    try {
      let date;
      if (typeof dateString === "string") {
        date = new Date(dateString.replace(/Z$/, ""));
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        date = new Date(dateString);
      }
      if (isNaN(date.getTime())) return "Just now";
      const now = new Date();
      const diffMs = now - date;
      if (diffMs < 0) return "Just now";
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Just now";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatCurrentDate = () => {
    return currentTime.toLocaleDateString("en-US", { 
      weekday: "long", 
      month: "long", 
      day: "numeric" 
    });
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString("en-US", { 
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const unreadCount = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [conversations]);

  const currentTip = migrationTips[currentTipIndex];

  return (
    <motion.div 
      className="home-v2"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
    >
      {/* Ambient Background */}
      <div className="home-ambient">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
        <div className="grid-overlay" />
      </div>

      <div className="home-content">
        {/* Hero Section */}
        <motion.section className="hero-section" variants={slideUp}>
          <div className="hero-left">
            <div className="hero-meta">
              <span className="hero-date">{formatCurrentDate()}</span>
              <span className="hero-time">{formatCurrentTime()}</span>
            </div>
            <h1 className="hero-title">
              {getGreeting()}, <span className="hero-name">{user?.name?.split(" ")[0] || "Explorer"}</span>
            </h1>
            <p className="hero-subtitle">
              Your migration journey awaits. Track progress, explore options, and take the next step toward your goals.
            </p>
            <div className="hero-actions">
              <Link to="/recommendation" className="hero-btn hero-btn-primary">
                <FiCompass />
                <span>Get Recommendations</span>
              </Link>
              <Link to="/profile" className="hero-btn hero-btn-secondary">
                <FiUser />
                <span>View Profile</span>
              </Link>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-profile-card">
              <div className="profile-glow" />
                {user?.profile_picture_url ? (
                  <img 
                    src={user.profile_picture_url} 
                    alt={user?.name || "Profile"} 
                  className="hero-avatar"
                  />
                ) : (
                <div className="hero-avatar-placeholder">
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              <div className="profile-info">
                <h3>{user?.name || "Welcome"}</h3>
                <span className="profile-role">
                  {user?.role === "TRAVEL_AGENT" ? "Travel Agent" : "Explorer"}
                </span>
              </div>
              <div className="profile-completion-mini">
                <div className="completion-header">
                  <span>Profile Completion</span>
                  <span className="completion-percent">{profileCompletion}%</span>
            </div>
                <div className="completion-bar">
                  <motion.div 
                    className="completion-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
              <div className="profile-stats-mini">
                <div className="mini-stat">
                  <span className="mini-stat-value">{historyCount}</span>
                  <span className="mini-stat-label">Saved</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-value">{activeChecklistsWithProgress.length}</span>
                  <span className="mini-stat-label">Active</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-value">{options.length}</span>
                  <span className="mini-stat-label">Options</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Bento Grid */}
        <motion.div className="bento-grid" variants={staggerCards}>
          
          {/* Progress Overview - Large Card */}
          <motion.div className="bento-card bento-progress" variants={scaleIn}>
            <div className="bento-card-header">
              <div className="bento-icon bento-icon-gradient">
                <FiActivity />
              </div>
              <h3>Journey Progress</h3>
            </div>
            <div className="progress-overview">
              <div className="progress-circle-container">
                <svg className="progress-circle" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b4a" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <circle className="progress-circle-bg" cx="50" cy="50" r="42" />
                  <motion.circle 
                    className="progress-circle-fill"
                    cx="50" 
                    cy="50" 
                    r="42"
                    initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 - (264 * totalProgress / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  />
                </svg>
                <div className="progress-circle-text">
                  <span className="progress-value">{totalProgress}</span>
                  <span className="progress-percent">%</span>
                </div>
              </div>
              <div className="progress-details">
                <div className="progress-detail-row">
                  <span className="detail-label">Active Checklists</span>
                  <span className="detail-value">{activeChecklistsWithProgress.length}</span>
                </div>
                <div className="progress-detail-row">
                  <span className="detail-label">Visa Options Explored</span>
                  <span className="detail-value">{options.length}</span>
                </div>
                <div className="progress-detail-row">
                  <span className="detail-label">Documents Uploaded</span>
                  <span className="detail-value">{documents.length}</span>
                </div>
                <div className="progress-detail-row">
                  <span className="detail-label">Saved Recommendations</span>
                  <span className="detail-value">{historyCount}</span>
                </div>
                <Link to="/recommendation" className="progress-action">
                  <span>Continue Journey</span>
                  <FiArrowRight />
            </Link>
          </div>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div className="bento-card bento-stats" variants={scaleIn}>
            <div className="stats-grid-mini">
              <div className="stat-mini stat-mini-coral">
              <FiFileText />
                <div className="stat-mini-content">
                  <span className="stat-mini-value">{historyCount}</span>
                  <span className="stat-mini-label">Recommendations</span>
            </div>
            </div>
              <div className="stat-mini stat-mini-emerald">
              <FiGlobe />
                <div className="stat-mini-content">
                  <span className="stat-mini-value">{options.length}</span>
                  <span className="stat-mini-label">Visa Options</span>
            </div>
            </div>
              <div className="stat-mini stat-mini-violet">
              <FiTarget />
                <div className="stat-mini-content">
                  <span className="stat-mini-value">{activeChecklistsWithProgress.length}</span>
                  <span className="stat-mini-label">In Progress</span>
            </div>
            </div>
              <div className="stat-mini stat-mini-amber">
                <FiFolder />
                <div className="stat-mini-content">
                  <span className="stat-mini-value">{documents.length}</span>
                  <span className="stat-mini-label">Documents</span>
            </div>
              </div>
            </div>
          </motion.div>

          {/* Milestones Card */}
          <motion.div className="bento-card bento-milestones" variants={scaleIn}>
            <div className="bento-card-header">
              <div className="bento-icon bento-icon-amber">
                <FiAward />
              </div>
              <h3>Journey Milestones</h3>
              <span className="milestone-count">{completedMilestones.length}/{journeyMilestones.length}</span>
            </div>
            <div className="milestones-list">
              {journeyMilestones.map((milestone, index) => {
                const isCompleted = completedMilestones.includes(milestone.id);
                const MilestoneIcon = milestone.icon;
                return (
                  <div 
                    key={milestone.id} 
                    className={`milestone-item ${isCompleted ? 'completed' : ''}`}
                  >
                    <div className={`milestone-icon ${isCompleted ? 'done' : ''}`}>
                      {isCompleted ? <FiCheckCircle /> : <MilestoneIcon />}
              </div>
                    <span className="milestone-title">{milestone.title}</span>
                    {isCompleted && <span className="milestone-check">✓</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Visa Recommendations */}
          <motion.div className="bento-card bento-recommendations" variants={scaleIn}>
            <div className="bento-card-header">
              <div className="bento-icon bento-icon-coral">
                <FiCompass />
              </div>
              <h3>Visa Options</h3>
              <Link to="/recommendation" className="bento-card-link">
                View All <FiChevronRight />
              </Link>
            </div>

            {loading ? (
              <div className="bento-loading">
                <div className="loading-pulse" />
                <span>Loading recommendations...</span>
              </div>
            ) : options.length === 0 ? (
              <div className="bento-empty">
                <div className="empty-illustration">
                  <FiCompass />
                </div>
                <h4>Start Your Journey</h4>
                <p>Get personalized visa recommendations based on your profile</p>
                <Link to="/recommendation" className="empty-action">
                  <FiZap />
                  <span>Get Started</span>
                </Link>
              </div>
            ) : (
              <div className="visa-options-list">
                {options.slice(0, 4).map((visa, index) => (
                  <motion.div
                    key={`${visa.visa_type}-${index}`}
                    className="visa-option-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="visa-option-left">
                      <div className={`visa-indicator visa-indicator-${getVisaStateColor(visa)}`} />
                      <div className="visa-option-info">
                        <h4>{visa.visa_type || "Visa Option"}</h4>
                        <div className="visa-meta">
                          <span><FiClock /> {visa.estimated_timeline || "Varies"}</span>
                          <span><FiTrendingUp /> {visa.estimated_costs || "Varies"}</span>
                    </div>
                      </div>
                    </div>
                    <Link
                      to={`/checklist/${encodeURIComponent(visa.visa_type || "visa")}`}
                      state={{ visaOption: visa }}
                      className="visa-option-action"
                    >
                      <FiArrowRight />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Active Checklists */}
          <motion.div className="bento-card bento-checklists" variants={scaleIn}>
            <div className="bento-card-header">
              <div className="bento-icon bento-icon-emerald">
                <FiCheckCircle />
                </div>
              <h3>Active Checklists</h3>
              </div>

            {loadingChecklists ? (
              <div className="bento-loading">
                <div className="loading-pulse" />
              </div>
            ) : activeChecklistsWithProgress.length === 0 ? (
              <div className="bento-empty compact">
                <FiTarget className="empty-icon-small" />
                <p>No active checklists yet</p>
                <Link to="/recommendation" className="empty-action-small">Get recommendations first</Link>
              </div>
            ) : (
              <div className="checklists-compact">
                {activeChecklistsWithProgress.slice(0, 3).map((checklist, index) => {
                  const visaType = checklist.visa_type || checklist.visaType;
                  const progressJson = checklist.progress_json || checklist.progressJson || {};
                  const progressPercent = getChecklistProgress(progressJson);
                  const estimatedTime = calculateEstimatedRemainingTime(visaType, progressJson);

                  return (
                    <Link
                      key={checklist.id || `checklist-${index}`}
                      to={`/checklist/${encodeURIComponent(visaType)}`}
                      className="checklist-compact-item"
                    >
                      <div className="checklist-compact-info">
                        <span className="checklist-name">{visaType}</span>
                        <span className="checklist-percent">{progressPercent}%</span>
                        </div>
                      <div className="checklist-bar-container">
                        <motion.div 
                          className="checklist-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                          />
                        </div>
                      {estimatedTime !== "—" && (
                        <div className="checklist-time">
                            <FiClock /> {estimatedTime}
                      </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Documents Overview */}
          <motion.div className="bento-card bento-documents" variants={scaleIn}>
            <div className="bento-card-header">
              <div className="bento-icon bento-icon-sky">
                <FiFolder />
              </div>
              <h3>Documents</h3>
              <Link to="/documents" className="bento-card-link">
                Manage <FiChevronRight />
              </Link>
            </div>
            
            {loadingDocuments ? (
              <div className="bento-loading">
                <div className="loading-pulse" />
              </div>
            ) : documents.length === 0 ? (
              <div className="bento-empty compact">
                <FiUpload className="empty-icon-small" />
                <p>No documents uploaded</p>
                <Link to="/documents" className="empty-action-small">Upload documents</Link>
              </div>
            ) : (
              <div className="documents-compact">
                <div className="documents-summary">
                  <div className="doc-stat">
                    <FiFileText />
                    <span>{documents.length} files</span>
                  </div>
                </div>
                <div className="recent-docs-list">
                  {documents.slice(0, 3).map((doc, index) => (
                    <div key={doc.id || index} className="recent-doc-item">
                      <FiFileText className="doc-icon" />
                      <span className="doc-name">{doc.original_filename || doc.name || "Document"}</span>
                    </div>
                  ))}
                </div>
                <Link to="/documents" className="view-all-docs">
                  View all documents <FiArrowRight />
                </Link>
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div className="bento-card bento-actions" variants={scaleIn}>
            <div className="bento-card-header">
              <div className="bento-icon bento-icon-violet">
                <FiZap />
            </div>
              <h3>Quick Actions</h3>
                  </div>
            <div className="quick-actions-grid">
              <Link to="/recommendation" className="quick-action-item">
                <div className="quick-action-icon qa-coral">
                  <FiCompass />
                  </div>
                <span>Recommendations</span>
                </Link>
              <Link to="/documents" className="quick-action-item">
                <div className="quick-action-icon qa-emerald">
                  <FiFolder />
                </div>
                <span>Documents</span>
              </Link>
              <Link to="/messages" className="quick-action-item">
                <div className="quick-action-icon qa-violet">
                  <FiMessageCircle />
                </div>
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="qa-badge">{unreadCount}</span>
                )}
              </Link>
              <Link to="/profile" className="quick-action-item">
                <div className="quick-action-icon qa-sky">
                  <FiEdit3 />
                </div>
                <span>Edit Profile</span>
              </Link>
              {user?.role !== "TRAVEL_AGENT" && (
                <Link to="/agents" className="quick-action-item">
                  <div className="quick-action-icon qa-amber">
                    <FiUsers />
                  </div>
                  <span>Find Agent</span>
                </Link>
              )}
              <Link to="/faq" className="quick-action-item">
                <div className="quick-action-icon qa-rose">
                  <FiBookOpen />
            </div>
                <span>FAQ & Help</span>
              </Link>
            </div>
          </motion.div>

          {/* Tips Card */}
          <motion.div className="bento-card bento-tips" variants={scaleIn}>
            <div className="bento-card-header">
              <div className="bento-icon bento-icon-rose">
                <FiInfo />
              </div>
              <h3>Migration Tips</h3>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTipIndex}
                className="tip-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="tip-icon-large">
                  <currentTip.icon />
                </div>
                <h4>{currentTip.title}</h4>
                <p>{currentTip.desc}</p>
              </motion.div>
            </AnimatePresence>
            <div className="tip-indicators">
              {migrationTips.map((_, idx) => (
                <button 
                  key={idx}
                  className={`tip-dot ${idx === currentTipIndex ? 'active' : ''}`}
                  onClick={() => setCurrentTipIndex(idx)}
                />
              ))}
            </div>
          </motion.div>

          {/* Messages Preview */}
          {user?.role === "USER" && (
            <motion.div className="bento-card bento-messages" variants={scaleIn}>
              <div className="bento-card-header">
                <div className="bento-icon bento-icon-amber">
                  <FiMessageCircle />
                </div>
                <h3>Recent Messages</h3>
                <Link to="/messages" className="bento-card-link">
                  View All <FiChevronRight />
                </Link>
              </div>

              {loadingConversations ? (
                <div className="bento-loading">
                  <div className="loading-pulse" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="bento-empty compact">
                  <FiSend className="empty-icon-small" />
                  <p>No conversations yet</p>
                  <Link to="/agents" className="empty-action-small">Find an Agent</Link>
                </div>
              ) : (
                <div className="messages-compact">
                  {conversations.slice(0, 3).map((conv) => (
                    <Link
                      key={conv.id}
                      to={`/messages/${conv.id}`}
                      className="message-compact-item"
                    >
                      <div className="message-avatar-mini">
                        {conv.agent_name?.charAt(0) || "A"}
                      </div>
                      <div className="message-compact-content">
                        <div className="message-compact-top">
                          <span className="message-sender">{conv.agent_name || "Agent"}</span>
                          <span className="message-time">{formatTime(conv.last_message_at)}</span>
                        </div>
                        <p className="message-preview-text">{conv.last_message_preview || "No messages yet"}</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="message-unread-dot" />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Popular Destinations */}
          <motion.div className="bento-card bento-destinations" variants={scaleIn}>
            <div className="bento-card-header">
              <div className="bento-icon bento-icon-emerald">
                <FiMapPin />
        </div>
              <h3>Popular Destinations</h3>
      </div>
            <div className="destinations-list">
              {popularDestinations.slice(0, 4).map((dest, index) => (
                <motion.div 
                  key={dest.country}
                  className="destination-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 + 0.3 }}
                >
                  <span className="dest-flag">{dest.flag}</span>
                  <div className="dest-info">
                    <span className="dest-name">{dest.country}</span>
                    <span className="dest-meta">{dest.visaTypes} visa types • {dest.avgTime}</span>
    </div>
                  <FiChevronRight className="dest-arrow" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Explore Card */}
          <motion.div className="bento-card bento-explore" variants={scaleIn}>
            <div className="explore-content">
              <div className="explore-icon">
                <FiGlobe />
              </div>
              <h3>Explore More Options</h3>
              <p>Discover new visa pathways and opportunities tailored to your profile</p>
              <Link to="/recommendation" className="explore-btn">
                <span>Explore Now</span>
                <FiArrowRight />
              </Link>
            </div>
            <div className="explore-decoration">
              <div className="deco-circle deco-1" />
              <div className="deco-circle deco-2" />
              <div className="deco-circle deco-3" />
            </div>
          </motion.div>

          {/* Profile Completion Card */}
          <motion.div className="bento-card bento-profile-completion" variants={scaleIn}>
            <div className="bento-card-header">
              <div className="bento-icon bento-icon-violet">
                <FiUser />
              </div>
              <h3>Complete Your Profile</h3>
            </div>
            <div className="profile-completion-detail">
              <div className="completion-ring-container">
                <svg className="completion-ring" viewBox="0 0 80 80">
                  <circle className="completion-ring-bg" cx="40" cy="40" r="32" />
                  <motion.circle 
                    className="completion-ring-fill"
                    cx="40" 
                    cy="40" 
                    r="32"
                    initial={{ strokeDashoffset: 201 }}
                    animate={{ strokeDashoffset: 201 - (201 * profileCompletion / 100) }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  />
                </svg>
                <span className="completion-ring-text">{profileCompletion}%</span>
              </div>
              <div className="completion-info">
                <p>A complete profile helps us provide better recommendations</p>
                <Link to="/profile" className="complete-profile-btn">
                  <FiEdit3 />
                  <span>Complete Profile</span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Agent Connect Card (for users) */}
          {user?.role !== "TRAVEL_AGENT" && (
            <motion.div className="bento-card bento-agent-cta" variants={scaleIn}>
              <div className="agent-cta-content">
                <div className="agent-cta-icon">
                  <FiUsers />
                </div>
                <h3>Need Expert Help?</h3>
                <p>Connect with verified travel agents who specialize in your destination</p>
                <Link to="/agents" className="agent-cta-btn">
                  <span>Find an Agent</span>
                  <FiArrowRight />
                </Link>
              </div>
              <div className="agent-cta-badges">
                <span className="cta-badge"><FiShield /> Verified</span>
                <span className="cta-badge"><FiStar /> Expert</span>
                <span className="cta-badge"><FiMessageCircle /> 24/7</span>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </motion.div>
  );
}

export default Home;
