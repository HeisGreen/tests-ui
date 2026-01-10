import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { countries } from "../data/countries";
import { profileAPI, recommendationsAPI } from "../utils/api";
import {
  transformToBackendFormat,
  transformToFormFormat,
} from "../utils/dataTransform";
import NavigationHeader from "../components/kastamer/NavigationHeader";
import ProgressSidebar from "../components/kastamer/ProgressSidebar";
import GoalSidebar from "../components/kastamer/GoalSidebar";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { MultiSelect } from "../components/ui/multi-select";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Sparkles, Globe, FileText, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import "./Onboarding.css";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const stepRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Sort countries alphabetically
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const profile = await profileAPI.getProfile();
        if (profile?.onboarding_data) {
          const transformedData = transformToFormFormat(profile.onboarding_data);
          setFormData(transformedData || {});
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingData();
  }, []);

  const handleChange = (name, value) => {
      setFormData((prev) => ({
        ...prev,
      [name]: value,
      }));
    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.nationality) newErrors.nationality = "Nationality is required";
    } else if (step === 2) {
      if (!formData.preferred_destinations)
        newErrors.preferred_destinations = "At least one destination is required";
      if (!formData.target_timeline)
        newErrors.target_timeline = "Timeline is required";
    } else if (step === 3) {
      if (!formData.education_level)
        newErrors.education_level = "Education level is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

      setSubmitting(true);
    setSubmitMessage("Saving your profile...");
    try {
      // Step 1: Save the profile
      const backendData = transformToBackendFormat(formData);
      await profileAPI.updateProfile(backendData);
      
      // Step 2: Generate recommendations
      setSubmitting(false);
      setGeneratingRecommendations(true);
      setSubmitMessage("Generating personalized recommendations...");
      
      const response = await recommendationsAPI.getRecommendations(false);
      
      // Handle both direct response and nested response.data structure
      const recommendations = response?.data || response;
      
      console.log("Generated recommendations response:", response);
      console.log("Processed recommendations:", recommendations);
      console.log("Recommendations options:", recommendations?.options);
      
      if (!recommendations || !recommendations.options || recommendations.options.length === 0) {
        throw new Error("No recommendations were generated. Please try again.");
      }
      
      // Step 3: Navigate to recommendations page with the generated data
      navigate("/recommendation", {
        state: {
          initialRecommendations: recommendations,
        },
      });
    } catch (error) {
      console.error("Error saving profile or generating recommendations:", error);
      setSubmitMessage("");
      setGeneratingRecommendations(false);
      alert(
        error.message || "Failed to save profile or generate recommendations. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedCountries = (fieldName) => {
    if (!formData[fieldName]) return [];
    return formData[fieldName].split(", ").filter((c) => c);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="onboarding-step">
            <div className="form-group">
              <Label>
                Nationality <span className="required">*</span>
              </Label>
              <Select
                value={formData.nationality || ""}
                onValueChange={(value) => handleChange("nationality", value)}
              >
                <SelectTrigger className={errors.nationality ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a country..." />
                </SelectTrigger>
                <SelectContent>
                {sortedCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                    {country.name}
                    </SelectItem>
                ))}
                </SelectContent>
              </Select>
              {errors.nationality && (
                <span className="error-message">{errors.nationality}</span>
              )}
            </div>
            <div className="form-group">
              <Label>Current Residence Country</Label>
              <Select
                value={formData.current_residence_country || ""}
                onValueChange={(value) => handleChange("current_residence_country", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a country..." />
                </SelectTrigger>
                <SelectContent>
                {sortedCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                    {country.name}
                    </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Applying From Country</Label>
              <Select
                value={formData.applying_from_country || ""}
                onValueChange={(value) => handleChange("applying_from_country", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a country..." />
                </SelectTrigger>
                <SelectContent>
                {sortedCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                    {country.name}
                    </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <Label>Age</Label>
                <Input
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
                <Label>Marital Status</Label>
                <Select
                  value={formData.marital_status || ""}
                  onValueChange={(value) => handleChange("marital_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.marital_status === "married" && (
                <div className="form-row">
                  <div className="form-group">
                  <Label>Spouse Nationality</Label>
                  <Select
                      value={formData.spouse_nationality || ""}
                    onValueChange={(value) => handleChange("spouse_nationality", value)}
                    >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                  <div className="form-group">
                  <Label>Spouse Profession</Label>
                  <Input
                      type="text"
                      value={formData.spouse_profession || ""}
                      onChange={(e) =>
                        handleChange("spouse_profession", e.target.value)
                      }
                      placeholder="e.g., Engineer"
                    />
                  </div>
                </div>
            )}
            <div className="form-group">
              <Label>Number of Dependents</Label>
              <Input
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
            <div className="form-group">
              <Label>
                Preferred Destination(s) <span className="required">*</span>
              </Label>
              <MultiSelect
                options={sortedCountries.map((c) => ({ value: c.code, label: c.name }))}
                selected={getSelectedCountries("preferred_destinations")}
                onSelectionChange={(values) => {
                  handleChange("preferred_destinations", values.length > 0 ? values.join(", ") : null);
                }}
                placeholder="Select one or more countries..."
                searchable={true}
              />
              {errors.preferred_destinations && (
                <span className="error-message">
                  {errors.preferred_destinations}
                </span>
              )}
            </div>
            <div className="form-group">
              <Label>
                Target Timeline <span className="required">*</span>
              </Label>
              <Select
                value={formData.target_timeline || ""}
                onValueChange={(value) => handleChange("target_timeline", value)}
              >
                <SelectTrigger className={errors.target_timeline ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="3_months">3 months</SelectItem>
                  <SelectItem value="6_months">6 months</SelectItem>
                  <SelectItem value="1_year">1 year</SelectItem>
                  <SelectItem value="2_years">2+ years</SelectItem>
                </SelectContent>
              </Select>
              {errors.target_timeline && (
                <span className="error-message">{errors.target_timeline}</span>
              )}
            </div>
            <div className="form-group">
              <Label>Target Move Date</Label>
              <Input
                type="date"
                value={formData.target_move_date || ""}
                onChange={(e) => handleChange("target_move_date", e.target.value)}
              />
            </div>
            <div className="form-group">
              <Label>Do you have a hard deadline?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.deadline_hard === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("deadline_hard", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.deadline_hard === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.deadline_hard === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.deadline_hard === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("deadline_hard", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.deadline_hard === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.deadline_hard === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            {formData.deadline_hard && (
              <div className="form-group">
                <Label>Deadline Reason</Label>
                <Textarea
                  value={formData.deadline_reason || ""}
                  onChange={(e) => handleChange("deadline_reason", e.target.value)}
                  placeholder="Explain your deadline..."
                  rows="3"
                />
              </div>
            )}
            <div className="form-group">
              <Label>Willing to consider alternative countries?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.willing_to_consider_alternatives === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("willing_to_consider_alternatives", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.willing_to_consider_alternatives === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.willing_to_consider_alternatives === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.willing_to_consider_alternatives === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("willing_to_consider_alternatives", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.willing_to_consider_alternatives === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.willing_to_consider_alternatives === false && <Check className="w-3 h-3 text-white" />}
                              </div>
                    <span className="font-medium text-sm">No</span>
                      </div>
                    </div>
                </div>
            </div>
            {formData.willing_to_consider_alternatives && (
              <div className="form-group">
                <Label>Alternative Countries</Label>
                <MultiSelect
                  options={sortedCountries.map((c) => ({ value: c.code, label: c.name }))}
                  selected={getSelectedCountries("alternative_countries")}
                  onSelectionChange={(values) => {
                    handleChange("alternative_countries", values.length > 0 ? values.join(", ") : null);
                  }}
                  placeholder="Select alternative countries..."
                  searchable={true}
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="onboarding-step">
            <div className="form-group">
              <Label>
                Education Level <span className="required">*</span>
              </Label>
              <Select
                value={formData.education_level || ""}
                onValueChange={(value) => handleChange("education_level", value)}
              >
                <SelectTrigger className={errors.education_level ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="diploma">Diploma/Certificate</SelectItem>
                </SelectContent>
              </Select>
              {errors.education_level && (
                <span className="error-message">{errors.education_level}</span>
              )}
            </div>
            <div className="form-group">
              <Label>Field of Study</Label>
              <Input
                type="text"
                value={formData.field_of_study || ""}
                onChange={(e) => handleChange("field_of_study", e.target.value)}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div className="form-group">
              <Label>Do you have academic transcripts?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_academic_transcripts === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_academic_transcripts", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_academic_transcripts === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_academic_transcripts === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_academic_transcripts === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_academic_transcripts", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_academic_transcripts === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_academic_transcripts === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <Label>Do you have an admission offer?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_admission_offer === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_admission_offer", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_admission_offer === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_admission_offer === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_admission_offer === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_admission_offer", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_admission_offer === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_admission_offer === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            {formData.has_admission_offer && (
              <div className="form-group">
                <Label>Admission Details</Label>
                <Textarea
                  value={formData.admission_details || ""}
                  onChange={(e) => handleChange("admission_details", e.target.value)}
                  placeholder="University name, program, start date..."
                  rows="3"
                />
              </div>
            )}
            <div className="form-group">
              <Label>Professional Certifications</Label>
              <Textarea
                value={formData.professional_certifications || ""}
                onChange={(e) => handleChange("professional_certifications", e.target.value)}
                placeholder="List your certifications..."
                rows="3"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="onboarding-step">
            <div className="form-row">
              <div className="form-group">
                <Label>Current Job Title</Label>
                <Input
                  type="text"
                  value={formData.current_job_title || ""}
                  onChange={(e) => handleChange("current_job_title", e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="form-group">
                <Label>Current Employer</Label>
                <Input
                  type="text"
                  value={formData.current_employer || ""}
                  onChange={(e) => handleChange("current_employer", e.target.value)}
                  placeholder="Company name"
                />
              </div>
            </div>
            <div className="form-group">
              <Label>Industry</Label>
              <Input
                type="text"
                value={formData.industry || ""}
                onChange={(e) => handleChange("industry", e.target.value)}
                placeholder="e.g., Technology"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <Label>Total Experience (Years)</Label>
                <Input
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
                <Label>Experience in Current Position (Years)</Label>
                <Input
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
              <Label>Are you self-employed?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.is_self_employed === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("is_self_employed", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.is_self_employed === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.is_self_employed === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.is_self_employed === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("is_self_employed", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.is_self_employed === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.is_self_employed === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <Label>Are you a business owner?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.is_business_owner === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("is_business_owner", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.is_business_owner === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.is_business_owner === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.is_business_owner === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("is_business_owner", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.is_business_owner === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.is_business_owner === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            {formData.is_business_owner && (
              <div className="form-group">
                <Label>Business Management Experience (Years)</Label>
                <Input
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
              <Label>Is your employer willing to sponsor?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.employer_willing_to_sponsor === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("employer_willing_to_sponsor", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.employer_willing_to_sponsor === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.employer_willing_to_sponsor === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.employer_willing_to_sponsor === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("employer_willing_to_sponsor", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.employer_willing_to_sponsor === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.employer_willing_to_sponsor === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <Label>Do you have a job offer internationally?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_job_offer_international === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_job_offer_international", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_job_offer_international === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_job_offer_international === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_job_offer_international === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_job_offer_international", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_job_offer_international === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_job_offer_international === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="onboarding-step">
            <div className="form-group">
              <Label>Skills</Label>
              <Textarea
                value={formData.skills || ""}
                onChange={(e) => handleChange("skills", e.target.value)}
                placeholder="List your key skills..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <Label>Languages Known</Label>
              <Input
                type="text"
                value={formData.languages_known || ""}
                onChange={(e) => handleChange("languages_known", e.target.value)}
                placeholder="e.g., English, French, Spanish"
              />
            </div>
            <div className="form-group">
              <Label>Language Tests Taken</Label>
              <Input
                type="text"
                value={formData.language_tests_taken || ""}
                onChange={(e) => handleChange("language_tests_taken", e.target.value)}
                placeholder="e.g., IELTS, TOEFL"
              />
            </div>
            <div className="form-group">
              <Label>Language Test Scores</Label>
              <Textarea
                value={formData.language_scores || ""}
                onChange={(e) => handleChange("language_scores", e.target.value)}
                placeholder="Test name and scores..."
                rows="3"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="onboarding-step">
            <div className="form-group">
              <Label>Have you applied for visas before?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_prior_visa_applications === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_prior_visa_applications", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_prior_visa_applications === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_prior_visa_applications === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_prior_visa_applications === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_prior_visa_applications", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_prior_visa_applications === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_prior_visa_applications === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            {formData.has_prior_visa_applications && (
              <div className="form-group">
                <Label>Prior Visas</Label>
                <Textarea
                  value={formData.prior_visas || ""}
                  onChange={(e) => handleChange("prior_visas", e.target.value)}
                  placeholder="List previous visa applications..."
                  rows="3"
                />
              </div>
            )}
            <div className="form-group">
              <Label>Do you have active visas?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_active_visas === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_active_visas", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_active_visas === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_active_visas === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_active_visas === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_active_visas", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_active_visas === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_active_visas === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            {formData.has_active_visas && (
              <>
                <div className="form-group">
                  <Label>Current Visa Status</Label>
                  <Input
                    type="text"
                    value={formData.current_visa_status || ""}
                    onChange={(e) => handleChange("current_visa_status", e.target.value)}
                    placeholder="e.g., Tourist, Student"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <Label>Current Visa Country</Label>
                    <Select
                      value={formData.current_visa_country || ""}
                      onValueChange={(value) => handleChange("current_visa_country", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country..." />
                      </SelectTrigger>
                      <SelectContent>
                      {sortedCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                          {country.name}
                          </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="form-group">
                    <Label>Visa Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.current_visa_expiry || ""}
                      onChange={(e) => handleChange("current_visa_expiry", e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="form-group">
              <Label>Have you ever overstayed a visa?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_overstays === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_overstays", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_overstays === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_overstays === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_overstays === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_overstays", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_overstays === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_overstays === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            {formData.has_overstays && (
              <div className="form-group">
                <Label>Overstay Details</Label>
                <Textarea
                  value={formData.overstay_details || ""}
                  onChange={(e) => handleChange("overstay_details", e.target.value)}
                  placeholder="Provide details..."
                  rows="3"
                />
              </div>
            )}
            <div className="form-group">
              <Label>Do you have any criminal records?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.criminal_records === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("criminal_records", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.criminal_records === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.criminal_records === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.criminal_records === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("criminal_records", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.criminal_records === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.criminal_records === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <Label>Do you have relatives in your destination country?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_relatives_in_destination === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_relatives_in_destination", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_relatives_in_destination === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_relatives_in_destination === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_relatives_in_destination === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_relatives_in_destination", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_relatives_in_destination === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_relatives_in_destination === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="onboarding-step">
            <div className="form-group">
              <Label>Maximum Budget (USD)</Label>
              <Input
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
                <Label>Budget Currency</Label>
                <Input
                  type="text"
                  value={formData.budget_currency || ""}
                  onChange={(e) => handleChange("budget_currency", e.target.value)}
                  placeholder="USD"
                />
              </div>
              <div className="form-group">
                <Label>Budget Amount</Label>
                <Input
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
              <Label>Proof of Funds Source</Label>
              <Textarea
                value={formData.proof_of_funds_source || ""}
                onChange={(e) => handleChange("proof_of_funds_source", e.target.value)}
                placeholder="e.g., Savings, Loan, Sponsor..."
                rows="2"
              />
            </div>
            <div className="form-group">
              <Label>Liquid Assets (USD)</Label>
              <Input
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
              <Label>Do you own property?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_property === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_property", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_property === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_property === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_property === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_property", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_property === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_property === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <Label>Total Assets (USD)</Label>
                <Input
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
                <Label>Annual Income (USD)</Label>
                <Input
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
              <Label>Monthly Salary (USD)</Label>
              <Input
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
            <div className="form-row">
              <div className="form-group">
                <Label>Do you have special needs?</Label>
                <div className="radio-group">
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                      formData.has_special_needs === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                    )}
                    onClick={() => handleChange("has_special_needs", true)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_special_needs === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                        {formData.has_special_needs === true && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">Yes</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                      formData.has_special_needs === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                    )}
                    onClick={() => handleChange("has_special_needs", false)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_special_needs === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                        {formData.has_special_needs === false && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">No</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <Label>Do you have medical conditions?</Label>
                <div className="radio-group">
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                      formData.has_medical_conditions === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                    )}
                    onClick={() => handleChange("has_medical_conditions", true)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_medical_conditions === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                        {formData.has_medical_conditions === true && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">Yes</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                      formData.has_medical_conditions === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                    )}
                    onClick={() => handleChange("has_medical_conditions", false)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_medical_conditions === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                        {formData.has_medical_conditions === false && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">No</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <Label>Do you have an invitation?</Label>
                <div className="radio-group">
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                      formData.has_invitation === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                    )}
                    onClick={() => handleChange("has_invitation", true)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_invitation === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                        {formData.has_invitation === true && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">Yes</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                      formData.has_invitation === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                    )}
                    onClick={() => handleChange("has_invitation", false)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_invitation === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                        {formData.has_invitation === false && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">No</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <Label>Do you have a sponsor in destination?</Label>
                <div className="radio-group">
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                      formData.sponsor_in_destination === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                    )}
                    onClick={() => handleChange("sponsor_in_destination", true)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.sponsor_in_destination === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                        {formData.sponsor_in_destination === true && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">Yes</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                      formData.sponsor_in_destination === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                    )}
                    onClick={() => handleChange("sponsor_in_destination", false)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.sponsor_in_destination === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                        {formData.sponsor_in_destination === false && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">No</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <Label>International Achievements</Label>
                <Textarea
                  value={formData.international_achievements || ""}
                  onChange={(e) => handleChange("international_achievements", e.target.value)}
                  placeholder="Research, patents, awards, etc."
                  rows="2"
                />
              </div>
              <div className="form-group">
                <Label>Awards</Label>
                <Textarea
                  value={formData.awards || ""}
                  onChange={(e) => handleChange("awards", e.target.value)}
                  placeholder="List your awards..."
                  rows="2"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <Label>Publications Count</Label>
                <Input
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
                <Label>Patents Count</Label>
                <Input
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
            <div className="form-row">
              <div className="form-group">
                <Label>Media Features</Label>
                <Textarea
                  value={formData.media_features || ""}
                  onChange={(e) => handleChange("media_features", e.target.value)}
                  placeholder="Media mentions, features..."
                  rows="2"
                />
              </div>
              <div className="form-group">
                <Label>Professional Memberships</Label>
                <Textarea
                  value={formData.professional_memberships || ""}
                  onChange={(e) => handleChange("professional_memberships", e.target.value)}
                  placeholder="Professional organizations..."
                  rows="2"
                />
              </div>
            </div>
            <div className="form-group">
              <Label>Recommendation Letters Count</Label>
              <Input
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
            <div className="form-group">
              <Label>Passport Expiry Date</Label>
              <Input
                type="date"
                value={formData.passport_expiry || ""}
                onChange={(e) => handleChange("passport_expiry", e.target.value)}
              />
            </div>
            <div className="form-group">
              <Label>Do you have a birth certificate?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_birth_certificate === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_birth_certificate", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_birth_certificate === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_birth_certificate === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_birth_certificate === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_birth_certificate", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_birth_certificate === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_birth_certificate === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <Label>Do you have financial statements?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_financial_statements === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_financial_statements", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_financial_statements === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_financial_statements === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_financial_statements === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_financial_statements", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_financial_statements === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_financial_statements === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <Label>Do you have police clearance?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_police_clearance === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_police_clearance", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_police_clearance === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_police_clearance === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_police_clearance === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_police_clearance", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_police_clearance === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_police_clearance === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <Label>Do you have medical exam results?</Label>
              <div className="radio-group">
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_medical_exam === true ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_medical_exam", true)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_medical_exam === true ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_medical_exam === true && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">Yes</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    formData.has_medical_exam === false ? "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#ff6b4a]" : "border-white/[0.08] bg-white/5 hover:border-[#ff6b4a]/30 text-white/60"
                  )}
                  onClick={() => handleChange("has_medical_exam", false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.has_medical_exam === false ? "border-[#ff6b4a] bg-[#ff6b4a]" : "border-white/20")}>
                      {formData.has_medical_exam === false && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <Label>Risk Tolerance</Label>
              <Select
                value={formData.risk_tolerance || ""}
                onValueChange={(value) => handleChange("risk_tolerance", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Do you prefer DIY or guided assistance?</Label>
              <Select
                value={formData.prefers_diy_or_guided || ""}
                onValueChange={(value) => handleChange("prefers_diy_or_guided", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diy">DIY (Do It Yourself)</SelectItem>
                  <SelectItem value="guided">Guided Assistance</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
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

  const getStepTheme = (step) => {
    const themes = {
      1: { gradient: 'theme-personal' },
      2: { gradient: 'theme-destination' },
      3: { gradient: 'theme-education' },
      4: { gradient: 'theme-work' },
      5: { gradient: 'theme-skills' },
      6: { gradient: 'theme-history' },
      7: { gradient: 'theme-financial' },
      8: { gradient: 'theme-special' },
      9: { gradient: 'theme-documents' },
    };
    return themes[step] || themes[1];
  };

  const currentTheme = getStepTheme(currentStep);

  const questionsAnswered = useMemo(() => {
    const answeredFields = Object.values(formData).filter(
      (value) => value !== null && value !== "" && value !== undefined
    );
    return Math.min(answeredFields.length, 9);
  }, [formData]);

  const scorePercent = useMemo(() => {
    const completedSteps = currentStep - 1;
    return Math.round((completedSteps / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  if (loading) return null;

  return (
    <div className={`onboarding-page modern-onboarding ${currentTheme.gradient}`}>
      {(submitting || generatingRecommendations) && (
        <div className="onboarding-loading-overlay">
          {/* Animated Background Elements */}
          <div className="loading-background-orbs">
            <motion.div
              className="loading-orb loading-orb-1"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="loading-orb loading-orb-2"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
            <motion.div
              className="loading-orb loading-orb-3"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.25, 0.45, 0.25],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </div>

          {/* Main Loading Card */}
          <motion.div
            className="onboarding-loading-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Icon Section */}
            <div className="loading-icon-container">
              {generatingRecommendations ? (
                <motion.div
                  className="loading-sparkles-wrapper"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  <Sparkles className="loading-main-icon" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="loading-main-icon" />
                </motion.div>
              )}
              
              {/* Pulsing ring effect */}
              <motion.div
                className="loading-pulse-ring"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            </div>

            {/* Title and Description */}
            <div className="loading-text-content">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {generatingRecommendations ? "Generating Your Recommendations" : "Working on it…"}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {submitMessage || (generatingRecommendations 
                  ? "Our AI is analyzing your profile and creating personalized visa recommendations..." 
                  : "Please wait")}
              </motion.p>
            </div>

            {/* Progress Steps */}
            {generatingRecommendations && (
              <div className="loading-progress-steps">
                <motion.div
                  className="loading-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    className="loading-step-icon"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <FileText className="w-5 h-5" />
                  </motion.div>
                  <span>Analyzing your profile</span>
                </motion.div>
                
                <motion.div
                  className="loading-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    className="loading-step-icon"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  >
                    <Globe className="w-5 h-5" />
                  </motion.div>
                  <span>Exploring visa options</span>
                </motion.div>
                
                <motion.div
                  className="loading-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.div
                    className="loading-step-icon"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                  >
                    <Zap className="w-5 h-5" />
                  </motion.div>
                  <span>Personalizing results</span>
                </motion.div>
              </div>
            )}

            {/* Animated Progress Bar */}
            {generatingRecommendations && (
              <div className="loading-progress-bar-container">
                <motion.div
                  className="loading-progress-bar"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Floating Particles */}
          <div className="loading-particles">
            {[...Array(6)].map((_, i) => {
              const randomX = Math.random() * 100;
              const randomY = Math.random() * 100;
              const randomDelay = Math.random() * 2;
              const randomDuration = 3 + Math.random() * 2;
              
              return (
                <motion.div
                  key={i}
                  className="loading-particle"
                  initial={{
                    x: `${randomX}%`,
                    y: `${randomY}%`,
                    opacity: 0,
                  }}
                  animate={{
                    y: `${(randomY + Math.random() * 30) % 100}%`,
                    opacity: [0, 0.6, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: randomDuration,
                    repeat: Infinity,
                    delay: randomDelay,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
      
      <NavigationHeader />
      
      <div className="onboarding-container modern-onboarding-container">
        <ProgressSidebar 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          stepNames={stepNames} 
          userEmail={user?.email || 'user@example.com'} 
        />
        
        <div className="onboarding-main-content-area">
          <div className="onboarding-content-wrapper modern-content-wrapper">
            <div className="step-background-visuals">
              <div className="bg-gradient-orb bg-orb-1"></div>
              <div className="bg-gradient-orb bg-orb-2"></div>
              <div className="bg-gradient-orb bg-orb-3"></div>
              <div className="bg-grid-pattern"></div>
              <div className="bg-shape-1"></div>
              <div className="bg-shape-2"></div>
            </div>

            <div className="modern-step-header">
              <h1 className="modern-step-title">{stepNames[currentStep - 1]}</h1>
              <p className="modern-step-description">
                {currentStep === 1 && "Let's start by getting to know you better"}
                {currentStep === 2 && "Tell us about your destination goals"}
                {currentStep === 3 && "Share your educational background"}
                {currentStep === 4 && "Help us understand your work experience"}
                {currentStep === 5 && "What skills and languages do you have?"}
                {currentStep === 6 && "Any previous immigration history?"}
                {currentStep === 7 && "Financial information for visa planning"}
                {currentStep === 8 && "Special achievements and support needs"}
                {currentStep === 9 && "Final details and document preferences"}
              </p>
            </div>

            <div className="modern-content-area" ref={stepRef}>
              <div className="content-card">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="content-fade-wrapper"
                  >
                  {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="modern-actions">
              {currentStep > 1 && (
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  disabled={submitting}
                  className="rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              <div className="flex-1" />
                  {currentStep < totalSteps ? (
                <Button
                      onClick={handleNext}
                      disabled={submitting}
                  className="rounded-xl"
                    >
                      Next Step
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#ff8066] hover:opacity-90"
                >
                  {submitting ? "Processing..." : "Complete Onboarding"}
                  {!submitting && <Check className="w-4 h-4 ml-2" />}
                </Button>
                  )}
            </div>

            <div className="bottom-progress-indicator">
              <div className="bottom-progress-steps">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i + 1}
                    className={`bottom-progress-step ${
                      i + 1 < currentStep ? 'completed' : ''
                    } ${i + 1 === currentStep ? 'active' : ''}`}
                  >
                    {i + 1 < currentStep ? <Check className="w-3 h-3 text-white" /> : i + 1}
                  </div>
                ))}
              </div>
              <div className="bottom-progress-text text-sm font-medium mt-2">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
          </div>
          
          <GoalSidebar 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            questionsAnswered={questionsAnswered} 
            scorePercent={scorePercent} 
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
