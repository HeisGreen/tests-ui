import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMessageCircle,
  FiX,
  FiSend,
  FiLoader,
  FiChevronDown,
  FiZap,
  FiHelpCircle,
  FiCompass,
  FiFileText,
  FiGlobe,
  FiUsers,
  FiArrowRight,
} from "react-icons/fi";
import { API_BASE_URL } from "../utils/api";
import logoMark from "../assets/japa-mark.png";
import "./JapaChatbot.css";

const SUGGESTED_QUESTIONS = [
  { icon: FiHelpCircle, text: "What is JAPA?", color: "#32d74b" },
  { icon: FiCompass, text: "How do I get started?", color: "#5ac8fa" },
  { icon: FiZap, text: "What features are available?", color: "#ff9f0a" },
  { icon: FiUsers, text: "Can I talk to an agent?", color: "#bf5af2" },
];

function JapaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isOpen]);

  // Handle scroll position for scroll-to-bottom button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sendMessage = async (messageText = message) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    setMessage("");
    setIsLoading(true);
    setHasInteracted(true);

    // Add user message to conversation immediately
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];
    setConversationHistory(newHistory);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setConversationHistory(data.conversation_history);
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message to conversation
      setConversationHistory([
        ...newHistory,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    sendMessage(question);
  };

  const clearChat = () => {
    setConversationHistory([]);
    setHasInteracted(false);
  };

  // Format message content with basic markdown-like rendering
  const formatMessage = (content) => {
    return content.split("\n").map((line, i) => {
      // Handle bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <p key={i} className="bullet-point">
            <span className="bullet">•</span>
            {line.trim().substring(2)}
          </p>
        );
      }
      // Handle numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        const num = line.trim().match(/^(\d+)\./)[1];
        const text = line.trim().replace(/^\d+\.\s/, "");
        return (
          <p key={i} className="numbered-point">
            <span className="number">{num}.</span>
            {text}
          </p>
        );
      }
      // Regular paragraph
      if (line.trim()) {
        return <p key={i}>{line}</p>;
      }
      return null;
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="chatbot-trigger"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="chatbot-trigger-pulse" />
            <FiMessageCircle className="chatbot-trigger-icon" />
            <span className="chatbot-trigger-label">Ask JAPA AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-window"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ 
              duration: 0.35, 
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            {/* Header */}
            <motion.div 
              className="chatbot-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="chatbot-header-info">
                <div className="chatbot-avatar">
                  <img src={logoMark} alt="JAPA" />
                  <span className="chatbot-online-indicator" />
                </div>
                <div className="chatbot-header-text">
                  <h3>JAPA Assistant</h3>
                  <span className="chatbot-status">
                    <span className="status-dot" />
                    AI-powered • Always here to help
                  </span>
                </div>
              </div>
              <div className="chatbot-header-actions">
                {conversationHistory.length > 0 && (
                  <motion.button
                    className="chatbot-clear-btn"
                    onClick={clearChat}
                    title="Clear chat"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear
                  </motion.button>
                )}
                <button
                  className="chatbot-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <FiX />
                </button>
              </div>
            </motion.div>

            {/* Messages Container */}
            <div
              className="chatbot-messages"
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              {/* Welcome Message */}
              {conversationHistory.length === 0 && (
                <motion.div 
                  className="chatbot-welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <motion.div 
                    className="welcome-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: 0.3, 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20 
                    }}
                  >
                    <img src={logoMark} alt="JAPA" />
                  </motion.div>
                  <motion.h4
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Hey there! 👋
                  </motion.h4>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    I'm your AI migration assistant. Ask me anything about JAPA, 
                    visa pathways, or how to start your journey abroad.
                  </motion.p>
                  <motion.div 
                    className="suggested-questions"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {SUGGESTED_QUESTIONS.map((item, index) => (
                      <motion.button
                        key={index}
                        className="suggested-question"
                        onClick={() => handleSuggestedQuestion(item.text)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 + index * 0.08 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{ '--accent-color': item.color }}
                      >
                        <item.icon style={{ color: item.color }} />
                        <span>{item.text}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* Conversation Messages */}
              {conversationHistory.map((msg, index) => (
                <motion.div
                  key={index}
                  className={`chat-message ${msg.role}`}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {msg.role === "assistant" && (
                    <div className="message-avatar">
                      <img src={logoMark} alt="JAPA" />
                    </div>
                  )}
                  <div className="message-content">
                    <div className="message-bubble">
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <motion.div
                  className="chat-message assistant"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="message-avatar">
                    <img src={logoMark} alt="JAPA" />
                  </div>
                  <div className="message-content">
                    <div className="message-bubble typing">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  className="scroll-bottom-btn"
                  onClick={scrollToBottom}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiChevronDown />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <motion.div 
              className="chatbot-input-area"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <div className="chatbot-input-wrapper">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything about JAPA..."
                  rows={1}
                  disabled={isLoading}
                />
                <motion.button
                  className="chatbot-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!message.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <FiLoader className="spin" />
                  ) : (
                    <FiSend />
                  )}
                </motion.button>
              </div>
              <p className="chatbot-disclaimer">
                JAPA provides guidance, not legal advice. Verify with official sources.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default JapaChatbot;
