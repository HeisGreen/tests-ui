import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { travelAgentAPI, messagingAPI } from "../utils/api";
import {
  FiMessageCircle,
  FiMail,
  FiTrendingUp,
  FiClock,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";
import "./TravelAgentHome.css";

function TravelAgentHome() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    unreadMessages: 0,
    newInquiries: 0,
  });
  const [availability, setAvailability] = useState("available");
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load agent profile
      const agentProfile = await travelAgentAPI.getProfile();
      setProfile(agentProfile);
      
      const onboardingData = agentProfile.onboarding_data || {};
      setAvailability(onboardingData.availability_status || "available");

      // Load conversations
      const convs = await messagingAPI.getConversations();
      setConversations(convs);

      // Calculate stats
      const unreadCount = convs.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newInquiries = convs.filter(
        (conv) => new Date(conv.created_at) >= sevenDaysAgo
      ).length;

      setStats({
        totalConversations: convs.length,
        unreadMessages: unreadCount,
        newInquiries: newInquiries,
      });
    } catch (error) {
      console.error("Error loading agent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    const newStatus = availability === "available" ? "unavailable" : "available";
    setUpdatingAvailability(true);
    
    try {
      const currentData = profile?.onboarding_data || {};
      const updatedData = {
        ...currentData,
        availability_status: newStatus,
      };
      
      await travelAgentAPI.updateProfile(updatedData);
      setAvailability(newStatus);
      setProfile({
        ...profile,
        onboarding_data: updatedData,
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Failed to update availability. Please try again.");
    } finally {
      setUpdatingAvailability(false);
    }
  };

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
        console.warn("Invalid date:", dateString);
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
      console.error("Error formatting date:", error, dateString);
      return "Just now";
    }
  };

  const getOtherPartyName = (conv) => {
    return conv.user_name || "User";
  };

  if (loading) {
    return (
      <div className="agent-home-loading">
        <div className="spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const isVerified = profile?.is_verified || false;
  const onboardingData = profile?.onboarding_data || {};

  return (
    <div className="travel-agent-home">
      {/* Welcome Header */}
      <div className="agent-home-header">
        <div>
          <h1>Welcome back, {onboardingData.full_name || user?.name || "Agent"}!</h1>
          <p className="header-subtitle">Manage your conversations and help users with their migration journey</p>
        </div>
        <div className="availability-toggle-container">
          <label className="availability-toggle">
            <input
              type="checkbox"
              checked={availability === "available"}
              onChange={handleAvailabilityToggle}
              disabled={updatingAvailability}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">
              {availability === "available" ? "Available" : "Unavailable"}
            </span>
          </label>
        </div>
      </div>

      {/* Verification Reminder */}
      {!isVerified && (
        <div className="verification-banner">
          <FiAlertCircle />
          <div className="banner-content">
            <strong>Account Verification Pending</strong>
            <p>Your account is not yet verified. Complete your profile to get verified.</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="agent-stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FiMessageCircle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalConversations}</div>
            <div className="stat-label">Total Conversations</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <FiMail />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.unreadMessages}</div>
            <div className="stat-label">Unread Messages</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.newInquiries}</div>
            <div className="stat-label">New Inquiries (7 days)</div>
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="recent-conversations-section">
        <div className="section-header">
          <h2>Recent Conversations</h2>
          <Link to="/agent/messages" className="view-all-link">
            View All <FiArrowRight />
          </Link>
        </div>

        {conversations.length === 0 ? (
          <div className="empty-conversations">
            <FiMessageCircle size={48} />
            <h3>No conversations yet</h3>
            <p>When users contact you, conversations will appear here</p>
          </div>
        ) : (
          <div className="conversations-preview">
            {conversations.slice(0, 5).map((conv) => (
              <Link
                key={conv.id}
                to={`/agent/messages/${conv.id}`}
                className="conversation-preview-card"
              >
                <div className="conversation-avatar">
                  <FiUser />
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h4>{getOtherPartyName(conv)}</h4>
                    <span className="conversation-time">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <p className="conversation-preview-text">
                    {conv.last_message_preview || "No messages yet"}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <div className="unread-badge">{conv.unread_count}</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TravelAgentHome;

