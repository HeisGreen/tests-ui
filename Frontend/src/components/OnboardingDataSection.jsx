import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { countries } from '../data/countries'
import { transformToBackendFormat, transformToFormFormat } from '../utils/dataTransform'
import { FiSave, FiEdit2 } from 'react-icons/fi'
import './OnboardingDataSection.css'

function OnboardingDataSection() {
  const { user, onboardingData, updateOnboardingData } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  
  // Sort countries alphabetically by name
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const [formData, setFormData] = useState({
    // Personal & Contact Details
    nationality: '',
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
    preferred_destinations: '',
    migration_timeline: null,
    commitment_level: null,
    target_timeline: '',
    target_move_date: null,
    deadline_hard: null,
    deadline_reason: null,
    willing_to_consider_alternatives: null,
    alternative_countries: null,

    // Education
    education_level: '',
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
  })

  // Load onboarding data when component mounts or when onboardingData changes
  useEffect(() => {
    if (onboardingData) {
      const formDataFromBackend = transformToFormFormat(onboardingData)
      // Merge backend data with existing formData to preserve all fields
      // This ensures fields that were null in backend still appear in the form
      setFormData(prev => {
        const merged = { ...prev }
        // Update with backend data where it exists
        Object.keys(formDataFromBackend).forEach(key => {
          if (formDataFromBackend[key] !== undefined) {
            merged[key] = formDataFromBackend[key]
          }
        })
        return merged
      })
    }
  }, [onboardingData])

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? null : value
    }))
    setSaved(false)
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    
    try {
      // Transform form data to backend format
      const dataToSave = transformToBackendFormat(formData)
      
      // Save to backend
      await updateOnboardingData(dataToSave)
      
      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save onboarding data')
      console.error('Error saving onboarding data:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reload original data
    if (onboardingData) {
      const formDataFromBackend = transformToFormFormat(onboardingData)
      setFormData(formDataFromBackend)
    }
    setIsEditing(false)
    setError('')
  }

  // Check if there's any data to display
  const hasData = onboardingData && Object.keys(onboardingData).length > 0

  if (!hasData && !isEditing) {
    return (
      <div className="onboarding-data-section">
        <div className="section-header">
          <h2>Onboarding Information</h2>
          <p>Complete your onboarding to see your information here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-data-section">
      <div className="section-header">
        <h2>Onboarding Information</h2>
        <div className="section-actions">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-edit">
              <FiEdit2 />
              Edit Information
            </button>
          ) : (
            <div className="edit-actions">
              <button onClick={handleCancel} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-save" disabled={saving}>
                <FiSave />
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="onboarding-form-grid">
        {/* Personal & Contact Details */}
        <div className="form-section">
          <h3>Personal & Contact Details</h3>
          <div className="form-group">
            <label>Nationality</label>
            <select
              value={formData.nationality || ''}
              onChange={(e) => handleChange('nationality', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              {sortedCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Citizenship Country</label>
            <select
              value={formData.citizenship_country || ''}
              onChange={(e) => handleChange('citizenship_country', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              {sortedCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Current Residence Country</label>
            <select
              value={formData.current_residence_country || ''}
              onChange={(e) => handleChange('current_residence_country', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
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
              value={formData.applying_from_country || ''}
              onChange={(e) => handleChange('applying_from_country', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              {sortedCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              value={formData.age || ''}
              onChange={(e) => handleChange('age', e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="e.g., 28"
            />
          </div>
          <div className="form-group">
            <label>Marital Status</label>
            <select
              value={formData.marital_status || ''}
              onChange={(e) => handleChange('marital_status', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
          {formData.marital_status === 'married' && (
            <>
              <div className="form-group">
                <label>Spouse Nationality</label>
                <select
                  value={formData.spouse_nationality || ''}
                  onChange={(e) => handleChange('spouse_nationality', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="">Select...</option>
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
                  value={formData.spouse_profession || ''}
                  onChange={(e) => handleChange('spouse_profession', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., Engineer"
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label>Number of Dependents</label>
            <input
              type="number"
              value={formData.dependents || ''}
              onChange={(e) => handleChange('dependents', e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Contact Methods</label>
            <input
              type="text"
              value={formData.contact_methods || ''}
              onChange={(e) => handleChange('contact_methods', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., email, phone, whatsapp"
            />
          </div>
          <div className="form-group">
            <label>Wants Lawyer Consultation?</label>
            <select
              value={formData.wants_lawyer_consultation === null ? '' : formData.wants_lawyer_consultation ? 'true' : 'false'}
              onChange={(e) => handleChange('wants_lawyer_consultation', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        {/* Destination & Timeline */}
        <div className="form-section">
          <h3>Destination & Timeline</h3>
          <div className="form-group">
            <label>Preferred Destinations</label>
            <input
              type="text"
              value={formData.preferred_destinations || ''}
              onChange={(e) => handleChange('preferred_destinations', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., US, Canada"
            />
          </div>
          <div className="form-group">
            <label>Migration Timeline</label>
            <select
              value={formData.migration_timeline || ''}
              onChange={(e) => handleChange('migration_timeline', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="immediate">Immediate</option>
              <option value="3_months">3 Months</option>
              <option value="6_months">6 Months</option>
              <option value="1_year">1 Year</option>
              <option value="2_years">2+ Years</option>
            </select>
          </div>
          <div className="form-group">
            <label>Commitment Level</label>
            <select
              value={formData.commitment_level || ''}
              onChange={(e) => handleChange('commitment_level', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="form-group">
            <label>Target Timeline</label>
            <select
              value={formData.target_timeline || ''}
              onChange={(e) => handleChange('target_timeline', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="immediate">Immediate</option>
              <option value="3_months">3 Months</option>
              <option value="6_months">6 Months</option>
              <option value="1_year">1 Year</option>
              <option value="2_years">2+ Years</option>
            </select>
          </div>
          <div className="form-group">
            <label>Target Move Date</label>
            <input
              type="date"
              value={formData.target_move_date || ''}
              onChange={(e) => handleChange('target_move_date', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label>Hard Deadline?</label>
            <select
              value={formData.deadline_hard === null ? '' : formData.deadline_hard ? 'true' : 'false'}
              onChange={(e) => handleChange('deadline_hard', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          {formData.deadline_hard && (
            <div className="form-group">
              <label>Deadline Reason</label>
              <textarea
                value={formData.deadline_reason || ''}
                onChange={(e) => handleChange('deadline_reason', e.target.value)}
                disabled={!isEditing}
                placeholder="Explain your deadline..."
                rows="3"
              />
            </div>
          )}
          <div className="form-group">
            <label>Willing to Consider Alternatives?</label>
            <select
              value={formData.willing_to_consider_alternatives === null ? '' : formData.willing_to_consider_alternatives ? 'true' : 'false'}
              onChange={(e) => handleChange('willing_to_consider_alternatives', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          {formData.willing_to_consider_alternatives && (
            <div className="form-group">
              <label>Alternative Countries</label>
              <input
                type="text"
                value={formData.alternative_countries || ''}
                onChange={(e) => handleChange('alternative_countries', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g., GB, DE (comma-separated)"
              />
            </div>
          )}
        </div>

        {/* Education */}
        <div className="form-section">
          <h3>Education</h3>
          <div className="form-group">
            <label>Education Level</label>
            <select
              value={formData.education_level || ''}
              onChange={(e) => handleChange('education_level', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="high_school">High School</option>
              <option value="bachelors">Bachelor's Degree</option>
              <option value="masters">Master's Degree</option>
              <option value="phd">PhD</option>
            </select>
          </div>
          <div className="form-group">
            <label>Field of Study</label>
            <input
              type="text"
              value={formData.field_of_study || ''}
              onChange={(e) => handleChange('field_of_study', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Computer Science"
            />
          </div>
          <div className="form-group">
            <label>Degrees</label>
            <input
              type="text"
              value={formData.degrees || ''}
              onChange={(e) => handleChange('degrees', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., BSc Computer Science, MSc Data Science"
            />
          </div>
          <div className="form-group">
            <label>Has Academic Transcripts?</label>
            <select
              value={formData.has_academic_transcripts === null ? '' : formData.has_academic_transcripts ? 'true' : 'false'}
              onChange={(e) => handleChange('has_academic_transcripts', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Has Admission Offer?</label>
            <select
              value={formData.has_admission_offer === null ? '' : formData.has_admission_offer ? 'true' : 'false'}
              onChange={(e) => handleChange('has_admission_offer', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          {formData.has_admission_offer && (
            <div className="form-group">
              <label>Admission Details</label>
              <textarea
                value={formData.admission_details || ''}
                onChange={(e) => handleChange('admission_details', e.target.value)}
                disabled={!isEditing}
                placeholder="Details about your admission offer..."
                rows="3"
              />
            </div>
          )}
          <div className="form-group">
            <label>Professional Certifications</label>
            <input
              type="text"
              value={formData.professional_certifications || ''}
              onChange={(e) => handleChange('professional_certifications', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., AWS, PMP, CPA"
            />
          </div>
        </div>

        {/* Work Experience */}
        <div className="form-section">
          <h3>Work Experience</h3>
          <div className="form-group">
            <label>Current Job Title</label>
            <input
              type="text"
              value={formData.current_job_title || ''}
              onChange={(e) => handleChange('current_job_title', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Software Engineer"
            />
          </div>
          <div className="form-group">
            <label>Current Employer</label>
            <input
              type="text"
              value={formData.current_employer || ''}
              onChange={(e) => handleChange('current_employer', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Company Name"
            />
          </div>
          <div className="form-group">
            <label>Industry</label>
            <input
              type="text"
              value={formData.industry || ''}
              onChange={(e) => handleChange('industry', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Technology"
            />
          </div>
          <div className="form-group">
            <label>Total Experience Years</label>
            <input
              type="number"
              step="0.1"
              value={formData.total_experience_years || ''}
              onChange={(e) => handleChange('total_experience_years', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="e.g., 5"
            />
          </div>
          <div className="form-group">
            <label>Experience Years in Position</label>
            <input
              type="number"
              step="0.1"
              value={formData.experience_years_in_position || ''}
              onChange={(e) => handleChange('experience_years_in_position', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="e.g., 2"
            />
          </div>
          <div className="form-group">
            <label>Is Self Employed?</label>
            <select
              value={formData.is_self_employed === null ? '' : formData.is_self_employed ? 'true' : 'false'}
              onChange={(e) => handleChange('is_self_employed', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Business Management Experience?</label>
            <select
              value={formData.business_management_experience === null ? '' : formData.business_management_experience ? 'true' : 'false'}
              onChange={(e) => handleChange('business_management_experience', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Is Business Owner?</label>
            <select
              value={formData.is_business_owner === null ? '' : formData.is_business_owner ? 'true' : 'false'}
              onChange={(e) => handleChange('is_business_owner', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Employer Willing to Sponsor?</label>
            <select
              value={formData.employer_willing_to_sponsor === null ? '' : formData.employer_willing_to_sponsor ? 'true' : 'false'}
              onChange={(e) => handleChange('employer_willing_to_sponsor', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Has Job Offer International?</label>
            <select
              value={formData.has_job_offer_international === null ? '' : formData.has_job_offer_international ? 'true' : 'false'}
              onChange={(e) => handleChange('has_job_offer_international', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        {/* Skills & Language */}
        <div className="form-section">
          <h3>Skills & Language</h3>
          <div className="form-group">
            <label>Skills</label>
            <textarea
              value={formData.skills || ''}
              onChange={(e) => handleChange('skills', e.target.value)}
              disabled={!isEditing}
              placeholder="List your key skills (comma-separated)"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Languages Known</label>
            <input
              type="text"
              value={formData.languages_known || ''}
              onChange={(e) => handleChange('languages_known', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., English, French, Spanish"
            />
          </div>
          <div className="form-group">
            <label>Language Tests Taken</label>
            <input
              type="text"
              value={formData.language_tests_taken || ''}
              onChange={(e) => handleChange('language_tests_taken', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., IELTS, TOEFL"
            />
          </div>
          <div className="form-group">
            <label>Language Test Scores</label>
            <textarea
              value={formData.language_scores || ''}
              onChange={(e) => handleChange('language_scores', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., IELTS: 7.5, TOEFL: 100"
              rows="3"
            />
          </div>
        </div>

        {/* Immigration History */}
        <div className="form-section">
          <h3>Immigration History</h3>
          <div className="form-group">
            <label>Has Prior Visa Applications?</label>
            <select
              value={formData.has_prior_visa_applications === null ? '' : formData.has_prior_visa_applications ? 'true' : 'false'}
              onChange={(e) => handleChange('has_prior_visa_applications', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          {formData.has_prior_visa_applications && (
            <div className="form-group">
              <label>Prior Visas</label>
              <input
                type="text"
                value={formData.prior_visas || ''}
                onChange={(e) => handleChange('prior_visas', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g., US B1/B2, UK Visitor"
              />
            </div>
          )}
          <div className="form-group">
            <label>Has Active Visas?</label>
            <select
              value={formData.has_active_visas === null ? '' : formData.has_active_visas ? 'true' : 'false'}
              onChange={(e) => handleChange('has_active_visas', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          {formData.has_active_visas && (
            <>
              <div className="form-group">
                <label>Current Visa Status</label>
                <input
                  type="text"
                  value={formData.current_visa_status || ''}
                  onChange={(e) => handleChange('current_visa_status', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., Work Permit"
                />
              </div>
              <div className="form-group">
                <label>Current Visa Country</label>
                <select
                  value={formData.current_visa_country || ''}
                  onChange={(e) => handleChange('current_visa_country', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="">Select...</option>
                  {sortedCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Current Visa Expiry</label>
                <input
                  type="date"
                  value={formData.current_visa_expiry || ''}
                  onChange={(e) => handleChange('current_visa_expiry', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label>Has Overstays?</label>
            <select
              value={formData.has_overstays === null ? '' : formData.has_overstays ? 'true' : 'false'}
              onChange={(e) => handleChange('has_overstays', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          {formData.has_overstays && (
            <div className="form-group">
              <label>Overstay Details</label>
              <textarea
                value={formData.overstay_details || ''}
                onChange={(e) => handleChange('overstay_details', e.target.value)}
                disabled={!isEditing}
                placeholder="Details about overstay..."
                rows="3"
              />
            </div>
          )}
          <div className="form-group">
            <label>Criminal Records?</label>
            <select
              value={formData.criminal_records === null ? '' : formData.criminal_records ? 'true' : 'false'}
              onChange={(e) => handleChange('criminal_records', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Has Relatives in Destination?</label>
            <select
              value={formData.has_relatives_in_destination === null ? '' : formData.has_relatives_in_destination ? 'true' : 'false'}
              onChange={(e) => handleChange('has_relatives_in_destination', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        {/* Financial Info */}
        <div className="form-section">
          <h3>Financial Information</h3>
          <div className="form-group">
            <label>Max Budget (USD)</label>
            <input
              type="number"
              step="0.01"
              value={formData.max_budget_usd || ''}
              onChange={(e) => handleChange('max_budget_usd', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="e.g., 10000"
            />
          </div>
          <div className="form-group">
            <label>Budget Currency</label>
            <input
              type="text"
              value={formData.budget_currency || ''}
              onChange={(e) => handleChange('budget_currency', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., USD"
            />
          </div>
          <div className="form-group">
            <label>Budget Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.budget_amount || ''}
              onChange={(e) => handleChange('budget_amount', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="e.g., 5000"
            />
          </div>
          <div className="form-group">
            <label>Proof of Funds Source</label>
            <input
              type="text"
              value={formData.proof_of_funds_source || ''}
              onChange={(e) => handleChange('proof_of_funds_source', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Savings, Investments"
            />
          </div>
          <div className="form-group">
            <label>Liquid Assets (USD)</label>
            <input
              type="number"
              step="0.01"
              value={formData.liquid_assets_usd || ''}
              onChange={(e) => handleChange('liquid_assets_usd', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="e.g., 2000"
            />
          </div>
          <div className="form-group">
            <label>Has Property?</label>
            <select
              value={formData.has_property === null ? '' : formData.has_property ? 'true' : 'false'}
              onChange={(e) => handleChange('has_property', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Total Assets (USD)</label>
            <input
              type="number"
              step="0.01"
              value={formData.total_assets_usd || ''}
              onChange={(e) => handleChange('total_assets_usd', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="e.g., 10000"
            />
          </div>
          <div className="form-group">
            <label>Annual Income (USD)</label>
            <input
              type="number"
              step="0.01"
              value={formData.annual_income_usd || ''}
              onChange={(e) => handleChange('annual_income_usd', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="e.g., 50000"
            />
          </div>
          <div className="form-group">
            <label>Salary (USD)</label>
            <input
              type="number"
              step="0.01"
              value={formData.salary_usd || ''}
              onChange={(e) => handleChange('salary_usd', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="e.g., 4500"
            />
          </div>
        </div>

        {/* Special Items / Support */}
        <div className="form-section">
          <h3>Special Items & Support</h3>
          <div className="form-group">
            <label>Has Special Needs?</label>
            <select
              value={formData.has_special_needs === null ? '' : formData.has_special_needs ? 'true' : 'false'}
              onChange={(e) => handleChange('has_special_needs', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Has Medical Conditions?</label>
            <select
              value={formData.has_medical_conditions === null ? '' : formData.has_medical_conditions ? 'true' : 'false'}
              onChange={(e) => handleChange('has_medical_conditions', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Has Invitation?</label>
            <select
              value={formData.has_invitation === null ? '' : formData.has_invitation ? 'true' : 'false'}
              onChange={(e) => handleChange('has_invitation', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sponsor in Destination?</label>
            <select
              value={formData.sponsor_in_destination === null ? '' : formData.sponsor_in_destination ? 'true' : 'false'}
              onChange={(e) => handleChange('sponsor_in_destination', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>International Achievements</label>
            <input
              type="text"
              value={formData.international_achievements || ''}
              onChange={(e) => handleChange('international_achievements', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Awards, Recognitions"
            />
          </div>
          <div className="form-group">
            <label>Publications Count</label>
            <input
              type="number"
              value={formData.publications_count || ''}
              onChange={(e) => handleChange('publications_count', e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Patents Count</label>
            <input
              type="number"
              value={formData.patents_count || ''}
              onChange={(e) => handleChange('patents_count', e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Awards</label>
            <input
              type="text"
              value={formData.awards || ''}
              onChange={(e) => handleChange('awards', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Best Researcher 2023"
            />
          </div>
          <div className="form-group">
            <label>Media Features</label>
            <input
              type="text"
              value={formData.media_features || ''}
              onChange={(e) => handleChange('media_features', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Featured in Tech Magazine"
            />
          </div>
          <div className="form-group">
            <label>Professional Memberships</label>
            <input
              type="text"
              value={formData.professional_memberships || ''}
              onChange={(e) => handleChange('professional_memberships', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., IEEE, ACM"
            />
          </div>
          <div className="form-group">
            <label>Recommendation Letters Count</label>
            <input
              type="number"
              value={formData.recommendation_letters_count || ''}
              onChange={(e) => handleChange('recommendation_letters_count', e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="0"
            />
          </div>
        </div>

        {/* Documents */}
        <div className="form-section">
          <h3>Documents</h3>
          <div className="form-group">
            <label>Passport Expiry</label>
            <input
              type="date"
              value={formData.passport_expiry || ''}
              onChange={(e) => handleChange('passport_expiry', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label>Has Birth Certificate?</label>
            <select
              value={formData.has_birth_certificate === null ? '' : formData.has_birth_certificate ? 'true' : 'false'}
              onChange={(e) => handleChange('has_birth_certificate', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Has Financial Statements?</label>
            <select
              value={formData.has_financial_statements === null ? '' : formData.has_financial_statements ? 'true' : 'false'}
              onChange={(e) => handleChange('has_financial_statements', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Has Police Clearance?</label>
            <select
              value={formData.has_police_clearance === null ? '' : formData.has_police_clearance ? 'true' : 'false'}
              onChange={(e) => handleChange('has_police_clearance', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Has Medical Exam?</label>
            <select
              value={formData.has_medical_exam === null ? '' : formData.has_medical_exam ? 'true' : 'false'}
              onChange={(e) => handleChange('has_medical_exam', e.target.value === '' ? null : e.target.value === 'true')}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        {/* Meta */}
        <div className="form-section">
          <h3>Preferences</h3>
          <div className="form-group">
            <label>Risk Tolerance</label>
            <select
              value={formData.risk_tolerance || ''}
              onChange={(e) => handleChange('risk_tolerance', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Prefers DIY or Guided?</label>
            <select
              value={formData.prefers_diy_or_guided || ''}
              onChange={(e) => handleChange('prefers_diy_or_guided', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              <option value="diy">DIY (Do It Yourself)</option>
              <option value="guided">Guided Assistance</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingDataSection
