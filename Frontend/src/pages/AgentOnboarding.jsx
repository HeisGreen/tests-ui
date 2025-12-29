import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { travelAgentAPI } from "../utils/api";
import { countries } from "../data/countries";
import "./Onboarding.css";

function AgentOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    country_of_operation: "",
    cities_covered: [],
    years_of_experience: null,
    specializations: [],
    supported_destination_countries: [],
    preferred_contact_method: "",
    contact_details: {
      whatsapp: "",
      email: "",
      phone: "",
    },
    languages_spoken: [],
    bio: "",
    availability_status: "available",
  });

  const [cityInput, setCityInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");

  useEffect(() => {
    // Load schema
    travelAgentAPI
      .getOnboardingSchema()
      .then((data) => setSchema(data))
      .catch((err) => console.error("Error loading schema:", err));

    // Load existing profile if available
    travelAgentAPI
      .getProfile()
      .then((profile) => {
        if (profile && profile.onboarding_data) {
          setFormData((prev) => ({
            ...prev,
            ...profile.onboarding_data,
          }));
        }
      })
      .catch((err) => {
        // Profile might not exist yet, which is fine
        console.log("No existing profile found");
      });
  }, []);

  const sortedCountries = [...countries].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const specializationOptions = [
    { value: "visas", label: "Visas" },
    { value: "relocation", label: "Relocation" },
    { value: "student_migration", label: "Student Migration" },
    { value: "work_permits", label: "Work Permits" },
    { value: "family_reunification", label: "Family Reunification" },
    { value: "business_immigration", label: "Business Immigration" },
    { value: "investment_immigration", label: "Investment Immigration" },
    { value: "tourism_visas", label: "Tourism Visas" },
    { value: "permanent_residency", label: "Permanent Residency" },
    { value: "citizenship", label: "Citizenship" },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNestedChange = (field, subField, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value,
      },
    }));
  };

  const addCity = () => {
    if (cityInput.trim() && !formData.cities_covered.includes(cityInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        cities_covered: [...prev.cities_covered, cityInput.trim()],
      }));
      setCityInput("");
    }
  };

  const removeCity = (city) => {
    setFormData((prev) => ({
      ...prev,
      cities_covered: prev.cities_covered.filter((c) => c !== city),
    }));
  };

  const addLanguage = () => {
    if (
      languageInput.trim() &&
      !formData.languages_spoken.includes(languageInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        languages_spoken: [...prev.languages_spoken, languageInput.trim()],
      }));
      setLanguageInput("");
    }
  };

  const removeLanguage = (lang) => {
    setFormData((prev) => ({
      ...prev,
      languages_spoken: prev.languages_spoken.filter((l) => l !== lang),
    }));
  };

  const toggleSpecialization = (spec) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const toggleDestinationCountry = (countryCode) => {
    setFormData((prev) => ({
      ...prev,
      supported_destination_countries: prev.supported_destination_countries.includes(
        countryCode
      )
        ? prev.supported_destination_countries.filter((c) => c !== countryCode)
        : [...prev.supported_destination_countries, countryCode],
    }));
  };

  const validateStep = (step) => {
    const stepErrors = {};
    if (step === 1) {
      if (!formData.full_name) stepErrors.full_name = "Full name is required";
      if (!formData.country_of_operation)
        stepErrors.country_of_operation = "Country of operation is required";
      if (!formData.cities_covered || formData.cities_covered.length === 0)
        stepErrors.cities_covered = "At least one city is required";
    }
    if (step === 2) {
      if (!formData.years_of_experience)
        stepErrors.years_of_experience = "Years of experience is required";
      if (!formData.specializations || formData.specializations.length === 0)
        stepErrors.specializations = "At least one specialization is required";
      if (
        !formData.supported_destination_countries ||
        formData.supported_destination_countries.length === 0
      )
        stepErrors.supported_destination_countries =
          "At least one destination country is required";
    }
    if (step === 3) {
      if (!formData.preferred_contact_method)
        stepErrors.preferred_contact_method = "Preferred contact method is required";
      if (!formData.languages_spoken || formData.languages_spoken.length === 0)
        stepErrors.languages_spoken = "At least one language is required";
      if (!formData.bio) stepErrors.bio = "Bio is required";
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setSubmitting(true);
      await travelAgentAPI.updateProfile(formData);
      navigate("/agent/home");
    } catch (error) {
      console.error("Error saving agent profile:", error);
      setErrors({ submit: error.message || "Failed to save profile" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onboarding-page">
      {submitting && (
        <div className="onboarding-loading-overlay">
          <div className="onboarding-loading-card">
            <div className="onboarding-spinner" />
            <h3>Saving your profile...</h3>
          </div>
        </div>
      )}
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Complete Your Travel Agent Profile</h1>
          <p>Help users find you and connect with the right clients</p>
          <div className="progress-text-header">
            Step {currentStep} of 3
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>

        <div className="onboarding-content">
          {currentStep === 1 && (
            <div className="onboarding-step">
              <h2>Personal & Business Information</h2>
              <div className="form-group">
                <label>
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name || ""}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  className={errors.full_name ? "error" : ""}
                  placeholder="John Doe"
                />
                {errors.full_name && (
                  <span className="error-message">{errors.full_name}</span>
                )}
              </div>

              <div className="form-group">
                <label>Business / Agency Name (Optional)</label>
                <input
                  type="text"
                  value={formData.business_name || ""}
                  onChange={(e) =>
                    handleChange("business_name", e.target.value)
                  }
                  placeholder="ABC Travel Agency"
                />
              </div>

              <div className="form-group">
                <label>
                  Country of Operation <span className="required">*</span>
                </label>
                <select
                  value={formData.country_of_operation || ""}
                  onChange={(e) =>
                    handleChange("country_of_operation", e.target.value)
                  }
                  className={errors.country_of_operation ? "error" : ""}
                >
                  <option value="">Select a country...</option>
                  {sortedCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country_of_operation && (
                  <span className="error-message">
                    {errors.country_of_operation}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Cities Covered <span className="required">*</span>
                </label>
                <div className="chip-input-group">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCity();
                      }
                    }}
                    placeholder="Type city name and press Enter"
                  />
                  <button type="button" onClick={addCity} className="btn-add">
                    Add
                  </button>
                </div>
                <div className="chip-list">
                  {formData.cities_covered.map((city) => (
                    <span key={city} className="chip">
                      {city}
                      <button
                        type="button"
                        onClick={() => removeCity(city)}
                        className="chip-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {errors.cities_covered && (
                  <span className="error-message">
                    {errors.cities_covered}
                  </span>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="onboarding-step">
              <h2>Experience & Expertise</h2>
              <div className="form-group">
                <label>
                  Years of Experience <span className="required">*</span>
                </label>
                <input
                  type="number"
                  value={formData.years_of_experience || ""}
                  onChange={(e) =>
                    handleChange(
                      "years_of_experience",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className={errors.years_of_experience ? "error" : ""}
                  placeholder="5"
                  min="0"
                  max="50"
                />
                {errors.years_of_experience && (
                  <span className="error-message">
                    {errors.years_of_experience}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Areas of Specialization <span className="required">*</span>
                </label>
                <div className="checkbox-group">
                  {specializationOptions.map((opt) => (
                    <label key={opt.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(opt.value)}
                        onChange={() => toggleSpecialization(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {errors.specializations && (
                  <span className="error-message">
                    {errors.specializations}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Supported Destination Countries{" "}
                  <span className="required">*</span>
                </label>
                <div className="multi-select-wrapper">
                  <div className="selected-chips">
                    {formData.supported_destination_countries.length > 0 ? (
                      formData.supported_destination_countries.map((code) => {
                        const country = sortedCountries.find(
                          (c) => c.code === code
                        );
                        return (
                          <span key={code} className="chip">
                            {country?.name || code}
                            <button
                              type="button"
                              onClick={() =>
                                toggleDestinationCountry(code)
                              }
                              className="chip-remove"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })
                    ) : (
                      <span className="placeholder">
                        Select destination countries...
                      </span>
                    )}
                  </div>
                </div>
                <div className="country-list" style={{ maxHeight: "200px", overflowY: "auto", marginTop: "10px" }}>
                  {sortedCountries.map((country) => {
                    const isSelected =
                      formData.supported_destination_countries.includes(
                        country.code
                      );
                    return (
                      <div
                        key={country.code}
                        className={`country-option ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleDestinationCountry(country.code)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                        />
                        <span>{country.name}</span>
                      </div>
                    );
                  })}
                </div>
                {errors.supported_destination_countries && (
                  <span className="error-message">
                    {errors.supported_destination_countries}
                  </span>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="onboarding-step">
              <h2>Contact & Availability</h2>
              <div className="form-group">
                <label>
                  Preferred Contact Method <span className="required">*</span>
                </label>
                <select
                  value={formData.preferred_contact_method || ""}
                  onChange={(e) =>
                    handleChange("preferred_contact_method", e.target.value)
                  }
                  className={errors.preferred_contact_method ? "error" : ""}
                >
                  <option value="">Select...</option>
                  <option value="in_app_chat">In-App Chat</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
                {errors.preferred_contact_method && (
                  <span className="error-message">
                    {errors.preferred_contact_method}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Contact Details</label>
                <input
                  type="text"
                  value={formData.contact_details?.whatsapp || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "contact_details",
                      "whatsapp",
                      e.target.value
                    )
                  }
                  placeholder="WhatsApp number (e.g., +1234567890)"
                />
                <input
                  type="email"
                  value={formData.contact_details?.email || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "contact_details",
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="Email address"
                  style={{ marginTop: "10px" }}
                />
                <input
                  type="text"
                  value={formData.contact_details?.phone || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "contact_details",
                      "phone",
                      e.target.value
                    )
                  }
                  placeholder="Phone number"
                  style={{ marginTop: "10px" }}
                />
              </div>

              <div className="form-group">
                <label>
                  Languages Spoken <span className="required">*</span>
                </label>
                <div className="chip-input-group">
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLanguage();
                      }
                    }}
                    placeholder="Type language and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="btn-add"
                  >
                    Add
                  </button>
                </div>
                <div className="chip-list">
                  {formData.languages_spoken.map((lang) => (
                    <span key={lang} className="chip">
                      {lang}
                      <button
                        type="button"
                        onClick={() => removeLanguage(lang)}
                        className="chip-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {errors.languages_spoken && (
                  <span className="error-message">
                    {errors.languages_spoken}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Professional Bio <span className="required">*</span>
                </label>
                <textarea
                  value={formData.bio || ""}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className={errors.bio ? "error" : ""}
                  placeholder="Tell us about your experience and expertise..."
                  rows="5"
                  maxLength={500}
                />
                <small className="help-text">
                  {formData.bio?.length || 0}/500 characters
                </small>
                {errors.bio && (
                  <span className="error-message">{errors.bio}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Availability Status <span className="required">*</span>
                </label>
                <select
                  value={formData.availability_status || "available"}
                  onChange={(e) =>
                    handleChange("availability_status", e.target.value)
                  }
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          )}
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
          {currentStep < 3 ? (
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
              {submitting ? "Saving..." : "✓ Complete Profile"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgentOnboarding;

