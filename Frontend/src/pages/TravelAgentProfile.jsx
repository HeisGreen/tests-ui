import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { travelAgentAPI } from "../utils/api";
import { supabase } from "../config/firebase";
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
  FiCamera,
  FiUpload,
  FiX,
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
  
  // Profile photo states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

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

  // Profile photo handlers
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be less than 5MB");
      return;
    }
    
    setPhotoError("");
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Upload the file
    uploadProfilePhoto(file);
  };

  const uploadProfilePhoto = async (file) => {
    setUploadingPhoto(true);
    setPhotoError("");
    
    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `agent-avatars/${user.id}_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });
      
      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload image");
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);
      
      const publicUrl = urlData?.publicUrl;
      
      if (!publicUrl) {
        throw new Error("Failed to get public URL");
      }
      
      // Update agent profile with new photo URL
      const currentData = profile?.onboarding_data || {};
      await travelAgentAPI.updateProfile({
        ...currentData,
        profile_photo_url: publicUrl,
      });
      
      // Refresh profile
      await loadProfile();
      setPreviewUrl(null);
      
    } catch (err) {
      console.error("Error uploading profile photo:", err);
      setPhotoError(err.message || "Failed to upload photo");
      setPreviewUrl(null);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeProfilePhoto = async () => {
    setUploadingPhoto(true);
    setPhotoError("");
    
    try {
      const currentData = profile?.onboarding_data || {};
      await travelAgentAPI.updateProfile({
        ...currentData,
        profile_photo_url: null,
      });
      
      await loadProfile();
    } catch (err) {
      console.error("Error removing profile photo:", err);
      setPhotoError(err.message || "Failed to remove photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
  
  // Get display photo URL (after onboardingData is defined)
  const displayPhotoUrl = previewUrl || onboardingData?.profile_photo_url;

  return (
    <div className="travel-agent-profile">
      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar-container">
            {displayPhotoUrl ? (
              <img 
                src={displayPhotoUrl} 
                alt="Profile" 
                className={`profile-avatar-large-img ${uploadingPhoto ? "uploading" : ""}`}
              />
            ) : (
              <div className={`profile-avatar-large ${uploadingPhoto ? "uploading" : ""}`}>
                {onboardingData.full_name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
            )}
            
            {uploadingPhoto && (
              <div className="avatar-loading-overlay">
                <div className="avatar-spinner"></div>
              </div>
            )}
            
            <button 
              type="button" 
              className="avatar-edit-btn"
              onClick={triggerFileInput}
              disabled={uploadingPhoto}
              title="Change photo"
            >
              <FiCamera />
            </button>
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
            
            {/* Photo upload buttons */}
            <div className="avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoSelect}
                className="hidden-file-input"
              />
              
              <button 
                type="button" 
                className="btn-upload-photo-small"
                onClick={triggerFileInput}
                disabled={uploadingPhoto}
              >
                <FiUpload />
                {uploadingPhoto ? "Uploading..." : "Upload Photo"}
              </button>
              
              {onboardingData.profile_photo_url && (
                <button 
                  type="button" 
                  className="btn-remove-photo-small"
                  onClick={removeProfilePhoto}
                  disabled={uploadingPhoto}
                >
                  <FiX />
                  Remove
                </button>
              )}
            </div>
            
            {photoError && <p className="photo-error">{photoError}</p>}
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

