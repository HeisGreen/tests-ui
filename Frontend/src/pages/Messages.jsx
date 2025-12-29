import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { messagingAPI, travelAgentAPI } from "../utils/api";
import { FiMessageCircle, FiSend, FiArrowLeft, FiUser, FiCheckCircle } from "react-icons/fi";
import "./Messages.css";

function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userProfileSummary, setUserProfileSummary] = useState(null);
  const messagesEndRef = useRef(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    loadConversations();
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation(parseInt(conversationId));
      loadMessages(parseInt(conversationId));
      // Start polling for new messages
      const interval = setInterval(() => {
        loadMessages(parseInt(conversationId), true);
      }, 3000); // Poll every 3 seconds
      setPollingInterval(interval);
      return () => {
        clearInterval(interval);
      };
    } else {
      setCurrentConversation(null);
      setMessages([]);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messagingAPI.getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await messagingAPI.getConversation(id);
      setCurrentConversation(conv);
      
      // If user is an agent, load user profile summary
      if (user.role === "TRAVEL_AGENT" && conv.user_id) {
        try {
          const summary = await messagingAPI.getUserProfileSummary(conv.user_id);
          setUserProfileSummary(summary);
        } catch (err) {
          console.error("Error loading user profile summary:", err);
        }
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const loadMessages = async (id, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await messagingAPI.getMessages(id);
      setMessages(data);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversationId) return;

    try {
      setSending(true);
      await messagingAPI.sendMessage(parseInt(conversationId), messageInput.trim());
      setMessageInput("");
      // Reload messages and conversations
      await loadMessages(parseInt(conversationId));
      await loadConversations();
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Just now";
    
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === "string") {
        // Remove trailing Z if present and handle timezone
        const cleanDate = dateString.replace(/Z$/, "");
        date = new Date(cleanDate);
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        date = new Date(dateString);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return "Just now";
      }

      const now = new Date();
      const diffMs = now - date;
      
      // Handle negative differences (future dates)
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
    if (user.role === "USER") {
      return conv.agent_name || conv.agent_business_name || "Travel Agent";
    } else {
      return conv.user_name || "User";
    }
  };
  
  const getOtherPartySubtitle = (conv) => {
    if (user.role === "USER" && conv.agent_business_name && conv.agent_owner_name) {
      return conv.agent_owner_name;
    }
    return null;
  };

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Conversations List */}
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h2>Messages</h2>
            {user.role === "USER" && (
              <button
                className="btn-new-conversation"
                onClick={() => navigate("/agents")}
              >
                <FiMessageCircle /> Find Agents
              </button>
            )}
          </div>

          {loading && conversations.length === 0 ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-conversations">
              <FiMessageCircle size={48} />
              <h3>No conversations yet</h3>
              <p>
                {user.role === "USER"
                  ? "Start a conversation with a travel agent"
                  : "No conversations yet"}
              </p>
              {user.role === "USER" && (
                <button
                  className="btn-primary"
                  onClick={() => navigate("/agents")}
                >
                  Browse Agents
                </button>
              )}
            </div>
          ) : (
            <div className="conversations-list">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${
                    conversationId && parseInt(conversationId) === conv.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    const basePath = user.role === "TRAVEL_AGENT" ? "/agent/messages" : "/messages";
                    navigate(`${basePath}/${conv.id}`);
                  }}
                >
                  <div className="conversation-avatar">
                    <FiUser />
                  </div>
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <div className="conversation-name-group">
                        <h4>{getOtherPartyName(conv)}</h4>
                        {getOtherPartySubtitle(conv) && (
                          <span className="conversation-subtitle">
                            {getOtherPartySubtitle(conv)}
                          </span>
                        )}
                      </div>
                      <span className="conversation-time">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="conversation-preview">
                      {conv.last_message_preview || "No messages yet"}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="unread-badge">{conv.unread_count}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {!conversationId ? (
            <div className="no-conversation-selected">
              <FiMessageCircle size={64} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list or start a new one</p>
            </div>
          ) : (
            <>
              {currentConversation && (
                <div className="chat-header">
                  <button
                    className="btn-back"
                    onClick={() => {
                      const basePath = user.role === "TRAVEL_AGENT" ? "/agent/messages" : "/messages";
                      navigate(basePath);
                    }}
                  >
                    <FiArrowLeft />
                  </button>
                  <div className="chat-header-info">
                    <div className="chat-name-group">
                      <h3>{getOtherPartyName(currentConversation)}</h3>
                      {getOtherPartySubtitle(currentConversation) && (
                        <span className="chat-subtitle">
                          {getOtherPartySubtitle(currentConversation)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="messages-list">
                {loading && messages.length === 0 ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${
                        msg.sender_id === user.id ? "sent" : "received"
                      }`}
                    >
                      <div className="message-content">
                        <p>{msg.content}</p>
                        <span className="message-time">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-area">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={sending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                  className="btn-send"
                >
                  <FiSend />
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Summary Panel (for agents) */}
        {user.role === "TRAVEL_AGENT" && userProfileSummary && conversationId && (
          <div className="user-summary-panel">
            <div className="summary-header">
              <h3>User Information</h3>
            </div>
            <div className="summary-content">
              <div className="summary-section">
                <h4>Basic Details</h4>
                <div className="summary-item">
                  <span className="summary-label">Name:</span>
                  <span className="summary-value">
                    {userProfileSummary.name || "N/A"}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Country of Origin:</span>
                  <span className="summary-value">
                    {userProfileSummary.country_of_origin || "N/A"}
                  </span>
                </div>
              </div>

              <div className="summary-section">
                <h4>Migration Goals</h4>
                <div className="summary-item">
                  <span className="summary-label">Desired Destination:</span>
                  <span className="summary-value">
                    {userProfileSummary.desired_destination_country || "N/A"}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Migration Purpose:</span>
                  <span className="summary-value">
                    {userProfileSummary.migration_purpose || "N/A"}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Timeline:</span>
                  <span className="summary-value">
                    {userProfileSummary.timeline || "N/A"}
                  </span>
                </div>
              </div>

              {userProfileSummary.budget_range && (
                <div className="summary-section">
                  <h4>Budget</h4>
                  <div className="summary-item">
                    <span className="summary-label">Budget Range:</span>
                    <span className="summary-value">
                      {userProfileSummary.budget_range.max_budget_usd
                        ? `$${userProfileSummary.budget_range.max_budget_usd.toLocaleString()}`
                        : userProfileSummary.budget_range.budget_amount
                        ? `${userProfileSummary.budget_range.budget_currency || "USD"} ${userProfileSummary.budget_range.budget_amount.toLocaleString()}`
                        : "Not specified"}
                    </span>
                  </div>
                </div>
              )}

              {userProfileSummary.has_recommendations && (
                <div className="summary-section">
                  <div className="summary-badge">
                    <FiCheckCircle />
                    <span>Has AI Recommendations</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;

