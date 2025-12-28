import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiMail,
  FiMessageCircle,
  FiSearch,
  FiX,
  FiUser,
  FiGlobe,
  FiFileText,
  FiSettings,
  FiShield,
  FiArrowRight,
} from "react-icons/fi";
import { initScrollAnimations } from "../utils/scrollAnimation";
import "./FAQ.css";

function FAQ() {
  const { isAuthenticated } = useAuth();
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    initScrollAnimations();
  }, []);

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleCategoryClick = (categoryIndex) => {
    setActiveCategory(activeCategory === categoryIndex ? null : categoryIndex);
    // Scroll to category after a short delay
    setTimeout(() => {
      const element = document.getElementById(`category-${categoryIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const faqCategories = [
    {
      title: "Getting Started",
      icon: FiUser,
      id: "getting-started",
      questions: [
        {
          question: "What is JAPA?",
          answer:
            "JAPA is an AI-powered migration assistant that helps you navigate visa applications, immigration pathways, and the entire migration process. It provides personalized recommendations, document management, checklists, and guidance to make your migration journey clearer and more organized.",
        },
        {
          question: "How do I get started?",
          answer:
            "Getting started is easy! Simply create an account, complete your onboarding profile with your nationality, education, work history, and migration goals. Then, JAPA will analyze your profile and provide personalized visa recommendations tailored to your situation.",
        },
        {
          question: "Is JAPA free to use?",
          answer:
            "Yes! JAPA offers a free tier that includes basic recommendations and document management. You can get started without a credit card and explore our features. Premium features may be available for advanced guidance and additional support.",
        },
        {
          question: "Do I need to be logged in to use JAPA?",
          answer:
            "While you can browse our landing page without an account, you'll need to create a free account to access personalized recommendations, save your progress, manage documents, and use our checklist features. Creating an account takes just a few minutes.",
        },
      ],
    },
    {
      title: "Recommendations & Visa Options",
      icon: FiGlobe,
      id: "recommendations",
      questions: [
        {
          question: "How does JAPA recommend visa options?",
          answer:
            "JAPA uses AI to analyze your profile including your nationality, education, work experience, financial situation, and migration goals. Based on this information, it matches you with realistic visa and immigration pathways, providing side-by-side comparisons of different options.",
        },
        {
          question: "Are the recommendations guaranteed?",
          answer:
            "No. JAPA provides guidance and recommendations based on available information, but we cannot guarantee visa approvals or eligibility. Immigration policies change frequently, and final decisions are made by government authorities. Always verify information with official sources and consider consulting with an immigration lawyer for complex cases.",
        },
        {
          question: "How accurate are the processing times and costs?",
          answer:
            "Processing times and costs are estimates based on current information and typical scenarios. Actual processing times can vary significantly based on individual circumstances, application volume, and policy changes. Costs may also vary based on exchange rates, additional fees, and specific requirements. Always check official government sources for the most current information.",
        },
        {
          question: "Can I get recommendations for multiple countries?",
          answer:
            "Yes! JAPA can help you explore migration options across multiple countries. You can generate new recommendations anytime, and the system will consider your profile to suggest the best pathways for different destinations.",
        },
      ],
    },
    {
      title: "Checklists & Documents",
      icon: FiFileText,
      id: "checklists",
      questions: [
        {
          question: "What are checklists?",
          answer:
            "Checklists are step-by-step guides for completing your visa application process. Each checklist is tailored to a specific visa type and includes all the tasks, documents, and milestones you need to complete. You can track your progress and see estimated timelines for each step.",
        },
        {
          question: "How do I manage my documents?",
          answer:
            "The Documents page allows you to upload, organize, and manage all your visa-related documents. You can categorize documents by type, track expiration dates, and ensure everything is ready when you need it. Your documents are stored securely and privately.",
        },
        {
          question: "Are my documents secure?",
          answer:
            "Yes, we take your privacy and security seriously. All documents are encrypted and stored securely. We follow industry-standard security practices to protect your personal information. However, we recommend keeping backups of important documents on your own devices as well.",
        },
        {
          question: "What happens if I miss a deadline?",
          answer:
            "JAPA helps you stay organized with reminders and timelines, but it's ultimately your responsibility to meet application deadlines. If you miss a deadline, check with the relevant immigration authority about your options. Some applications may allow extensions or resubmissions, while others may require starting over.",
        },
      ],
    },
    {
      title: "Account & Profile",
      icon: FiSettings,
      id: "account",
      questions: [
        {
          question: "How do I update my profile?",
          answer:
            "You can update your profile anytime by navigating to the Profile page from the main menu. Keep your information current to ensure you receive the most accurate recommendations. Changes to your profile may affect your visa recommendations, so you may want to generate new recommendations after significant updates.",
        },
        {
          question: "Can I delete my account?",
          answer:
            "Yes, you can delete your account at any time from your Profile settings. Please note that deleting your account will permanently remove all your data, including saved recommendations, checklists, and uploaded documents. This action cannot be undone.",
        },
        {
          question: "What information do you collect?",
          answer:
            "We collect information necessary to provide personalized recommendations, including your nationality, education, work history, financial information, and migration goals. We also store documents you upload and your application progress. For more details, please review our Privacy Policy.",
        },
        {
          question: "How do I change my password?",
          answer:
            "If you signed up with email and password, you can change your password from your Profile settings. If you signed up with Google OAuth, your password is managed by Google. You can also reset your password from the login page if you've forgotten it.",
        },
      ],
    },
    {
      title: "Support & Legal",
      icon: FiShield,
      id: "support",
      questions: [
        {
          question: "Does JAPA provide legal advice?",
          answer:
            "No. JAPA does not provide legal advice or act as a legal representative. We provide guidance, organization tools, and information to help you navigate the migration process. For legal matters, complex cases, or when legal judgment is required, we recommend consulting with a qualified immigration lawyer.",
        },
        {
          question: "Can JAPA guarantee visa approval?",
          answer:
            "No. JAPA cannot and does not guarantee visa approvals. Visa decisions are made solely by government immigration authorities. JAPA helps you prepare thoroughly, stay organized, and make informed decisions, but final outcomes depend on many factors beyond our control.",
        },
        {
          question: "How do I contact support?",
          answer:
            "You can reach our support team by email at support@japa.com or through the Contact Us page. We aim to respond to all inquiries within 24-48 hours. For urgent matters related to your application, please contact the relevant immigration authority directly.",
        },
        {
          question: "What if I find incorrect information?",
          answer:
            "Immigration policies change frequently, and while we strive to keep information accurate and up-to-date, errors can occur. If you notice incorrect information, please contact us at support@japa.com. Always verify critical information with official government sources before making decisions.",
        },
      ],
    },
  ];

  // Filter FAQs based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqCategories;
    }

    const query = searchQuery.toLowerCase();
    return faqCategories
      .map((category) => {
        const filteredQuestions = category.questions.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        );
        return filteredQuestions.length > 0
          ? { ...category, questions: filteredQuestions }
          : null;
      })
      .filter(Boolean);
  }, [searchQuery]);

  // Calculate total questions count
  const totalQuestions = useMemo(() => {
    return faqCategories.reduce(
      (sum, category) => sum + category.questions.length,
      0
    );
  }, []);

  // Filter categories based on active category filter
  const displayedCategories = useMemo(() => {
    if (activeCategory === null) {
      return filteredCategories;
    }
    return filteredCategories.filter(
      (_, index) => index === activeCategory
    );
  }, [filteredCategories, activeCategory]);

  return (
    <div className="faq-page">
      <div className="faq-header">
        <div className="faq-header-content">
          <div className="faq-icon">
            <FiHelpCircle />
          </div>
          <h1>Frequently Asked Questions</h1>
          <p>
            Find answers to common questions about JAPA and how we can help with
            your migration journey.
          </p>
          <div className="faq-stats">
            <span className="stat-item">
              <strong>{totalQuestions}</strong> Questions
            </span>
            <span className="stat-divider">•</span>
            <span className="stat-item">
              <strong>{faqCategories.length}</strong> Categories
            </span>
          </div>
        </div>
      </div>

      <div className="faq-search-container">
        <div className="faq-search-wrapper">
          <FiSearch className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="faq-search-input"
            placeholder="Search frequently asked questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="search-results-info">
            Found {filteredCategories.reduce((sum, cat) => sum + cat.questions.length, 0)} result{filteredCategories.reduce((sum, cat) => sum + cat.questions.length, 0) !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
        )}
      </div>

      <div className="faq-category-nav">
        <div className="category-nav-wrapper">
          <button
            className={`category-nav-item ${activeCategory === null ? "active" : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            <span>All Categories</span>
          </button>
          {faqCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <button
                key={index}
                className={`category-nav-item ${activeCategory === index ? "active" : ""}`}
                onClick={() => handleCategoryClick(index)}
              >
                <IconComponent />
                <span>{category.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="faq-content">
        {displayedCategories.length === 0 ? (
          <div className="faq-empty-state">
            <FiSearch className="empty-icon" />
            <h3>No results found</h3>
            <p>
              We couldn't find any FAQs matching "{searchQuery}". Try different
              keywords or browse all categories.
            </p>
            <button className="btn-primary" onClick={clearSearch}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="faq-categories">
            {displayedCategories.map((category, categoryIndex) => {
              const IconComponent = category.icon;
              const originalIndex = faqCategories.findIndex(
                (cat) => cat.id === category.id
              );
              return (
                <div
                  key={categoryIndex}
                  id={`category-${originalIndex}`}
                  className="faq-category scroll-animate"
                >
                  <div className="category-header">
                    <div className="category-icon-wrapper">
                      <IconComponent className="category-icon" />
                    </div>
                    <div>
                      <h2 className="category-title">{category.title}</h2>
                      <p className="category-subtitle">
                        {category.questions.length} question
                        {category.questions.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="faq-list">
                    {category.questions.map((item, questionIndex) => {
                      const index = `${originalIndex}-${questionIndex}`;
                      const isOpen = openIndex === index;
                      return (
                        <div
                          key={questionIndex}
                          className={`faq-item ${isOpen ? "open" : ""}`}
                        >
                          <button
                            className="faq-question"
                            onClick={() => toggleQuestion(index)}
                            aria-expanded={isOpen}
                          >
                            <span className="question-text">
                              {item.question}
                            </span>
                            <span className="question-icon">
                              {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                            </span>
                          </button>
                          <div className="faq-answer">
                            <div className="answer-content">
                              {item.answer}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {displayedCategories.length > 0 && (
          <div className="faq-cta scroll-animate">
            <div className="cta-content">
              <FiMessageCircle className="cta-icon" />
              <h3>Still have questions?</h3>
              <p>
                Can't find what you're looking for? Our support team is here to
                help.
              </p>
              <div className="cta-actions">
                <a href="mailto:support@japa.com" className="btn-primary">
                  <FiMail /> Contact Support
                </a>
                {!isAuthenticated && (
                  <Link to="/register" className="btn-secondary">
                    Get Started <FiArrowRight />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FAQ;

