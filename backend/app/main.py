import json
import logging
import hashlib
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import Integer
from sqlalchemy import cast as sql_cast

from app.config import Settings, get_settings
from app.database import engine, get_db
from app.models import (
    Base, User, UserProfile, Recommendation, Document, ChecklistProgress, ChecklistCache,
    TravelAgentProfile, Conversation, Message, UserRole
)
from app.migrations import ensure_role_column, ensure_profile_picture_column
from app.schemas import (
    IntakeCreate,
    IntakeData,
    IntakeRecord,
    RecommendationOption,
    RecommendationRequest,
    RecommendationResponse,
    RecommendationRecord,
    UserCreate,
    UserResponse,
    UserUpdate,
    Token,
    OAuthRequest,
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileResponse,
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    ChecklistRequest,
    ChecklistResponse,
    ChecklistFetchRequest,
    ChecklistCachedResponse,
    ChecklistProgressCreate,
    ChecklistProgressUpdate,
    ChecklistProgressResponse,
    TravelAgentOnboardingData,
    TravelAgentProfileCreate,
    TravelAgentProfileUpdate,
    TravelAgentProfileResponse,
    TravelAgentListItem,
    AgentListFilters,
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    ChatRequest,
    ChatResponse,
    ChatMessage,
)

# Setup logging for recommendations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("recommendations")
from app.storage import IntakeStore
from app.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_user_by_email,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.oauth import verify_google_token


# Create database tables
Base.metadata.create_all(bind=engine)
ensure_role_column(engine)
ensure_profile_picture_column(engine)

# Single in-memory store so intakes persist across requests during runtime
store = IntakeStore()


def get_store() -> IntakeStore:
    return store


def get_openai_client(settings: Settings) -> OpenAI:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API key not configured.",
        )
    return OpenAI(api_key=settings.openai_api_key, timeout=60)


from fastapi.encoders import jsonable_encoder

# Custom JSON encoder for datetime
def custom_jsonable_encoder(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return jsonable_encoder(obj)

app = FastAPI(title="Visa Recommendation API", json_encoders={datetime: lambda v: v.isoformat()})

# Allow local frontends during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)



@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with optional role selection"""
    # Check if user already exists
    db_user = get_user_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role
    role = UserRole.USER
    if user_data.role:
        try:
            role = UserRole(user_data.role.upper())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be 'USER' or 'TRAVEL_AGENT'"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@app.post("/auth/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user


@app.put("/auth/me", response_model=UserResponse)
def update_current_user_info(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        existing_user = get_user_by_email(db, email=user_update.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_update.email
    
    if user_update.name:
        current_user.name = user_update.name
    
    # Update profile picture URL if provided
    if user_update.profile_picture_url is not None:
        current_user.profile_picture_url = user_update.profile_picture_url
    
    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/auth/google", response_model=Token)
async def login_with_google(
    oauth_data: OAuthRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """
    Login or sign up with Google OAuth.
    Verifies the Google ID token and creates/updates user account.
    """
    try:
        # Verify Google ID token
        user_info = await verify_google_token(oauth_data.id_token, settings)
        email = user_info['email']
        name = user_info['name']
        
        # Check if user exists
        user = get_user_by_email(db, email=email)
        
        if not user:
            # Create new user without password (OAuth users don't need passwords)
            # Use a special marker for OAuth users
            # Default to USER role for OAuth (can be changed later)
            db_user = User(
                email=email,
                name=name,
                hashed_password="oauth_google",  # Marker to indicate OAuth user
                role=UserRole.USER
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            user = db_user
        else:
            # Update name if it changed
            if user.name != name:
                user.name = name
                db.commit()
                db.refresh(user)
        
        # Generate JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )


# User Profile endpoints
@app.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user profile with onboarding data"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        # Create empty profile if it doesn't exist
        profile = UserProfile(user_id=current_user.id, onboarding_data=None)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@app.post("/profile", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def create_user_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create or update user profile with onboarding data"""
    # Check if profile already exists
    existing_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if existing_profile:
        # Update existing profile
        if profile_data.onboarding_data:
            # Keep existing data and merge with new data, preserving all fields including nulls
            existing_data = existing_profile.onboarding_data or {}
            new_data = profile_data.onboarding_data.model_dump(exclude_none=False)
            # Merge: new_data overwrites existing_data, but we keep all fields
            merged_data = {**existing_data, **new_data}
            existing_profile.onboarding_data = merged_data
        existing_profile.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_profile)
        return existing_profile
    else:
        # Create new profile
        onboarding_dict = None
        if profile_data.onboarding_data:
            # Store all fields including nulls so users can fill them in later
            onboarding_dict = profile_data.onboarding_data.model_dump(exclude_none=False)
        
        new_profile = UserProfile(
            user_id=current_user.id,
            onboarding_data=onboarding_dict
        )
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return new_profile


@app.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile onboarding data"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        # Create profile if it doesn't exist
        onboarding_dict = None
        if profile_data.onboarding_data:
            # Store all fields including nulls so users can fill them in later
            onboarding_dict = profile_data.onboarding_data.model_dump(exclude_none=False)
        
        profile = UserProfile(
            user_id=current_user.id,
            onboarding_data=onboarding_dict
        )
        db.add(profile)
    else:
        # Update existing profile
        if profile_data.onboarding_data:
            # Merge with existing data, preserving all fields including nulls
            existing_data = profile.onboarding_data or {}
            new_data = profile_data.onboarding_data.model_dump(exclude_none=False)
            # Merge: new_data overwrites existing_data, preserving all fields
            merged_data = {**existing_data, **new_data}
            profile.onboarding_data = merged_data
        profile.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(profile)
    return profile


@app.post("/intakes", response_model=IntakeRecord, status_code=status.HTTP_201_CREATED)
def create_intake(
    payload: IntakeCreate,
    store: IntakeStore = Depends(get_store),
) -> IntakeRecord:
    # user_id is optional, all other fields live inside intake
    return store.create(payload=payload.intake, user_id=payload.user_id)


@app.get("/intakes/{intake_id}", response_model=IntakeRecord)
def get_intake(
    intake_id: str,
    store: IntakeStore = Depends(get_store),
) -> IntakeRecord:
    record = store.get(intake_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    return record


def build_prompt(intake: IntakeData) -> str:
    payload = intake.model_dump(exclude_none=True)
    return (
        "You are JAPA Visa Strategist, an expert immigration recommender system.\n\n"
        "Your task:\n"
        "Given structured or unstructured user data, analyze eligibility and recommend the top "
        "immigration or visa pathways.\n\n"
        "CRITICAL LANGUAGE RULES:\n"
        "- Always use 'you' and 'your' instead of 'the applicant', 'applicant', 'applicant's', etc.\n"
        "- Write as if speaking directly to the user (second person)\n"
        "- Example: 'You have a solid background' NOT 'The applicant has a solid background'\n\n"
        "Rules:\n"
        "1. You MUST return ONLY valid JSON matching the schema below.\n"
        "2. All fields are required and must never be omitted.\n"
        "3. If information is unknown or uncertain, respond with null, \"\", or \"unknown\" instead of "
        "hallucinating.\n"
        "4. Scores must be integers between 0 and 100.\n"
        "5. Status must be one of: \"eligible\", \"possible\", \"unlikely\", \"not_eligible\".\n"
        "6. Recommendations must be no more than 3 total, ordered from strongest match to weakest.\n"
        "7. The \"top_recommendation\" field must exactly repeat the strongest recommendation object.\n\n"
        "JSON Schema (fill every field):\n\n"
        "{\n"
        "  \"current_score\": 0-100,\n"
        "  \"boosted_score\": 0-100,\n"
        "  \"insight_summary\": \"Short paragraph analysis of your readiness.\",\n"
        "  \"recommendations\": [\n"
        "    {\n"
        "      \"visa_name\": \"string\",\n"
        "      \"visa_type_code\": \"string\",\n"
        "      \"country\": \"string\",\n"
        "      \"category\": \"immigration | work | study | investment | family\",\n"
        "      \"score\": 0-100,\n"
        "      \"boosted_score\": 0-100,\n"
        "      \"status\": \"eligible | possible | unlikely | not_eligible\",\n"
        "      \"estimated_cost\": \"string (e.g., '$1,500' or 'Varies')\",\n"
        "      \"processing_time\": \"string (REQUIRED - e.g., '2-4 weeks', '3-6 months', '1-2 years')\",\n"
        "      \"eligibility_summary\": \"1-2 sentences explaining match level.\",\n"
        "      \"improvement_actions\": [\"string\", \"...\"],\n"
        "      \"overview\": \"Contextual summary of the visa/program.\",\n"
        "      \"who_is_it_for\": [\"bullet\", \"...\"],\n"
        "      \"quick_facts\": [\"bullet\", \"...\"],\n"
        "      \"requirements\": [\"bullet\", \"...\"],\n"
        "      \"benefits\": [\"bullet\", \"...\"],\n"
        "      \"success_boost\": [\"bullet actions to increase eligibility\"],\n"
        "      \"match_summary\": \"Sentence explaining why you fit or don't fit.\",\n"
        "      \"timeline\": [\n"
        "        {\"stage\": \"string\", \"description\": \"string\", \"duration\": \"string\"}\n"
        "      ],\n"
        "      \"checklist\": [\n"
        "        {\n"
        "          \"title\": \"string\",\n"
        "          \"description\": \"string\",\n"
        "          \"documents\": [\"string\"],\n"
        "          \"owner\": \"applicant | JAPA\",\n"
        "          \"due_in\": \"string\",\n"
        "          \"guidance\": \"string\"\n"
        "        }\n"
        "      ],\n"
        "      \"tips\": [\"string\"],\n"
        "      \"resources\": [\"string\"],\n"
        "      \"call_to_actions\": [\n"
        "        {\"label\": \"string\", \"action_type\": \"string\", \"href\": \"string or null\"}\n"
        "      ]\n"
        "    }\n"
        "  ],\n"
        "  \"top_recommendation\": { ...same object as first recommendation... }\n"
        "}\n\n"
        "Return only JSON. Do not add explanations outside the JSON.\n\n"
        "IMPORTANT: In all text fields (insight_summary, eligibility_summary, match_summary, reasoning, overview, description), "
        "always use 'you' and 'your' instead of 'the applicant', 'applicant', 'applicant's', etc. "
        "Write as if speaking directly to the user.\n\n"
        f"User intake JSON: {json.dumps(payload, ensure_ascii=False)}"
    )


def parse_recommendation(raw: str) -> Optional[RecommendationResponse]:
    try:
        data: Dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON from ChatGPT response")
        return None

    logger.info(f"Parsing ChatGPT response with keys: {list(data.keys())}")
    
    # Try to find recommendations in various possible locations
    recommendations_list = (
        data.get("recommendations") or 
        data.get("options") or 
        data.get("visa_options") or
        []
    )
    
    if not recommendations_list and "top_recommendation" in data:
        # If only top_recommendation exists, use it as a single-item list
        recommendations_list = [data["top_recommendation"]]
    
    recs = []
    for opt in recommendations_list:
        if not isinstance(opt, dict):
            continue
        
        # Extract visa type from various possible field names
        visa_type = (
            opt.get("visa_type") or
            opt.get("visa_name") or 
            opt.get("visa_type_code") or 
            opt.get("name") or
            opt.get("title") or
            "Visa option"
        )
        
        # Extract reasoning/description
        reasoning = (
            opt.get("reasoning") or
            opt.get("match_summary") or
            opt.get("eligibility_summary") or
            opt.get("overview") or
            opt.get("description") or
            opt.get("summary") or
            "See details"
        )
        # Replace "the applicant" / "applicant" with "you" / "your" for better user experience
        if reasoning:
            reasoning = reasoning.replace("the applicant", "you")
            reasoning = reasoning.replace("The applicant", "You")
            reasoning = reasoning.replace("applicant's", "your")
            reasoning = reasoning.replace("Applicant's", "Your")
            reasoning = reasoning.replace("applicant", "you")
        
        # Extract likelihood/status
        likelihood = (
            opt.get("likelihood") or
            opt.get("status") or
            opt.get("eligibility") or
            "possible"
        )
        
        # Extract timeline - prioritize processing_time from AI response
        estimated_timeline = (
            opt.get("processing_time") or
            opt.get("estimated_timeline") or
            opt.get("timeline") if isinstance(opt.get("timeline"), str) else None
        )
        
        # Extract costs
        estimated_costs = (
            opt.get("estimated_costs") or
            opt.get("estimated_cost") or
            opt.get("cost") or
            opt.get("fees")
        )
        
        # Extract requirements / documents (separate from risk flags)
        requirements = (
            opt.get("requirements") or
            opt.get("documents") or
            []
        )
        if isinstance(requirements, str):
            requirements = [requirements]

        # Extract checklist (structured tasks)
        checklist = opt.get("checklist") or []
        if isinstance(checklist, dict):
            checklist = [checklist]
        if not isinstance(checklist, list):
            checklist = []

        # Extract risk flags / key points
        risk_flags = (
            opt.get("risk_flags") or
            opt.get("quick_facts") or
            opt.get("challenges") or
            []
        )
        if isinstance(risk_flags, str):
            risk_flags = [risk_flags]
        
        # Extract next steps
        next_steps = (
            opt.get("next_steps") or
            opt.get("success_boost") or
            opt.get("improvement_actions") or
            opt.get("action_items") or
            []
        )
        if isinstance(next_steps, str):
            next_steps = [next_steps]
        
        recs.append(
            RecommendationOption(
                visa_type=visa_type,
                reasoning=reasoning,
                likelihood=likelihood,
                estimated_timeline=estimated_timeline,
                estimated_costs=estimated_costs,
                risk_flags=risk_flags if risk_flags else None,
                next_steps=next_steps if next_steps else None,
                checklist=checklist if checklist else None,
                requirements=requirements if requirements else None,
            )
        )
    
    logger.info(f"Parsed {len(recs)} recommendation options")
    
    # Extract summary
    summary = (
        data.get("summary") or
        data.get("insight_summary") or
        data.get("overview") or
        data.get("introduction") or
        "Based on your profile, here are your visa recommendations."
    )

    return RecommendationResponse(
        summary=summary,
        options=recs,
        notes=data.get("notes"),
        raw_message=raw,
    )


@app.post("/recommendations", response_model=RecommendationResponse)
def get_recommendation(
    request: RecommendationRequest,
    settings: Settings = Depends(get_settings),
    store: IntakeStore = Depends(get_store),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> RecommendationResponse:
    """
    Get visa recommendations.
    
    - use_cached=True (default): Return the most recent stored recommendation for this user
    - use_cached=False: Call ChatGPT, store the response, then return it
    """
    user_id = current_user.id
    
    # If use_cached is True, try to return stored recommendation
    if request.use_cached:
        cached = db.query(Recommendation).filter(
            Recommendation.user_id == user_id
        ).order_by(Recommendation.created_at.desc()).first()
        
        if cached and cached.raw_response:
            logger.info(f"Returning cached recommendation", extra={
                "user_id": user_id,
                "recommendation_id": cached.id,
                "used_cache": True,
            })
            # Re-parse the raw response with the improved parser
            # This ensures old cached data is parsed correctly too
            parsed = parse_recommendation(cached.raw_response)
            if parsed and parsed.options:
                parsed.source = "cache"
                return parsed
            
            # Fallback to stored output_data if parsing fails
            if cached.output_data:
                return RecommendationResponse(
                    summary=cached.output_data.get("summary", "Cached recommendation"),
                    options=[RecommendationOption(**opt) for opt in cached.output_data.get("options", [])],
                    notes=cached.output_data.get("notes"),
                    source="cache",
                    raw_message=cached.raw_response,
                )
        
        # No cached data exists, inform the user
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No cached recommendation found. Call with use_cached=False to generate one.",
        )
    
    # use_cached is False - call OpenAI and store the result
    intake: Optional[IntakeData] = None
    
    # Try to get intake from request
    if request.intake_id:
        record = store.get(request.intake_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Intake not found."
            )
        intake = record.payload
    elif request.intake:
        intake = request.intake
    else:
        # Try to get from user profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if profile and profile.onboarding_data:
            intake = IntakeData(**profile.onboarding_data)
    
    if not intake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No intake data provided. Provide intake, intake_id, or complete onboarding first.",
        )
    
    # Log the request
    logger.info(f"Calling OpenAI for recommendation", extra={
        "user_id": user_id,
        "used_cache": False,
        "input_summary": {
            "nationality": intake.nationality,
            "destinations": intake.preferred_destinations,
            "education": intake.education_level,
        },
    })
    
    prompt = build_prompt(intake)
    
    # Get OpenAI client
    client = get_openai_client(settings)
    
    try:
        completion = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a concise visa recommendation engine."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            timeout=60,
        )
        content = completion.choices[0].message.content or ""
    except Exception as exc:
        logger.error(f"OpenAI request failed: {exc}", extra={"user_id": user_id})
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed: {exc}",
        ) from exc
    
    # Log the raw ChatGPT response
    logger.info("=" * 60)
    logger.info("RAW CHATGPT RESPONSE:")
    logger.info("=" * 60)
    logger.info(content)
    logger.info("=" * 60)
    
    # Parse the response
    parsed = parse_recommendation(content)
    if not parsed:
        logger.warning("Failed to parse ChatGPT response as JSON")
        parsed = RecommendationResponse(
            summary="Unable to parse structured response. Showing raw model output.",
            options=[],
            notes=["Model returned unstructured text; please retry."],
            raw_message=content,
        )
    else:
        parsed.raw_message = content
        # Log the parsed result
        logger.info("PARSED RECOMMENDATION:")
        logger.info(f"  Summary: {parsed.summary}")
        logger.info(f"  Options count: {len(parsed.options)}")
        for i, opt in enumerate(parsed.options):
            logger.info(f"  Option {i+1}: {opt.visa_type} - {opt.likelihood} - Timeline: {opt.estimated_timeline or 'MISSING'}")
    
    # Store the recommendation in the database
    recommendation_record = Recommendation(
        user_id=user_id,
        input_data=intake.model_dump(exclude_none=True),
        output_data={
            "summary": parsed.summary,
            "options": [opt.model_dump() for opt in parsed.options],
            "notes": parsed.notes,
        },
        raw_response=content,
    )
    db.add(recommendation_record)
    db.commit()
    db.refresh(recommendation_record)
    
    logger.info(f"Stored new recommendation", extra={
        "user_id": user_id,
        "recommendation_id": recommendation_record.id,
        "used_cache": False,
    })
    
    parsed.source = "openai"
    return parsed


@app.get(
    "/recommendations/history",
    response_model=List[RecommendationRecord],
    # History is used for UI lists; exclude large blobs to keep payload fast.
    response_model_exclude={"__all__": {"raw_response", "input_data"}},
)
def get_recommendation_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = 10,
) -> List[RecommendationRecord]:
    """
    Get all stored recommendations for the current user, ordered by most recent first.
    """
    recommendations = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.id
    ).order_by(Recommendation.created_at.desc()).limit(limit).all()
    
    logger.info(f"Retrieved recommendation history", extra={
        "user_id": current_user.id,
        "count": len(recommendations),
    })
    
    # Debug: Log the first recommendation's created_at
    if recommendations:
        logger.info(f"First recommendation created_at: {recommendations[0].created_at}, type: {type(recommendations[0].created_at)}")
    
    return recommendations


@app.get("/recommendations/{recommendation_id}", response_model=RecommendationRecord)
def get_recommendation_by_id(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> RecommendationRecord:
    """
    Get a specific stored recommendation by ID.
    """
    recommendation = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id,
        Recommendation.user_id == current_user.id,
    ).first()
    
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found.",
        )
    
    logger.info(f"Retrieved recommendation by ID", extra={
        "user_id": current_user.id,
        "recommendation_id": recommendation_id,
    })
    
    return recommendation


def compute_option_hash(visa_option: RecommendationOption) -> str:
    """Stable hash of a visa option for cache invalidation."""
    if not visa_option:
        return ""
    try:
        payload = visa_option.model_dump(exclude_none=True)
    except Exception:
        payload = {}
    # Ignore generated checklist when hashing to avoid unnecessary regenerations
    payload.pop("checklist", None)
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def generate_checklist_via_openai(
    visa_option: RecommendationOption,
    settings: Settings,
    current_user: User,
) -> List[dict]:
    """
    Call OpenAI to generate a detailed checklist for a visa option.
    """
    prompt = f"""You are an expert immigration advisor. Generate a comprehensive, step-by-step application checklist for the following visa recommendation.

Visa Type: {visa_option.visa_type}
Reasoning: {visa_option.reasoning}
Likelihood: {visa_option.likelihood or "possible"}
Estimated Timeline: {visa_option.estimated_timeline or "varies"}
Estimated Costs: {visa_option.estimated_costs or "varies"}

Requirements: {', '.join(visa_option.requirements) if visa_option.requirements else "Standard requirements apply"}
Next Steps: {', '.join(visa_option.next_steps) if visa_option.next_steps else "Standard application process"}

Create a detailed, actionable step-by-step checklist with 8-12 steps that guides you through the entire visa application process. Each step should be specific, actionable, and include:
- Clear title
- Detailed description of what needs to be done
- Specific guidance/tips
- Documents needed for that step
- Who is responsible (applicant or JAPA)
- Timeline/due date information
- Estimated duration (in days) - realistic estimate for completing this specific step

IMPORTANT: For the estimated_duration field, provide a realistic number of days it typically takes to complete this step. Consider factors like:
- Document gathering: 3-7 days for simple docs, 2-4 weeks for complex ones
- Form completion: 1-3 days for simple forms, 1-2 weeks for complex applications
- Application submission: 1-2 days
- Waiting periods: Use actual processing times from the visa type
- Interviews/preparation: 1-2 weeks preparation time

Return ONLY valid JSON matching this exact schema:
{{
  "checklist": [
    {{
      "title": "Step title (e.g., 'Gather Required Documents')",
      "description": "Detailed description of what needs to be done in this step",
      "guidance": "Specific tips, warnings, or guidance for completing this step",
      "documents": ["Document 1", "Document 2"],
      "owner": "applicant",
      "due_in": "Timeline information (e.g., 'Before application submission')",
      "estimated_duration": 7
    }}
  ]
}}

Make sure the checklist is comprehensive, covers the entire application process from start to finish, and is specific to {visa_option.visa_type}. Include steps for:
1. Initial preparation and eligibility review
2. Document gathering and preparation
3. Form completion
4. Application submission
5. Follow-up actions
6. Interview preparation (if applicable)
7. Post-approval steps

Return only JSON, no explanations."""

    client = get_openai_client(settings)

    try:
        completion = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are an expert immigration advisor. Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            timeout=60,
        )
        content = completion.choices[0].message.content or ""
    except Exception as exc:
        logger.error(f"OpenAI checklist generation failed: {exc}", extra={"user_id": current_user.id})
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate checklist: {exc}",
        ) from exc

    try:
        data = json.loads(content)
        checklist = data.get("checklist", [])
        
        if not checklist:
            raise ValueError("No checklist items returned")
        
        logger.info(f"Generated checklist with {len(checklist)} steps", extra={
            "user_id": current_user.id,
            "visa_type": visa_option.visa_type,
            "steps_count": len(checklist),
        })
        
        return checklist
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse checklist JSON: {e}", extra={"user_id": current_user.id})
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to parse checklist response. Please try again.",
        )
    except Exception as e:
        logger.error(f"Checklist generation error: {e}", extra={"user_id": current_user.id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing checklist: {str(e)}",
        )


@app.post("/checklist", response_model=ChecklistCachedResponse)
def get_or_generate_checklist(
    payload: ChecklistFetchRequest,
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ChecklistCachedResponse:
    """
    Return a cached checklist for a visa type. If checklist exists in DB, return it.
    Only generate new checklist if it doesn't exist. After generation, automatically save progress.
    """
    visa_type = payload.visa_type
    visa_option = payload.visa_option

    if not visa_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="visa_type is required",
        )

    # Check if checklist already exists in DB - if so, return it immediately
    existing_cache = (
        db.query(ChecklistCache)
        .filter(
            ChecklistCache.user_id == current_user.id,
            ChecklistCache.visa_type == visa_type,
        )
        .first()
    )

    if existing_cache:
        logger.info(
            "Checklist found in DB, returning cached version",
            extra={
                "user_id": current_user.id,
                "visa_type": visa_type,
                "source": existing_cache.source,
            },
        )
        return ChecklistCachedResponse(
            checklist=existing_cache.checklist_json,
            source=existing_cache.source or "cache",
            option_hash=existing_cache.option_hash,
            cached_at=existing_cache.updated_at or existing_cache.created_at,
        )

    # Checklist doesn't exist - need to generate it
    # Resolve visa_option if not provided by looking up the latest recommendation
    if visa_option is None:
        latest_rec = (
            db.query(Recommendation)
            .filter(Recommendation.user_id == current_user.id)
            .order_by(Recommendation.created_at.desc())
            .first()
        )
        options = []
        if latest_rec and latest_rec.output_data:
            options = latest_rec.output_data.get("options", [])
        if options:
            match = next(
                (
                    opt
                    for opt in options
                    if str(opt.get("visa_type", "")).lower() == str(visa_type).lower()
                ),
                None,
            )
            if match:
                try:
                    visa_option = RecommendationOption(**match)
                except Exception:
                    visa_option = None

    if visa_option is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visa option not found; provide visa_option or generate recommendations first.",
        )

    option_hash = compute_option_hash(visa_option)

    # Generate new checklist
    try:
        checklist = generate_checklist_via_openai(
            visa_option=visa_option,
            settings=settings,
            current_user=current_user,
        )
    except HTTPException as exc:
        logger.error(
            "Checklist generation failed",
            extra={
                "user_id": current_user.id,
                "visa_type": visa_type,
                "error": exc.detail,
            },
        )
        raise

    # Save checklist to cache
    new_cache = ChecklistCache(
        user_id=current_user.id,
        visa_type=visa_type,
        option_hash=option_hash,
        checklist_json=checklist,
        source="ai",
    )
    db.add(new_cache)
    db.commit()
    db.refresh(new_cache)

    # Prepare response data BEFORE progress saving (so we can return even if progress fails)
    response_data = ChecklistCachedResponse(
        checklist=new_cache.checklist_json,
        source="ai",
        option_hash=new_cache.option_hash,
        cached_at=new_cache.updated_at or new_cache.created_at,
    )

    # After generating checklist, automatically save progress with all items set to incomplete
    # Use a separate try/except to ensure checklist response is returned even if progress fails
    try:
        progress_json = {}
        if isinstance(checklist, list):
            for idx, item in enumerate(checklist):
                # Use item.id if available, otherwise generate step ID
                item_id = item.get("id") if isinstance(item, dict) else f"step-{idx + 1}"
                progress_json[item_id] = False

        # Check if progress already exists
        existing_progress = db.query(ChecklistProgress).filter(
            ChecklistProgress.user_id == current_user.id,
            ChecklistProgress.visa_type == visa_type
        ).first()

        now = datetime.utcnow()
        if existing_progress:
            # Update existing progress
            existing_progress.progress_json = progress_json
            existing_progress.updated_at = now
        else:
            # Create new progress record
            new_progress = ChecklistProgress(
                user_id=current_user.id,
                visa_type=visa_type,
                progress_json=progress_json,
                created_at=now,
                updated_at=now
            )
            db.add(new_progress)

        db.commit()
        logger.info(
            "Progress initialized successfully",
            extra={
                "user_id": current_user.id,
                "visa_type": visa_type,
                "items_count": len(progress_json),
            },
        )
    except Exception as progress_error:
        # Log error but don't fail the request - progress can be saved later
        # Don't rollback - checklist is already committed and we want to return it
        logger.warning(
            f"Failed to initialize progress (non-fatal): {progress_error}",
            extra={
                "user_id": current_user.id,
                "visa_type": visa_type,
                "error": str(progress_error),
            },
        )
        # Don't rollback - checklist is already committed

    logger.info(
        "Checklist generated and cached",
        extra={
            "user_id": current_user.id,
            "visa_type": visa_type,
            "source": "ai",
            "checklist_items": len(checklist),
        },
    )

    # Return response - this ensures checklist is returned even if progress saving failed
    return response_data


@app.post("/recommendations/checklist", response_model=ChecklistResponse)
def generate_checklist(
    request: ChecklistRequest,
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_active_user),
) -> ChecklistResponse:
    """
    Generate a detailed step-by-step checklist for a visa recommendation using ChatGPT.
    """
    visa_option = request.visa_option
    checklist = generate_checklist_via_openai(
        visa_option=visa_option,
        settings=settings,
        current_user=current_user,
    )
    return ChecklistResponse(checklist=checklist)

# Checklist Progress endpoints
@app.get("/checklist/progress", response_model=Optional[ChecklistProgressResponse])
def get_checklist_progress(
    visa_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get saved checklist progress for a specific visa type.
    Returns None if no progress has been saved yet.
    """
    progress = db.query(ChecklistProgress).filter(
        ChecklistProgress.user_id == current_user.id,
        ChecklistProgress.visa_type == visa_type
    ).first()
    
    if not progress:
        return None
    
    return progress


@app.get("/checklist/progress/all", response_model=List[ChecklistProgressResponse])
def get_all_checklist_progress(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all checklist progress records for the current user.
    Returns a list of all checklists that have been started.
    """
    progress_list = db.query(ChecklistProgress).filter(
        ChecklistProgress.user_id == current_user.id
    ).order_by(ChecklistProgress.updated_at.desc()).all()
    
    return progress_list


@app.put("/checklist/progress", response_model=ChecklistProgressResponse)
def save_checklist_progress(
    progress_data: ChecklistProgressCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Save or update checklist progress for a visa type.
    Creates a new record if none exists, or updates existing one.
    """
    # Check if progress already exists
    existing = db.query(ChecklistProgress).filter(
        ChecklistProgress.user_id == current_user.id,
        ChecklistProgress.visa_type == progress_data.visa_type
    ).first()
    
    now = datetime.utcnow()
    
    if existing:
        # Update existing progress
        existing.progress_json = progress_data.progress_json
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new progress record
        new_progress = ChecklistProgress(
            user_id=current_user.id,
            visa_type=progress_data.visa_type,
            progress_json=progress_data.progress_json,
            created_at=now,
            updated_at=now
        )
        db.add(new_progress)
        db.commit()
        db.refresh(new_progress)
        return new_progress


# Document endpoints
@app.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    document_data: DocumentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new document record"""
    now = datetime.utcnow()
    new_document = Document(
        user_id=current_user.id,
        name=document_data.name,
        type=document_data.type,
        file_url=document_data.file_url,
        file_path=document_data.file_path,
        size=document_data.size,
        status="pending",  # Always start as pending
        visa_id=document_data.visa_id,
        description=document_data.description,
        uploaded_at=now,
        updated_at=now
    )
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    return new_document


@app.get("/documents", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = None
):
    """Get all documents for the current user"""
    query = db.query(Document).filter(Document.user_id == current_user.id)
    
    if status_filter and status_filter != "all":
        query = query.filter(Document.status == status_filter)
    
    documents = query.order_by(Document.uploaded_at.desc()).all()
    return documents


@app.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific document by ID"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return document


@app.put("/documents/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a document (users can update their own documents, but not status)"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Users can update name, type, description, visa_id but not status
    if document_update.name is not None:
        document.name = document_update.name
    if document_update.type is not None:
        document.type = document_update.type
    if document_update.description is not None:
        document.description = document_update.description
    if document_update.visa_id is not None:
        document.visa_id = document_update.visa_id
    
    # Status updates would typically be done by admin/reviewer, not included here
    # but we'll allow it for now if provided (can be restricted later)
    if document_update.status is not None:
        document.status = document_update.status
    
    document.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(document)
    return document


# ============================================================================
# TRAVEL AGENT ENDPOINTS
# ============================================================================

@app.get("/travel-agents/onboarding-schema")
def get_travel_agent_onboarding_schema():
    """Get JSON schema for travel agent onboarding form generation"""
    import json
    import os
    schema_path = os.path.join(os.path.dirname(__file__), "..", "travel_agent_onboarding_schema.json")
    try:
        with open(schema_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding schema file not found"
        )


@app.get("/travel-agents/profile", response_model=TravelAgentProfileResponse)
def get_travel_agent_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get travel agent profile for current user"""
    if current_user.role != UserRole.TRAVEL_AGENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travel agents can access this endpoint"
        )
    
    profile = db.query(TravelAgentProfile).filter(
        TravelAgentProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        # Create empty profile if it doesn't exist
        profile = TravelAgentProfile(user_id=current_user.id, onboarding_data=None)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return profile


@app.post("/travel-agents/profile", response_model=TravelAgentProfileResponse, status_code=status.HTTP_201_CREATED)
def create_travel_agent_profile(
    profile_data: TravelAgentProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create or update travel agent profile"""
    if current_user.role != UserRole.TRAVEL_AGENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travel agents can access this endpoint"
        )
    
    existing_profile = db.query(TravelAgentProfile).filter(
        TravelAgentProfile.user_id == current_user.id
    ).first()
    
    if existing_profile:
        # Update existing profile
        if profile_data.onboarding_data:
            existing_data = existing_profile.onboarding_data or {}
            new_data = profile_data.onboarding_data.model_dump(exclude_none=False)
            merged_data = {**existing_data, **new_data}
            existing_profile.onboarding_data = merged_data
        existing_profile.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_profile)
        return existing_profile
    else:
        # Create new profile
        onboarding_dict = None
        if profile_data.onboarding_data:
            onboarding_dict = profile_data.onboarding_data.model_dump(exclude_none=False)
        
        new_profile = TravelAgentProfile(
            user_id=current_user.id,
            onboarding_data=onboarding_dict
        )
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return new_profile


@app.put("/travel-agents/profile", response_model=TravelAgentProfileResponse)
def update_travel_agent_profile(
    profile_data: TravelAgentProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update travel agent profile"""
    if current_user.role != UserRole.TRAVEL_AGENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travel agents can access this endpoint"
        )
    
    profile = db.query(TravelAgentProfile).filter(
        TravelAgentProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        onboarding_dict = None
        if profile_data.onboarding_data:
            onboarding_dict = profile_data.onboarding_data.model_dump(exclude_none=False)
        
        profile = TravelAgentProfile(
            user_id=current_user.id,
            onboarding_data=onboarding_dict
        )
        db.add(profile)
    else:
        if profile_data.onboarding_data:
            existing_data = profile.onboarding_data or {}
            new_data = profile_data.onboarding_data.model_dump(exclude_none=False)
            merged_data = {**existing_data, **new_data}
            profile.onboarding_data = merged_data
        profile.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(profile)
    return profile


@app.get("/travel-agents/list", response_model=List[TravelAgentListItem])
def list_travel_agents(
    country: Optional[str] = None,
    destination_expertise: Optional[str] = None,
    availability: Optional[str] = None,
    experience_level: Optional[str] = None,
    specialization: Optional[str] = None,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """List travel agents with optional filtering"""
    query = db.query(TravelAgentProfile, User).join(
        User, TravelAgentProfile.user_id == User.id
    ).filter(
        User.role == UserRole.TRAVEL_AGENT,
        User.is_active == True
    )
    
    # Apply filters
    if country:
        query = query.filter(
            TravelAgentProfile.onboarding_data["country_of_operation"].astext == country
        )
    
    if availability:
        query = query.filter(
            TravelAgentProfile.onboarding_data["availability_status"].astext == availability
        )
    
    if destination_expertise:
        # Check if destination is in supported_destination_countries array
        query = query.filter(
            TravelAgentProfile.onboarding_data["supported_destination_countries"].astext.contains(
                destination_expertise
            )
        )
    
    if specialization:
        query = query.filter(
            TravelAgentProfile.onboarding_data["specializations"].astext.contains(
                specialization
            )
        )
    
    # Experience level filter
    if experience_level:
        if experience_level == "junior":
            query = query.filter(
                sql_cast(TravelAgentProfile.onboarding_data["years_of_experience"].astext, Integer) < 5
            )
        elif experience_level == "mid":
            query = query.filter(
                sql_cast(TravelAgentProfile.onboarding_data["years_of_experience"].astext, Integer).between(5, 10)
            )
        elif experience_level == "senior":
            query = query.filter(
                sql_cast(TravelAgentProfile.onboarding_data["years_of_experience"].astext, Integer) > 10
            )
    
    # Only show verified agents (or agents with completed onboarding)
    query = query.filter(
        TravelAgentProfile.onboarding_data.isnot(None)
    )
    
    results = query.offset(skip).limit(limit).all()
    
    agents = []
    for profile, user in results:
        onboarding = profile.onboarding_data or {}
        business_name = onboarding.get("business_name")
        full_name = onboarding.get("full_name") or user.name
        # Primary name is business_name if available, otherwise full_name
        primary_name = business_name or full_name
        
        agents.append(TravelAgentListItem(
            id=profile.id,
            user_id=user.id,
            name=primary_name,
            owner_name=full_name if business_name else None,  # Only show if business_name exists
            business_name=business_name,
            email=user.email,
            profile_photo_url=onboarding.get("profile_photo_url"),
            country_of_operation=onboarding.get("country_of_operation"),
            cities_covered=onboarding.get("cities_covered", []),
            years_of_experience=onboarding.get("years_of_experience"),
            specializations=onboarding.get("specializations", []),
            supported_destination_countries=onboarding.get("supported_destination_countries", []),
            languages_spoken=onboarding.get("languages_spoken", []),
            availability_status=onboarding.get("availability_status", "unavailable"),
            is_verified=profile.is_verified,
            bio=onboarding.get("bio")
        ))
    
    return agents


@app.get("/travel-agents/{agent_id}", response_model=TravelAgentListItem)
def get_travel_agent(
    agent_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific travel agent's public profile"""
    profile = db.query(TravelAgentProfile).filter(
        TravelAgentProfile.user_id == agent_id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Travel agent not found"
        )
    
    user = db.query(User).filter(User.id == agent_id).first()
    if not user or user.role != UserRole.TRAVEL_AGENT or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Travel agent not found"
        )
    
    onboarding = profile.onboarding_data or {}
    business_name = onboarding.get("business_name")
    full_name = onboarding.get("full_name") or user.name
    # Primary name is business_name if available, otherwise full_name
    primary_name = business_name or full_name
    
    return TravelAgentListItem(
        id=profile.id,
        user_id=user.id,
        name=primary_name,
        owner_name=full_name if business_name else None,  # Only show if business_name exists
        business_name=business_name,
        email=user.email,
        profile_photo_url=onboarding.get("profile_photo_url"),
        country_of_operation=onboarding.get("country_of_operation"),
        cities_covered=onboarding.get("cities_covered", []),
        years_of_experience=onboarding.get("years_of_experience"),
        specializations=onboarding.get("specializations", []),
        supported_destination_countries=onboarding.get("supported_destination_countries", []),
        languages_spoken=onboarding.get("languages_spoken", []),
        availability_status=onboarding.get("availability_status", "unavailable"),
        is_verified=profile.is_verified,
        bio=onboarding.get("bio")
    )


# ============================================================================
# MESSAGING ENDPOINTS
# ============================================================================

@app.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation between user and agent"""
    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only regular users can initiate conversations"
        )
    
    # Verify agent exists and is a travel agent
    agent = db.query(User).filter(
        User.id == conversation_data.agent_id,
        User.role == UserRole.TRAVEL_AGENT,
        User.is_active == True
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Travel agent not found"
        )
    
    # Get agent profile for business name
    agent_profile = db.query(TravelAgentProfile).filter(
        TravelAgentProfile.user_id == agent.id
    ).first()
    agent_onboarding = agent_profile.onboarding_data if agent_profile else {}
    agent_business_name = agent_onboarding.get("business_name")
    agent_full_name = agent_onboarding.get("full_name") or agent.name
    agent_primary_name = agent_business_name or agent_full_name
    
    # Check if conversation already exists
    existing_conv = db.query(Conversation).filter(
        Conversation.user_id == current_user.id,
        Conversation.agent_id == conversation_data.agent_id
    ).first()
    
    if existing_conv:
        # Return existing conversation
        last_message = db.query(Message).filter(
            Message.conversation_id == existing_conv.id
        ).order_by(Message.created_at.desc()).first()
        
        unread_count = db.query(Message).filter(
            Message.conversation_id == existing_conv.id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).count()
        
        return ConversationResponse(
            id=existing_conv.id,
            user_id=existing_conv.user_id,
            agent_id=existing_conv.agent_id,
            last_message_at=existing_conv.last_message_at,
            created_at=existing_conv.created_at,
            updated_at=existing_conv.updated_at,
            user_name=current_user.name,
            agent_name=agent_primary_name,
            agent_owner_name=agent_full_name if agent_business_name else None,
            agent_business_name=agent_business_name,
            last_message_preview=last_message.content[:100] if last_message else None,
            unread_count=unread_count
        )
    
    # Create new conversation
    conversation = Conversation(
        user_id=current_user.id,
        agent_id=conversation_data.agent_id
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    # Create initial message if provided
    if conversation_data.initial_message:
        message = Message(
            conversation_id=conversation.id,
            sender_id=current_user.id,
            content=conversation_data.initial_message,
            is_read=False
        )
        db.add(message)
        conversation.last_message_at = datetime.utcnow()
        db.commit()
    
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        agent_id=conversation.agent_id,
        last_message_at=conversation.last_message_at,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        user_name=current_user.name,
        agent_name=agent_primary_name,
        agent_owner_name=agent_full_name if agent_business_name else None,
        agent_business_name=agent_business_name,
        last_message_preview=conversation_data.initial_message[:100] if conversation_data.initial_message else None,
        unread_count=0
    )


@app.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for current user"""
    if current_user.role == UserRole.USER:
        conversations = db.query(Conversation).filter(
            Conversation.user_id == current_user.id
        ).order_by(Conversation.last_message_at.desc()).all()
    elif current_user.role == UserRole.TRAVEL_AGENT:
        conversations = db.query(Conversation).filter(
            Conversation.agent_id == current_user.id
        ).order_by(Conversation.last_message_at.desc()).all()
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid user role"
        )
    
    result = []
    for conv in conversations:
        # Get other party
        if current_user.role == UserRole.USER:
            other_party = db.query(User).filter(User.id == conv.agent_id).first()
            # Get agent profile for business name
            agent_profile = db.query(TravelAgentProfile).filter(
                TravelAgentProfile.user_id == conv.agent_id
            ).first()
            agent_onboarding = agent_profile.onboarding_data if agent_profile else {}
            agent_business_name = agent_onboarding.get("business_name")
            agent_full_name = agent_onboarding.get("full_name") or (other_party.name if other_party else None)
            agent_primary_name = agent_business_name or agent_full_name
        else:
            other_party = db.query(User).filter(User.id == conv.user_id).first()
            agent_business_name = None
            agent_full_name = None
            agent_primary_name = None
        
        # Get last message
        last_message = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(Message.created_at.desc()).first()
        
        # Get unread count
        unread_count = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).count()
        
        result.append(ConversationResponse(
            id=conv.id,
            user_id=conv.user_id,
            agent_id=conv.agent_id,
            last_message_at=conv.last_message_at,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            user_name=db.query(User).filter(User.id == conv.user_id).first().name if current_user.role == UserRole.TRAVEL_AGENT else None,
            agent_name=agent_primary_name if current_user.role == UserRole.USER else None,
            agent_owner_name=agent_full_name if (current_user.role == UserRole.USER and agent_business_name) else None,
            agent_business_name=agent_business_name if current_user.role == UserRole.USER else None,
            last_message_preview=last_message.content[:100] if last_message else None,
            unread_count=unread_count
        ))
    
    return result


@app.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific conversation"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Verify user has access
    if current_user.role == UserRole.USER and conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    elif current_user.role == UserRole.TRAVEL_AGENT and conversation.agent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    user = db.query(User).filter(User.id == conversation.user_id).first()
    agent = db.query(User).filter(User.id == conversation.agent_id).first()
    
    # Get agent profile for business name (if user is viewing as USER)
    agent_business_name = None
    agent_full_name = None
    agent_primary_name = None
    if current_user.role == UserRole.USER and agent:
        agent_profile = db.query(TravelAgentProfile).filter(
            TravelAgentProfile.user_id == agent.id
        ).first()
        agent_onboarding = agent_profile.onboarding_data if agent_profile else {}
        agent_business_name = agent_onboarding.get("business_name")
        agent_full_name = agent_onboarding.get("full_name") or (agent.name if agent else None)
        agent_primary_name = agent_business_name or agent_full_name
    
    last_message = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.desc()).first()
    
    unread_count = db.query(Message).filter(
        Message.conversation_id == conversation.id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).count()
    
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        agent_id=conversation.agent_id,
        last_message_at=conversation.last_message_at,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        user_name=user.name if user else None,
        agent_name=agent_primary_name if current_user.role == UserRole.USER else None,
        agent_owner_name=agent_full_name if (current_user.role == UserRole.USER and agent_business_name) else None,
        agent_business_name=agent_business_name if current_user.role == UserRole.USER else None,
        last_message_preview=last_message.content[:100] if last_message else None,
        unread_count=unread_count
    )


@app.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a message in a conversation"""
    # Verify conversation exists and user has access
    conversation = db.query(Conversation).filter(
        Conversation.id == message_data.conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Verify user is part of conversation
    if current_user.role == UserRole.USER and conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    elif current_user.role == UserRole.TRAVEL_AGENT and conversation.agent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Create message
    message = Message(
        conversation_id=message_data.conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
        is_read=False
    )
    db.add(message)
    
    # Update conversation timestamp
    conversation.last_message_at = datetime.utcnow()
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        content=message.content,
        is_read=message.is_read,
        created_at=message.created_at,
        sender_name=current_user.name
    )


@app.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get messages in a conversation"""
    # Verify conversation exists and user has access
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Verify user is part of conversation
    if current_user.role == UserRole.USER and conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    elif current_user.role == UserRole.TRAVEL_AGENT and conversation.agent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get messages
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.desc()).offset(skip).limit(limit).all()
    
    # Mark messages as read if viewing as recipient
    for msg in messages:
        if msg.sender_id != current_user.id and not msg.is_read:
            msg.is_read = True
    db.commit()
    
    # Reverse to show oldest first
    messages.reverse()
    
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append(MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender_name=sender.name if sender else None
        ))
    
    return result


@app.get("/users/{user_id}/profile-summary")
def get_user_profile_summary(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user profile summary for travel agents (limited info only)"""
    if current_user.role != UserRole.TRAVEL_AGENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travel agents can access this endpoint"
        )
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    onboarding = profile.onboarding_data if profile else {}
    
    # Return only safe, necessary information
    return {
        "user_id": user.id,
        "name": user.name,
        "country_of_origin": onboarding.get("nationality") or onboarding.get("citizenship_country"),
        "desired_destination_country": onboarding.get("preferred_destinations"),
        "migration_purpose": onboarding.get("preferred_destinations"),  # Can be inferred from other fields
        "timeline": onboarding.get("target_timeline") or onboarding.get("migration_timeline"),
        "budget_range": {
            "max_budget_usd": onboarding.get("max_budget_usd"),
            "budget_amount": onboarding.get("budget_amount"),
            "budget_currency": onboarding.get("budget_currency")
        },
        "has_recommendations": db.query(Recommendation).filter(
            Recommendation.user_id == user_id
        ).count() > 0
    }


@app.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a document"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    db.delete(document)
    db.commit()
    return None


# ============================================================================
# AI CHATBOT ENDPOINT
# ============================================================================

JAPA_KNOWLEDGE_BASE = """
You are JAPA Assistant, a friendly and knowledgeable AI chatbot for JAPA - an AI-powered migration assistance platform.

## About JAPA
JAPA is an innovative AI-powered migration assistant that helps users navigate their immigration journey with clarity and confidence. The name "JAPA" comes from Nigerian slang meaning "to leave" or "to relocate", reflecting our mission to help people successfully migrate to new countries.

## Core Features

### 1. AI Migration Pathway Matching (Available)
- Personalized visa and immigration routes based on user's background
- Analyzes 50+ eligibility factors including nationality, education, work experience, and financial situation
- Provides side-by-side comparison of different visa options
- Shows clear eligibility signals and next steps
- Covers 195+ countries and 500+ visa programs

### 2. Smart Document Management (Available)
- Country-specific document checklists with deadline tracking
- Upload, organize, and manage visa-related documents in one place
- Reminders and missing-document tracking
- Secure encrypted storage for all documents
- Documents categorized by type with expiration date tracking

### 3. Task & Timeline Tracking (Available)
- Milestone-based task lists for visa applications
- Deadline reminders and progress tracking
- A single timeline showing the entire migration journey
- Checklist items with estimated durations

### 4. Expert & Lawyer Connections (Available)
- Connect with verified travel agents who specialize in migration
- Filter agents by country, destination expertise, experience level, and specialization
- In-app messaging with travel agents
- Case summaries that can be shared with professionals

### 5. AI Application & Interview Coaching (Coming Soon)
- SOP (Statement of Purpose) and form guidance with examples
- Interview question practice
- Feedback on clarity and completeness of applications

## How JAPA Works (Four Steps)
1. **Build Your Profile**: Complete an intelligent questionnaire with your background, skills, and migration goals
2. **Get Matched**: AI cross-references your profile against global visa programs to find best options
3. **Plan Your Journey**: Receive a personalized roadmap with checklists, timelines, and guidance
4. **Move Forward**: Execute your plan with tools and resources at every step

## Target Users
- Students looking for study abroad pathways
- Professionals seeking work visa routes
- Entrepreneurs interested in business immigration
- Families exploring family sponsorship options
- Talented individuals with exceptional abilities
- Digital nomads looking for remote work visas

## Important Disclaimers
- JAPA provides guidance and recommendations, NOT legal advice
- We do NOT guarantee visa approvals or eligibility
- Immigration policies change frequently - always verify with official sources
- For legal matters, complex cases, or when legal judgment is required, we recommend consulting with a qualified immigration lawyer
- Your data stays secure and private

## Pricing
- JAPA offers a FREE tier that includes basic recommendations and document management
- No credit card required to get started
- Premium features may be available for advanced guidance

## Contact
- Support: support@japa.com
- Response time: 24-48 hours for support inquiries

## Communication Guidelines
- Be friendly, helpful, and encouraging
- Provide accurate information about JAPA's features
- Always remind users that JAPA doesn't provide legal advice when discussing immigration matters
- Guide users on how to use the platform effectively
- If asked about specific immigration rules or visa requirements, provide general guidance but recommend checking official sources
- Be conversational and approachable
- Use "you" and "your" to address users directly
"""


@app.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    request: ChatRequest,
    settings: Settings = Depends(get_settings),
):
    """
    Public chatbot endpoint - accessible by anyone (no authentication required).
    Answers questions about JAPA and provides migration guidance.
    """
    # Build conversation history for OpenAI
    messages = [
        {"role": "system", "content": JAPA_KNOWLEDGE_BASE},
    ]
    
    # Add conversation history if provided
    if request.conversation_history:
        for msg in request.conversation_history:
            messages.append({"role": msg.role, "content": msg.content})
    
    # Add current user message
    messages.append({"role": "user", "content": request.message})
    
    # Get OpenAI client
    client = get_openai_client(settings)
    
    try:
        completion = client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
            timeout=30,
        )
        response_content = completion.choices[0].message.content or "I apologize, but I couldn't generate a response. Please try again."
    except Exception as exc:
        logger.error(f"OpenAI chat request failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Chat service temporarily unavailable. Please try again.",
        ) from exc
    
    # Build updated conversation history
    updated_history = request.conversation_history or []
    updated_history.append(ChatMessage(role="user", content=request.message))
    updated_history.append(ChatMessage(role="assistant", content=response_content))
    
    return ChatResponse(
        response=response_content,
        conversation_history=updated_history
    )
