from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


class IntakeData(BaseModel):
    # Personal & Contact
    nationality: Optional[str] = None
    citizenship_country: Optional[str] = None
    current_residence_country: Optional[str] = None
    applying_from_country: Optional[str] = None

    age: Optional[int] = None
    marital_status: Optional[str] = None
    spouse_nationality: Optional[str] = None
    spouse_profession: Optional[str] = None
    dependents: Optional[int] = None

    contact_methods: Optional[List[str]] = None
    wants_lawyer_consultation: Optional[bool] = None

    # Destination & Timeline
    preferred_destinations: Optional[str] = None
    migration_timeline: Optional[str] = None
    commitment_level: Optional[str] = None
    target_timeline: Optional[str] = None
    target_move_date: Optional[str] = None
    deadline_hard: Optional[bool] = None
    deadline_reason: Optional[str] = None
    willing_to_consider_alternatives: Optional[bool] = None
    alternative_countries: Optional[List[str]] = None

    # Education
    education_level: Optional[str] = None
    field_of_study: Optional[str] = None
    degrees: Optional[List[str]] = None
    has_academic_transcripts: Optional[bool] = None
    has_admission_offer: Optional[bool] = None
    admission_details: Optional[str] = None
    professional_certifications: Optional[List[str]] = None

    # Work Experience
    current_job_title: Optional[str] = None
    current_employer: Optional[str] = None
    industry: Optional[str] = None
    total_experience_years: Optional[float] = None
    experience_years_in_position: Optional[float] = None
    is_self_employed: Optional[bool] = None
    business_management_experience: Optional[bool] = None
    is_business_owner: Optional[bool] = None
    employer_willing_to_sponsor: Optional[bool] = None
    has_job_offer_international: Optional[bool] = None

    # Skills & Language
    skills: Optional[List[str]] = None
    languages_known: Optional[List[str]] = None
    language_tests_taken: Optional[List[str]] = None
    language_scores: Optional[dict] = None

    # Immigration History
    has_prior_visa_applications: Optional[bool] = None
    prior_visas: Optional[List[str]] = None
    has_active_visas: Optional[bool] = None
    current_visa_status: Optional[str] = None
    current_visa_country: Optional[str] = None
    current_visa_expiry: Optional[str] = None
    has_overstays: Optional[bool] = None
    overstay_details: Optional[str] = None
    criminal_records: Optional[bool] = None
    has_relatives_in_destination: Optional[bool] = None

    # Financial Info
    max_budget_usd: Optional[float] = None
    budget_currency: Optional[str] = None
    budget_amount: Optional[float] = None
    proof_of_funds_source: Optional[str] = None
    liquid_assets_usd: Optional[float] = None
    has_property: Optional[bool] = None
    total_assets_usd: Optional[float] = None
    annual_income_usd: Optional[float] = None
    salary_usd: Optional[float] = None

    # Special Items / Support
    has_special_needs: Optional[bool] = None
    has_medical_conditions: Optional[bool] = None
    has_invitation: Optional[bool] = None
    sponsor_in_destination: Optional[bool] = None
    international_achievements: Optional[List[str]] = None
    publications_count: Optional[int] = None
    patents_count: Optional[int] = None
    awards: Optional[List[str]] = None
    media_features: Optional[List[str]] = None
    professional_memberships: Optional[List[str]] = None
    recommendation_letters_count: Optional[int] = None

    # Documents
    passport_expiry: Optional[str] = None
    has_birth_certificate: Optional[bool] = None
    has_financial_statements: Optional[bool] = None
    has_police_clearance: Optional[bool] = None
    has_medical_exam: Optional[bool] = None

    # Meta
    risk_tolerance: Optional[str] = None
    prefers_diy_or_guided: Optional[str] = None


class IntakeCreate(BaseModel):
    user_id: Optional[str] = Field(
        default=None, description="Optional user id when available from caller"
    )
    intake: IntakeData = Field(default_factory=IntakeData)

    @model_validator(mode="after")
    def validate_intake_present(self):
        if self.intake is None:
            raise ValueError("intake payload is required")
        return self


class IntakeRecord(BaseModel):
    id: str
    user_id: Optional[str]
    payload: IntakeData
    created_at: datetime
    updated_at: datetime

    model_config = {
        "json_encoders": {datetime: lambda v: v.isoformat() + "Z"},
    }


class RecommendationOption(BaseModel):
    visa_type: str
    reasoning: str
    likelihood: Optional[str] = None
    estimated_timeline: Optional[str] = None
    estimated_costs: Optional[str] = None
    risk_flags: Optional[List[str]] = None
    next_steps: Optional[List[str]] = None
    # Optional rich fields returned by the AI prompt schema (kept flexible)
    checklist: Optional[List[dict]] = None
    requirements: Optional[List[str]] = None


class RecommendationResponse(BaseModel):
    summary: str
    options: List[RecommendationOption]
    notes: Optional[List[str]] = None
    source: str = Field(default="openai")
    raw_message: Optional[str] = None


class RecommendationRequest(BaseModel):
    intake_id: Optional[str] = Field(default=None, description="Existing intake id to reuse")
    intake: Optional[IntakeData] = Field(default=None, description="Inline intake payload")
    use_cached: bool = Field(default=True, description="If true, return stored recommendation instead of calling ChatGPT")
    # Note: When use_cached=False and no intake_id/intake provided,
    # the backend will automatically fetch from the user's profile (onboarding_data)


class RecommendationRecord(BaseModel):
    """Schema for stored recommendation records"""
    id: int
    user_id: Optional[int] = None
    input_data: Optional[dict] = None
    output_data: Optional[dict] = None
    raw_response: Optional[str] = None
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


# Authentication schemas
class UserCreate(BaseModel):
    email: str
    name: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }
    
    def model_dump(self, **kwargs):
        """Override to ensure proper datetime serialization"""
        data = super().model_dump(**kwargs)
        # Convert datetime objects to ISO format strings
        for key, value in data.items():
            if isinstance(value, datetime):
                # Use isoformat() which handles timezone properly
                # Don't add "Z" - let JavaScript Date handle ISO strings with timezone offsets
                data[key] = value.isoformat()
        return data


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class OAuthRequest(BaseModel):
    id_token: str


# User Profile schemas
class UserProfileCreate(BaseModel):
    onboarding_data: Optional[IntakeData] = None


class UserProfileUpdate(BaseModel):
    onboarding_data: Optional[IntakeData] = None


class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    onboarding_data: Optional[IntakeData] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "json_encoders": {datetime: lambda v: v.isoformat() + "Z"},
    }


# Document schemas
class DocumentCreate(BaseModel):
    name: str
    type: Optional[str] = None
    file_url: str
    file_path: str
    size: Optional[str] = None
    visa_id: Optional[int] = None
    description: Optional[str] = None


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # Only for admin updates
    visa_id: Optional[int] = None


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    name: str
    type: Optional[str] = None
    file_url: str
    file_path: str
    size: Optional[str] = None
    status: str
    visa_id: Optional[int] = None
    description: Optional[str] = None
    uploaded_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
    }
    
    def model_dump(self, **kwargs):
        """Override to ensure proper datetime serialization"""
        data = super().model_dump(**kwargs)
        # Convert datetime objects to ISO format strings
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
        return data
    
    def model_dump_json(self, **kwargs):
        """Override JSON serialization to ensure proper datetime formatting"""
        import json
        data = self.model_dump(**kwargs)
        return json.dumps(data)


class ChecklistRequest(BaseModel):
    visa_option: RecommendationOption


class ChecklistResponse(BaseModel):
    checklist: List[dict]


class ChecklistFetchRequest(BaseModel):
    visa_type: str
    visa_option: Optional[RecommendationOption] = None


class ChecklistCachedResponse(BaseModel):
    checklist: List[dict]
    source: str = Field(default="cache")
    option_hash: Optional[str] = None
    cached_at: Optional[datetime] = None


# Checklist Progress schemas
class ChecklistProgressCreate(BaseModel):
    visa_type: str
    progress_json: dict  # { "step-1": true, "step-2": false, ... }


class ChecklistProgressUpdate(BaseModel):
    progress_json: dict  # { "step-1": true, "step-2": false, ... }


class ChecklistProgressResponse(BaseModel):
    id: int
    user_id: int
    visa_type: str
    progress_json: dict
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
    }
