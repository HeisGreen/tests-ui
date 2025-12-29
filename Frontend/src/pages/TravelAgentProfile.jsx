import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { travelAgentAPI } from "../utils/api";
import {
  FiUser,
  FiEdit,
  FiCheckCircle,
  FiAlertCircle,
  FiLogOut,
  FiGlobe,
  FiClock,
  FiMail,
  FiPhone,
  FiMessageCircle,
} from "react-icons/fi";
import { countries } from "../data/countries";
import "./TravelAgentProfile.css";

function TravelAgentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState("available");
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await travelAgentAPI.getProfile();
      setProfile(data);
      const onboardingData = data.onboarding_data || {};
      setAvailability(onboardingData.availability_status || "available");
    } catch (error) {
      console.error("Error loading profile:", error);
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getCountryName = (code) => {
    const country = countries.find((c) => c.code === code);
    return country?.name || code;
  };

  const specializationLabels = {
    visas: "Visas",
    relocation: "Relocation",
    student_migration: "Student Migration",
    work_permits: "Work Permits",
    family_reunification: "Family Reunification",
    business_immigration: "Business Immigration",
    investment_immigration: "Investment Immigration",
    tourism_visas: "Tourism Visas",
    permanent_residency: "Permanent Residency",
    citizenship: "Citizenship",
  };

  if (loading) {
    return (
      <div className="agent-profile-loading">
        <div className="spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  const onboardingData = profile?.onboarding_data || {};
  const isVerified = profile?.is_verified || false;

  return (
    <div className="travel-agent-profile">
      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {onboardingData.full_name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="profile-header-info">
            <h1>{onboardingData.full_name || user?.name || "Travel Agent"}</h1>
            {onboardingData.business_name && (
              <p className="business-name">{onboardingData.business_name}</p>
            )}
            <div className="verification-status">
              {isVerified ? (
                <span className="verified-badge">
                  <FiCheckCircle /> Verified Agent
                </span>
              ) : (
                <span className="unverified-badge">
                  <FiAlertCircle /> Unverified
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button
            className="btn-edit-profile"
            onClick={() => navigate("/agent-onboarding")}
          >
            <FiEdit /> Edit Profile
          </button>
        </div>
      </div>

      {/* Availability Toggle */}
      <div className="availability-section">
        <div className="availability-info">
          <h3>Availability Status</h3>
          <p>Control whether users can contact you</p>
        </div>
        <label className="availability-toggle-large">
          <input
            type="checkbox"
            checked={availability === "available"}
            onChange={handleAvailabilityToggle}
            disabled={updatingAvailability}
          />
          <span className="toggle-slider-large"></span>
          <span className="toggle-label-large">
            {availability === "available" ? "Available" : "Unavailable"}
          </span>
        </label>
      </div>

      {/* Profile Details */}
      <div className="profile-details-grid">
        {/* Professional Info */}
        <div className="profile-card">
          <h2>Professional Information</h2>
          <div className="detail-row">
            <span className="detail-label">Years of Experience</span>
            <span className="detail-value">
              {onboardingData.years_of_experience || "Not specified"}
            </span>
          </div>
          {onboardingData.bio && (
            <div className="detail-row full-width">
              <span className="detail-label">Bio</span>
              <p className="detail-value bio-text">{onboardingData.bio}</p>
            </div>
          )}
        </div>

        {/* Specializations */}
        <div className="profile-card">
          <h2>Specializations</h2>
          {onboardingData.specializations && onboardingData.specializations.length > 0 ? (
            <div className="tags-list">
              {onboardingData.specializations.map((spec) => (
                <span key={spec} className="tag">
                  {specializationLabels[spec] || spec}
                </span>
              ))}
            </div>
          ) : (
            <p className="no-data">No specializations specified</p>
          )}
        </div>

        {/* Location & Coverage */}
        <div className="profile-card">
          <h2>Location & Coverage</h2>
          {onboardingData.country_of_operation && (
            <div className="detail-row">
              <span className="detail-label">
                <FiGlobe /> Country of Operation
              </span>
              <span className="detail-value">
                {getCountryName(onboardingData.country_of_operation)}
              </span>
            </div>
          )}
          {onboardingData.cities_covered && onboardingData.cities_covered.length > 0 && (
            <div className="detail-row full-width">
              <span className="detail-label">Cities Covered</span>
              <div className="cities-list">
                {onboardingData.cities_covered.map((city, idx) => (
                  <span key={idx} className="city-tag">{city}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Destination Expertise */}
        <div className="profile-card">
          <h2>Destination Expertise</h2>
          {onboardingData.supported_destination_countries &&
          onboardingData.supported_destination_countries.length > 0 ? (
            <div className="countries-list">
              {onboardingData.supported_destination_countries.map((code) => (
                <span key={code} className="country-tag">
                  {getCountryName(code)}
                </span>
              ))}
            </div>
          ) : (
            <p className="no-data">No destination countries specified</p>
          )}
        </div>

        {/* Languages */}
        <div className="profile-card">
          <h2>Languages Spoken</h2>
          {onboardingData.languages_spoken && onboardingData.languages_spoken.length > 0 ? (
            <div className="tags-list">
              {onboardingData.languages_spoken.map((lang, idx) => (
                <span key={idx} className="tag">{lang}</span>
              ))}
            </div>
          ) : (
            <p className="no-data">No languages specified</p>
          )}
        </div>

        {/* Contact Information */}
        <div className="profile-card">
          <h2>Contact Information</h2>
          <div className="detail-row">
            <span className="detail-label">
              <FiMail /> Email
            </span>
            <span className="detail-value">{user?.email || "N/A"}</span>
          </div>
          {onboardingData.preferred_contact_method && (
            <div className="detail-row">
              <span className="detail-label">Preferred Method</span>
              <span className="detail-value">
                {onboardingData.preferred_contact_method
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </span>
            </div>
          )}
          {onboardingData.contact_details && (
            <>
              {onboardingData.contact_details.whatsapp && (
                <div className="detail-row">
                  <span className="detail-label">
                    <FiMessageCircle /> WhatsApp
                  </span>
                  <span className="detail-value">
                    {onboardingData.contact_details.whatsapp}
                  </span>
                </div>
              )}
              {onboardingData.contact_details.phone && (
                <div className="detail-row">
                  <span className="detail-label">
                    <FiPhone /> Phone
                  </span>
                  <span className="detail-value">
                    {onboardingData.contact_details.phone}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Verification Requirements (if not verified) */}
      {!isVerified && (
        <div className="verification-requirements">
          <FiAlertCircle />
          <div>
            <h3>Get Verified</h3>
            <p>
              Complete your profile with all required information to get verified.
              Verified agents are more trusted by users.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate("/agent-onboarding")}
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      {/* Logout Section */}
      <div className="logout-section">
        <button className="btn-logout" onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </div>
    </div>
  );
}

export default TravelAgentProfile;

