import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { countries } from "../data/countries";
import { recommendationsAPI } from "../utils/api";
import {
  transformToBackendFormat,
  transformToFormFormat,
} from "../utils/dataTransform";
import "./Onboarding.css";

function Onboarding() {
  const navigate = useNavigate();
  const { user, onboardingData, updateOnboardingData } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [countrySearch, setCountrySearch] = useState({});
  const [showMultiSelect, setShowMultiSelect] = useState({});
  const stepRef = useRef(null);

  // Sort countries alphabetically by name
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter countries based on search
  const getFilteredCountries = (fieldName) => {
    const searchTerm = (countrySearch[fieldName] || "").toLowerCase();
    if (!searchTerm) return sortedCountries;
    return sortedCountries.filter((country) =>
      country.name.toLowerCase().includes(searchTerm)
    );
  };
  const [formData, setFormData] = useState({
    // Personal & Contact Details
    nationality: "",
    citizenship_country: null,
    current_residence_country: null,
    applying_from_country: null,
    age: null,
    marital_status: null,
    spouse_nationality: null,
    spouse_profession: null,
    dependents: null,
    contact_methods: null,
    wants_lawyer_consultation: null,

    // Destination & Timeline
    preferred_destinations: "",
    migration_timeline: null,
    commitment_level: null,
    target_timeline: "",
    target_move_date: null,
    deadline_hard: null,
    deadline_reason: null,
    willing_to_consider_alternatives: null,
    alternative_countries: null,

    // Education
    education_level: "",
    field_of_study: null,
    degrees: null,
    has_academic_transcripts: null,
    has_admission_offer: null,
    admission_details: null,
    professional_certifications: null,

    // Work Experience
    current_job_title: null,
    current_employer: null,
    industry: null,
    total_experience_years: null,
    experience_years_in_position: null,
    is_self_employed: null,
    business_management_experience: null,
    is_business_owner: null,
    employer_willing_to_sponsor: null,
    has_job_offer_international: null,

    // Skills & Language
    skills: null,
    languages_known: null,
    language_tests_taken: null,
    language_scores: null,

    // Immigration History
    has_prior_visa_applications: null,
    prior_visas: null,
    has_active_visas: null,
    current_visa_status: null,
    current_visa_country: null,
    current_visa_expiry: null,
    has_overstays: null,
    overstay_details: null,
    criminal_records: null,
    has_relatives_in_destination: null,

    // Financial Info
    max_budget_usd: null,
    budget_currency: null,
    budget_amount: null,
    proof_of_funds_source: null,
    liquid_assets_usd: null,
    has_property: null,
    total_assets_usd: null,
    annual_income_usd: null,
    salary_usd: null,

    // Special Items / Support
    has_special_needs: null,
    has_medical_conditions: null,
    has_invitation: null,
    sponsor_in_destination: null,
    international_achievements: null,
    publications_count: null,
    patents_count: null,
    awards: null,
    media_features: null,
    professional_memberships: null,
    recommendation_letters_count: null,

    // Documents
    passport_expiry: null,
    has_birth_certificate: null,
    has_financial_statements: null,
    has_police_clearance: null,
    has_medical_exam: null,

    // Meta
    risk_tolerance: null,
    prefers_diy_or_guided: null,
  });

  const totalSteps = 9;

  useEffect(() => {
    // Load saved data from auth context (which loads from backend)
    if (onboardingData) {
      // Transform backend data (arrays) to form format (strings)
      const formDataFromBackend = transformToFormFormat(onboardingData);
      // Merge onboarding data into form, keeping form defaults for missing fields
      setFormData((prev) => ({
        ...prev,
        ...formDataFromBackend,
      }));
    }
  }, [onboardingData]);

  // Validate current step
  const validateStep = (step) => {
    const stepErrors = {};
    
    if (step === 1) {
      if (!formData.nationality) {
        stepErrors.nationality = "Nationality is required";
      }
    }
    
    if (step === 2) {
      if (!formData.preferred_destinations) {
        stepErrors.preferred_destinations = "At least one preferred destination is required";
      }
      if (!formData.target_timeline) {
        stepErrors.target_timeline = "Target timeline is required";
      }
    }
    
    if (step === 3) {
      if (!formData.education_level) {
        stepErrors.education_level = "Education level is required";
      }
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleChange = (field, value) => {
    const updatedData = {
      ...formData,
      [field]: value === "" ? null : value,
    };
    setFormData(updatedData);

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Auto-save to localStorage
    const dataToSave = {
      id: user?.id || Date.now(),
      user_id: user?.id || Date.now(),
      ...updatedData,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem("onboardingData", JSON.stringify(dataToSave));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        // Scroll to top of step
        if (stepRef.current) {
          stepRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      // Scroll to top of step
      if (stepRef.current) {
        stepRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleStepClick = (step) => {
    if (step <= currentStep || step === currentStep + 1) {
      setCurrentStep(step);
      setErrors({});
      if (stepRef.current) {
        stepRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (submitting) return;
      
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        if (currentStep < totalSteps) {
          handleNext();
        } else {
          handleSubmit();
        }
      } else if (e.key === "ArrowLeft" && e.ctrlKey) {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowRight" && e.ctrlKey) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentStep, submitting, formData]);

  // Close multi-select dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".multi-select-wrapper")) {
        setShowMultiSelect({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Multi-select helpers
  const toggleCountrySelection = (fieldName, countryCode) => {
    const currentValue = formData[fieldName] || "";
    const selected = currentValue
      ? currentValue.split(",").map((c) => c.trim())
      : [];
    
    if (selected.includes(countryCode)) {
      const updated = selected.filter((c) => c !== countryCode);
      handleChange(fieldName, updated.length > 0 ? updated.join(", ") : null);
    } else {
      const updated = [...selected, countryCode];
      handleChange(fieldName, updated.join(", "));
    }
  };

  const getSelectedCountries = (fieldName) => {
    const value = formData[fieldName] || "";
    return value ? value.split(",").map((c) => c.trim()) : [];
  };

  const handleSubmit = async () => {
    // Transform form data (strings) to backend format (arrays)
    const dataToSave = transformToBackendFormat(formData);

    // Save to backend via auth context (which will also update localStorage),
    // then generate and persist the user's recommendation.
    try {
      setSubmitting(true);
      setSubmitMessage("Saving your onboarding details...");
      if (updateOnboardingData) {
        await updateOnboardingData(dataToSave);
      }

      // Call AI once after onboarding so the result is saved for this user.
      // Passing intake explicitly makes it robust even if profile sync is delayed.
      setSubmitMessage("Generating your personalized recommendations...");
      const recs = await recommendationsAPI.getRecommendations(
        false,
        dataToSave
      );

      // Navigate to recommendations and hydrate the page immediately.
      navigate("/recommendation", { state: { initialRecommendations: recs } });
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      // Still navigate even if save fails (data is in localStorage)
      navigate("/home");
    } finally {
      setSubmitting(false);
      setSubmitMessage("");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="onboarding-step">
            <h2>Personal & Contact Details</h2>
            <p className="step-description">
              Tell us about yourself to help us provide better recommendations.
            </p>
            <div className="form-group">
              <label>
                Nationality <span className="required">*</span>
              </label>
              <select
                value={formData.nationality || ""}
                onChange={(e) => handleChange("nationality", e.target.value)}
                className={errors.nationality ? "error" : ""}
              >
                <option value="">Select a country...</option>
                {sortedCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.nationality && (
                <span className="error-message">{errors.nationality}</span>
              )}
            </div>
            <div className="form-group">
              <label>Current Residence Country</label>
              <select
                value={formData.current_residence_country || ""}
                onChange={(e) =>
                  handleChange("current_residence_country", e.target.value)
                }
              >
                <option value="">Select a country...</option>
                {sortedCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Applying From Country</label>
              <select
                value={formData.applying_from_country || ""}
                onChange={(e) =>
                  handleChange("applying_from_country", e.target.value)
                }
              >
                <option value="">Select a country...</option>
                {sortedCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) =>
                    handleChange(
                      "age",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="28"
                />
              </div>
              <div className="form-group">
                <label>Marital Status</label>
                <select
                  value={formData.marital_status || ""}
                  onChange={(e) =>
                    handleChange("marital_status", e.target.value)
                  }
                >
                  <option value="">Select...</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>
            {formData.marital_status === "married" && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Spouse Nationality</label>
                    <select
                      value={formData.spouse_nationality || ""}
                      onChange={(e) =>
                        handleChange("spouse_nationality", e.target.value)
                      }
                    >
                      <option value="">Select a country...</option>
                      {sortedCountries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Spouse Profession</label>
                    <input
                      type="text"
                      value={formData.spouse_profession || ""}
                      onChange={(e) =>
                        handleChange("spouse_profession", e.target.value)
                      }
                      placeholder="e.g., Engineer"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Number of Dependents</label>
              <input
                type="number"
                value={formData.dependents || ""}
                onChange={(e) =>
                  handleChange(
                    "dependents",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="0"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="onboarding-step">
            <h2>Destination & Timeline</h2>
            <p className="step-description">
              Where do you want to go? You can select multiple destinations.
            </p>
            <div className="form-group">
              <label>
                Preferred Destination(s) <span className="required">*</span>
              </label>
              <div className="multi-select-wrapper">
                <div
                  className="multi-select-trigger"
                  onClick={() =>
                    setShowMultiSelect({
                      ...showMultiSelect,
                      preferred_destinations: !showMultiSelect.preferred_destinations,
                    })
                  }
                >
                  <div className="selected-chips">
                    {getSelectedCountries("preferred_destinations").length >
                    0 ? (
                      getSelectedCountries("preferred_destinations").map(
                        (code) => {
                          const country = sortedCountries.find(
                            (c) => c.code === code
                          );
                          return (
                            <span key={code} className="chip">
                              {country?.name || code}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCountrySelection(
                                    "preferred_destinations",
                                    code
                                  );
                                }}
                                className="chip-remove"
                              >
                                ×
                              </button>
                            </span>
                          );
                        }
                      )
                    ) : (
                      <span className="placeholder">
                        Select one or more countries...
                      </span>
                    )}
                  </div>
                  <span className="dropdown-arrow">▼</span>
                </div>
                {showMultiSelect.preferred_destinations && (
                  <div className="multi-select-dropdown">
                    <div className="country-list">
                      {sortedCountries.map((country) => {
                          const isSelected = getSelectedCountries(
                            "preferred_destinations"
                          ).includes(country.code);
                          return (
                            <div
                              key={country.code}
                              className={`country-option ${
                                isSelected ? "selected" : ""
                              }`}
                              onClick={() =>
                                toggleCountrySelection(
                                  "preferred_destinations",
                                  country.code
                                )
                              }
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                              />
                              <span>{country.name}</span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.preferred_destinations && (
                <span className="error-message">
                  {errors.preferred_destinations}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>
                Target Timeline <span className="required">*</span>
              </label>
              <select
                value={formData.target_timeline || ""}
                onChange={(e) =>
                  handleChange("target_timeline", e.target.value)
                }
                className={errors.target_timeline ? "error" : ""}
              >
                <option value="">Select...</option>
                <option value="immediate">Immediate</option>
                <option value="3_months">3 months</option>
                <option value="6_months">6 months</option>
                <option value="1_year">1 year</option>
                <option value="2_years">2+ years</option>
              </select>
              {errors.target_timeline && (
                <span className="error-message">{errors.target_timeline}</span>
              )}
              <small className="help-text">
                When do you plan to start your visa application process?
              </small>
            </div>
            <div className="form-group">
              <label>Target Move Date</label>
              <input
                type="date"
                value={formData.target_move_date || ""}
                onChange={(e) =>
                  handleChange("target_move_date", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Do you have a hard deadline?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="deadline_hard"
                    value="true"
                    checked={formData.deadline_hard === true}
                    onChange={() => handleChange("deadline_hard", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="deadline_hard"
                    value="false"
                    checked={formData.deadline_hard === false}
                    onChange={() => handleChange("deadline_hard", false)}
                  />
                  No
                </label>
              </div>
            </div>
            {formData.deadline_hard && (
              <div className="form-group">
                <label>Deadline Reason</label>
                <textarea
                  value={formData.deadline_reason || ""}
                  onChange={(e) =>
                    handleChange("deadline_reason", e.target.value)
                  }
                  placeholder="Explain your deadline..."
                  rows="3"
                />
              </div>
            )}
            <div className="form-group">
              <label>Willing to consider alternative countries?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="willing_to_consider_alternatives"
                    value="true"
                    checked={formData.willing_to_consider_alternatives === true}
                    onChange={() =>
                      handleChange("willing_to_consider_alternatives", true)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="willing_to_consider_alternatives"
                    value="false"
                    checked={
                      formData.willing_to_consider_alternatives === false
                    }
                    onChange={() =>
                      handleChange("willing_to_consider_alternatives", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
            {formData.willing_to_consider_alternatives && (
              <div className="form-group">
                <label>Alternative Countries</label>
                <div className="multi-select-wrapper">
                  <div
                    className="multi-select-trigger"
                    onClick={() =>
                      setShowMultiSelect({
                        ...showMultiSelect,
                        alternative_countries:
                          !showMultiSelect.alternative_countries,
                      })
                    }
                  >
                    <div className="selected-chips">
                      {getSelectedCountries("alternative_countries").length >
                      0 ? (
                        getSelectedCountries("alternative_countries").map(
                          (code) => {
                            const country = sortedCountries.find(
                              (c) => c.code === code
                            );
                            return (
                              <span key={code} className="chip">
                                {country?.name || code}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCountrySelection(
                                      "alternative_countries",
                                      code
                                    );
                                  }}
                                  className="chip-remove"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          }
                        )
                      ) : (
                        <span className="placeholder">
                          Select alternative countries...
                        </span>
                      )}
                    </div>
                    <span className="dropdown-arrow">▼</span>
                  </div>
                  {showMultiSelect.alternative_countries && (
                    <div className="multi-select-dropdown">
                      <div className="country-list">
                        {sortedCountries.map((country) => {
                            const isSelected = getSelectedCountries(
                              "alternative_countries"
                            ).includes(country.code);
                            return (
                              <div
                                key={country.code}
                                className={`country-option ${
                                  isSelected ? "selected" : ""
                                }`}
                                onClick={() =>
                                  toggleCountrySelection(
                                    "alternative_countries",
                                    country.code
                                  )
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                />
                                <span>{country.name}</span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="onboarding-step">
            <h2>Education</h2>
            <p className="step-description">
              Your educational background helps us match you with suitable visa
              programs.
            </p>
            <div className="form-group">
              <label>
                Education Level <span className="required">*</span>
              </label>
              <select
                value={formData.education_level || ""}
                onChange={(e) =>
                  handleChange("education_level", e.target.value)
                }
                className={errors.education_level ? "error" : ""}
              >
                <option value="">Select...</option>
                <option value="high_school">High School</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="phd">PhD</option>
                <option value="diploma">Diploma/Certificate</option>
              </select>
              {errors.education_level && (
                <span className="error-message">
                  {errors.education_level}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>Field of Study</label>
              <input
                type="text"
                value={formData.field_of_study || ""}
                onChange={(e) => handleChange("field_of_study", e.target.value)}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div className="form-group">
              <label>Do you have academic transcripts?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_academic_transcripts"
                    value="true"
                    checked={formData.has_academic_transcripts === true}
                    onChange={() =>
                      handleChange("has_academic_transcripts", true)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_academic_transcripts"
                    value="false"
                    checked={formData.has_academic_transcripts === false}
                    onChange={() =>
                      handleChange("has_academic_transcripts", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you have an admission offer?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_admission_offer"
                    value="true"
                    checked={formData.has_admission_offer === true}
                    onChange={() => handleChange("has_admission_offer", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_admission_offer"
                    value="false"
                    checked={formData.has_admission_offer === false}
                    onChange={() => handleChange("has_admission_offer", false)}
                  />
                  No
                </label>
              </div>
            </div>
            {formData.has_admission_offer && (
              <div className="form-group">
                <label>Admission Details</label>
                <textarea
                  value={formData.admission_details || ""}
                  onChange={(e) =>
                    handleChange("admission_details", e.target.value)
                  }
                  placeholder="University name, program, start date..."
                  rows="3"
                />
              </div>
            )}
            <div className="form-group">
              <label>Professional Certifications</label>
              <textarea
                value={formData.professional_certifications || ""}
                onChange={(e) =>
                  handleChange("professional_certifications", e.target.value)
                }
                placeholder="List your certifications..."
                rows="3"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="onboarding-step">
            <h2>Work Experience</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Current Job Title</label>
                <input
                  type="text"
                  value={formData.current_job_title || ""}
                  onChange={(e) =>
                    handleChange("current_job_title", e.target.value)
                  }
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="form-group">
                <label>Current Employer</label>
                <input
                  type="text"
                  value={formData.current_employer || ""}
                  onChange={(e) =>
                    handleChange("current_employer", e.target.value)
                  }
                  placeholder="Company name"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input
                type="text"
                value={formData.industry || ""}
                onChange={(e) => handleChange("industry", e.target.value)}
                placeholder="e.g., Technology"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Total Experience (Years)</label>
                <input
                  type="number"
                  value={formData.total_experience_years || ""}
                  onChange={(e) =>
                    handleChange(
                      "total_experience_years",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="5"
                />
              </div>
              <div className="form-group">
                <label>Experience in Current Position (Years)</label>
                <input
                  type="number"
                  value={formData.experience_years_in_position || ""}
                  onChange={(e) =>
                    handleChange(
                      "experience_years_in_position",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="2"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Are you self-employed?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="is_self_employed"
                    value="true"
                    checked={formData.is_self_employed === true}
                    onChange={() => handleChange("is_self_employed", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="is_self_employed"
                    value="false"
                    checked={formData.is_self_employed === false}
                    onChange={() => handleChange("is_self_employed", false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Are you a business owner?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="is_business_owner"
                    value="true"
                    checked={formData.is_business_owner === true}
                    onChange={() => handleChange("is_business_owner", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="is_business_owner"
                    value="false"
                    checked={formData.is_business_owner === false}
                    onChange={() => handleChange("is_business_owner", false)}
                  />
                  No
                </label>
              </div>
            </div>
            {formData.is_business_owner && (
              <div className="form-group">
                <label>Business Management Experience (Years)</label>
                <input
                  type="number"
                  value={formData.business_management_experience || ""}
                  onChange={(e) =>
                    handleChange(
                      "business_management_experience",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="3"
                />
              </div>
            )}
            <div className="form-group">
              <label>Is your employer willing to sponsor?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="employer_willing_to_sponsor"
                    value="true"
                    checked={formData.employer_willing_to_sponsor === true}
                    onChange={() =>
                      handleChange("employer_willing_to_sponsor", true)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="employer_willing_to_sponsor"
                    value="false"
                    checked={formData.employer_willing_to_sponsor === false}
                    onChange={() =>
                      handleChange("employer_willing_to_sponsor", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you have a job offer internationally?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_job_offer_international"
                    value="true"
                    checked={formData.has_job_offer_international === true}
                    onChange={() =>
                      handleChange("has_job_offer_international", true)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_job_offer_international"
                    value="false"
                    checked={formData.has_job_offer_international === false}
                    onChange={() =>
                      handleChange("has_job_offer_international", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="onboarding-step">
            <h2>Skills & Language</h2>
            <div className="form-group">
              <label>Skills</label>
              <textarea
                value={formData.skills || ""}
                onChange={(e) => handleChange("skills", e.target.value)}
                placeholder="List your key skills..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Languages Known</label>
              <input
                type="text"
                value={formData.languages_known || ""}
                onChange={(e) =>
                  handleChange("languages_known", e.target.value)
                }
                placeholder="e.g., English, French, Spanish"
              />
            </div>
            <div className="form-group">
              <label>Language Tests Taken</label>
              <input
                type="text"
                value={formData.language_tests_taken || ""}
                onChange={(e) =>
                  handleChange("language_tests_taken", e.target.value)
                }
                placeholder="e.g., IELTS, TOEFL"
              />
            </div>
            <div className="form-group">
              <label>Language Test Scores</label>
              <textarea
                value={formData.language_scores || ""}
                onChange={(e) =>
                  handleChange("language_scores", e.target.value)
                }
                placeholder="Test name and scores..."
                rows="3"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="onboarding-step">
            <h2>Immigration History</h2>
            <div className="form-group">
              <label>Have you applied for visas before?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_prior_visa_applications"
                    value="true"
                    checked={formData.has_prior_visa_applications === true}
                    onChange={() =>
                      handleChange("has_prior_visa_applications", true)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_prior_visa_applications"
                    value="false"
                    checked={formData.has_prior_visa_applications === false}
                    onChange={() =>
                      handleChange("has_prior_visa_applications", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
            {formData.has_prior_visa_applications && (
              <div className="form-group">
                <label>Prior Visas</label>
                <textarea
                  value={formData.prior_visas || ""}
                  onChange={(e) => handleChange("prior_visas", e.target.value)}
                  placeholder="List previous visa applications..."
                  rows="3"
                />
              </div>
            )}
            <div className="form-group">
              <label>Do you have active visas?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_active_visas"
                    value="true"
                    checked={formData.has_active_visas === true}
                    onChange={() => handleChange("has_active_visas", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_active_visas"
                    value="false"
                    checked={formData.has_active_visas === false}
                    onChange={() => handleChange("has_active_visas", false)}
                  />
                  No
                </label>
              </div>
            </div>
            {formData.has_active_visas && (
              <>
                <div className="form-group">
                  <label>Current Visa Status</label>
                  <input
                    type="text"
                    value={formData.current_visa_status || ""}
                    onChange={(e) =>
                      handleChange("current_visa_status", e.target.value)
                    }
                    placeholder="e.g., Tourist, Student"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Current Visa Country</label>
                    <select
                      value={formData.current_visa_country || ""}
                      onChange={(e) =>
                        handleChange("current_visa_country", e.target.value)
                      }
                    >
                      <option value="">Select a country...</option>
                      {sortedCountries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Visa Expiry Date</label>
                    <input
                      type="date"
                      value={formData.current_visa_expiry || ""}
                      onChange={(e) =>
                        handleChange("current_visa_expiry", e.target.value)
                      }
                    />
                  </div>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Have you ever overstayed a visa?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_overstays"
                    value="true"
                    checked={formData.has_overstays === true}
                    onChange={() => handleChange("has_overstays", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_overstays"
                    value="false"
                    checked={formData.has_overstays === false}
                    onChange={() => handleChange("has_overstays", false)}
                  />
                  No
                </label>
              </div>
            </div>
            {formData.has_overstays && (
              <div className="form-group">
                <label>Overstay Details</label>
                <textarea
                  value={formData.overstay_details || ""}
                  onChange={(e) =>
                    handleChange("overstay_details", e.target.value)
                  }
                  placeholder="Provide details..."
                  rows="3"
                />
              </div>
            )}
            <div className="form-group">
              <label>Do you have any criminal records?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="criminal_records"
                    value="true"
                    checked={formData.criminal_records === true}
                    onChange={() => handleChange("criminal_records", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="criminal_records"
                    value="false"
                    checked={formData.criminal_records === false}
                    onChange={() => handleChange("criminal_records", false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you have relatives in your destination country?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_relatives_in_destination"
                    value="true"
                    checked={formData.has_relatives_in_destination === true}
                    onChange={() =>
                      handleChange("has_relatives_in_destination", true)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_relatives_in_destination"
                    value="false"
                    checked={formData.has_relatives_in_destination === false}
                    onChange={() =>
                      handleChange("has_relatives_in_destination", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="onboarding-step">
            <h2>Financial Information</h2>
            <div className="form-group">
              <label>Maximum Budget (USD)</label>
              <input
                type="number"
                value={formData.max_budget_usd || ""}
                onChange={(e) =>
                  handleChange(
                    "max_budget_usd",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="5000"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Budget Currency</label>
                <input
                  type="text"
                  value={formData.budget_currency || ""}
                  onChange={(e) =>
                    handleChange("budget_currency", e.target.value)
                  }
                  placeholder="USD"
                />
              </div>
              <div className="form-group">
                <label>Budget Amount</label>
                <input
                  type="number"
                  value={formData.budget_amount || ""}
                  onChange={(e) =>
                    handleChange(
                      "budget_amount",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="5000"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Proof of Funds Source</label>
              <textarea
                value={formData.proof_of_funds_source || ""}
                onChange={(e) =>
                  handleChange("proof_of_funds_source", e.target.value)
                }
                placeholder="e.g., Savings, Loan, Sponsor..."
                rows="2"
              />
            </div>
            <div className="form-group">
              <label>Liquid Assets (USD)</label>
              <input
                type="number"
                value={formData.liquid_assets_usd || ""}
                onChange={(e) =>
                  handleChange(
                    "liquid_assets_usd",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="10000"
              />
            </div>
            <div className="form-group">
              <label>Do you own property?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_property"
                    value="true"
                    checked={formData.has_property === true}
                    onChange={() => handleChange("has_property", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_property"
                    value="false"
                    checked={formData.has_property === false}
                    onChange={() => handleChange("has_property", false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Total Assets (USD)</label>
                <input
                  type="number"
                  value={formData.total_assets_usd || ""}
                  onChange={(e) =>
                    handleChange(
                      "total_assets_usd",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="50000"
                />
              </div>
              <div className="form-group">
                <label>Annual Income (USD)</label>
                <input
                  type="number"
                  value={formData.annual_income_usd || ""}
                  onChange={(e) =>
                    handleChange(
                      "annual_income_usd",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="50000"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Monthly Salary (USD)</label>
              <input
                type="number"
                value={formData.salary_usd || ""}
                onChange={(e) =>
                  handleChange(
                    "salary_usd",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="4000"
              />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="onboarding-step">
            <h2>Special Items & Support</h2>
            <div className="form-group">
              <label>Do you have special needs?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_special_needs"
                    value="true"
                    checked={formData.has_special_needs === true}
                    onChange={() => handleChange("has_special_needs", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_special_needs"
                    value="false"
                    checked={formData.has_special_needs === false}
                    onChange={() => handleChange("has_special_needs", false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you have medical conditions?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_medical_conditions"
                    value="true"
                    checked={formData.has_medical_conditions === true}
                    onChange={() =>
                      handleChange("has_medical_conditions", true)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_medical_conditions"
                    value="false"
                    checked={formData.has_medical_conditions === false}
                    onChange={() =>
                      handleChange("has_medical_conditions", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you have an invitation?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_invitation"
                    value="true"
                    checked={formData.has_invitation === true}
                    onChange={() => handleChange("has_invitation", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_invitation"
                    value="false"
                    checked={formData.has_invitation === false}
                    onChange={() => handleChange("has_invitation", false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you have a sponsor in destination?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="sponsor_in_destination"
                    value="true"
                    checked={formData.sponsor_in_destination === true}
                    onChange={() =>
                      handleChange("sponsor_in_destination", true)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="sponsor_in_destination"
                    value="false"
                    checked={formData.sponsor_in_destination === false}
                    onChange={() =>
                      handleChange("sponsor_in_destination", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>International Achievements</label>
              <textarea
                value={formData.international_achievements || ""}
                onChange={(e) =>
                  handleChange("international_achievements", e.target.value)
                }
                placeholder="Research, patents, awards, etc."
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Publications Count</label>
                <input
                  type="number"
                  value={formData.publications_count || ""}
                  onChange={(e) =>
                    handleChange(
                      "publications_count",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Patents Count</label>
                <input
                  type="number"
                  value={formData.patents_count || ""}
                  onChange={(e) =>
                    handleChange(
                      "patents_count",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Awards</label>
              <textarea
                value={formData.awards || ""}
                onChange={(e) => handleChange("awards", e.target.value)}
                placeholder="List your awards..."
                rows="2"
              />
            </div>
            <div className="form-group">
              <label>Media Features</label>
              <textarea
                value={formData.media_features || ""}
                onChange={(e) => handleChange("media_features", e.target.value)}
                placeholder="Media mentions, features..."
                rows="2"
              />
            </div>
            <div className="form-group">
              <label>Professional Memberships</label>
              <textarea
                value={formData.professional_memberships || ""}
                onChange={(e) =>
                  handleChange("professional_memberships", e.target.value)
                }
                placeholder="Professional organizations..."
                rows="2"
              />
            </div>
            <div className="form-group">
              <label>Recommendation Letters Count</label>
              <input
                type="number"
                value={formData.recommendation_letters_count || ""}
                onChange={(e) =>
                  handleChange(
                    "recommendation_letters_count",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="0"
              />
            </div>
          </div>
        );

      case 9:
        return (
          <div className="onboarding-step">
            <h2>Documents & Preferences</h2>
            <div className="form-group">
              <label>Passport Expiry Date</label>
              <input
                type="date"
                value={formData.passport_expiry || ""}
                onChange={(e) =>
                  handleChange("passport_expiry", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Do you have a birth certificate?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_birth_certificate"
                    value="true"
                    checked={formData.has_birth_certificate === true}
                    onChange={() => handleChange("has_birth_certificate", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_birth_certificate"
                    value="false"
                    checked={formData.has_birth_certificate === false}
                    onChange={() =>
                      handleChange("has_birth_certificate", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you have financial statements?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_financial_statements"
                    value="true"
                    checked={formData.has_financial_statements === true}
                    onChange={() =>
                      handleChange("has_financial_statements", true)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_financial_statements"
                    value="false"
                    checked={formData.has_financial_statements === false}
                    onChange={() =>
                      handleChange("has_financial_statements", false)
                    }
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you have police clearance?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_police_clearance"
                    value="true"
                    checked={formData.has_police_clearance === true}
                    onChange={() => handleChange("has_police_clearance", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_police_clearance"
                    value="false"
                    checked={formData.has_police_clearance === false}
                    onChange={() => handleChange("has_police_clearance", false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you have medical exam results?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_medical_exam"
                    value="true"
                    checked={formData.has_medical_exam === true}
                    onChange={() => handleChange("has_medical_exam", true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_medical_exam"
                    value="false"
                    checked={formData.has_medical_exam === false}
                    onChange={() => handleChange("has_medical_exam", false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Risk Tolerance</label>
              <select
                value={formData.risk_tolerance || ""}
                onChange={(e) => handleChange("risk_tolerance", e.target.value)}
              >
                <option value="">Select...</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Do you prefer DIY or guided assistance?</label>
              <select
                value={formData.prefers_diy_or_guided || ""}
                onChange={(e) =>
                  handleChange("prefers_diy_or_guided", e.target.value)
                }
              >
                <option value="">Select...</option>
                <option value="diy">DIY (Do It Yourself)</option>
                <option value="guided">Guided Assistance</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepNames = [
    "Personal Details",
    "Destination & Timeline",
    "Education",
    "Work Experience",
    "Skills & Language",
    "Immigration History",
    "Financial Info",
    "Special Items",
    "Documents & Preferences",
  ];

  return (
    <div className="onboarding-page">
      {submitting && (
        <div
          className="onboarding-loading-overlay"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="onboarding-loading-card">
            <div className="onboarding-spinner" />
            <h3>Working on it…</h3>
            <p>{submitMessage || "Please wait"}</p>
          </div>
        </div>
      )}
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Let's get to know you</h1>
          <p>Help us provide personalized visa recommendations</p>
          <div className="progress-text-header">
            Step {currentStep} of {totalSteps} • {stepNames[currentStep - 1]}
          </div>
        </div>

        {/* Step Navigation Dots */}
        <div className="step-navigation">
          {stepNames.map((name, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            const isAccessible = stepNum <= currentStep || stepNum === currentStep + 1;
            
            return (
              <div
                key={stepNum}
                className={`step-dot ${isActive ? "active" : ""} ${
                  isCompleted ? "completed" : ""
                } ${isAccessible ? "accessible" : ""}`}
                onClick={() => isAccessible && handleStepClick(stepNum)}
                title={name}
              >
                <div className="step-dot-circle">
                  {isCompleted ? "✓" : stepNum}
                </div>
                <span className="step-dot-label">{name}</span>
              </div>
            );
          })}
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>


        <div className="onboarding-content" ref={stepRef}>
          {renderStep()}
        </div>

        <div className="keyboard-hint">
          <small>
            💡 Tip: Press <kbd>Ctrl</kbd> + <kbd>→</kbd> to go next,{" "}
            <kbd>Ctrl</kbd> + <kbd>←</kbd> to go back
          </small>
        </div>

        <div className="onboarding-actions">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="btn-secondary"
              disabled={submitting}
            >
              ← Previous
            </button>
          )}
          <div className="spacer"></div>
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="btn-primary"
              disabled={submitting}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-primary btn-complete"
              disabled={submitting}
            >
              {submitting ? "Generating…" : "✓ Complete Onboarding"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
