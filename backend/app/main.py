import json
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from app.config import Settings, get_settings
from app.schemas import (
    IntakeCreate,
    IntakeData,
    IntakeRecord,
    RecommendationOption,
    RecommendationRequest,
    RecommendationResponse,
)
from app.storage import IntakeStore


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


app = FastAPI(title="Visa Recommendation API")

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
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


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
        "Given structured or unstructured applicant data, analyze eligibility and recommend the top "
        "immigration or visa pathways.\n\n"
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
        "  \"insight_summary\": \"Short paragraph analysis of applicant readiness.\",\n"
        "  \"recommendations\": [\n"
        "    {\n"
        "      \"visa_name\": \"string\",\n"
        "      \"visa_type_code\": \"string\",\n"
        "      \"country\": \"string\",\n"
        "      \"category\": \"immigration | work | study | investment | family\",\n"
        "      \"score\": 0-100,\n"
        "      \"boosted_score\": 0-100,\n"
        "      \"status\": \"eligible | possible | unlikely | not_eligible\",\n"
        "      \"estimated_cost\": \"string\",\n"
        "      \"processing_time\": \"string\",\n"
        "      \"eligibility_summary\": \"1-2 sentences explaining match level.\",\n"
        "      \"improvement_actions\": [\"string\", \"...\"],\n"
        "      \"overview\": \"Contextual summary of the visa/program.\",\n"
        "      \"who_is_it_for\": [\"bullet\", \"...\"],\n"
        "      \"quick_facts\": [\"bullet\", \"...\"],\n"
        "      \"requirements\": [\"bullet\", \"...\"],\n"
        "      \"benefits\": [\"bullet\", \"...\"],\n"
        "      \"success_boost\": [\"bullet actions to increase eligibility\"],\n"
        "      \"match_summary\": \"Sentence explaining why applicant fits or doesn't.\",\n"
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
        f"Applicant intake JSON: {json.dumps(payload, ensure_ascii=False)}"
    )


def parse_recommendation(raw: str) -> Optional[RecommendationResponse]:
    try:
        data: Dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError:
        return None

    if "current_score" in data and "recommendations" in data:
        recs = []
        for opt in data.get("recommendations", []):
            if not isinstance(opt, dict):
                continue
            recs.append(
                RecommendationOption(
                    visa_type=opt.get("visa_name") or opt.get("visa_type_code") or "Visa option",
                    reasoning=opt.get("match_summary")
                    or opt.get("eligibility_summary")
                    or opt.get("overview")
                    or "See details",
                    likelihood=opt.get("status"),
                    estimated_timeline=opt.get("processing_time"),
                    estimated_costs=opt.get("estimated_cost"),
                    risk_flags=opt.get("quick_facts") or opt.get("requirements"),
                    next_steps=opt.get("success_boost") or opt.get("improvement_actions"),
                )
            )

        return RecommendationResponse(
            summary=data.get("insight_summary") or data.get("summary") or "Recommendation draft",
            options=recs,
            notes=data.get("notes"),
            raw_message=raw,
        )

    options = [
        RecommendationOption(**opt) for opt in data.get("options", []) if isinstance(opt, dict)
    ]
    return RecommendationResponse(
        summary=data.get("summary", "Recommendation draft"),
        options=options,
        notes=data.get("notes"),
        raw_message=raw,
    )


@app.post("/recommendations", response_model=RecommendationResponse)
def get_recommendation(
    request: RecommendationRequest,
    settings: Settings = Depends(get_settings),
    store: IntakeStore = Depends(get_store),
    client: OpenAI = Depends(lambda settings=Depends(get_settings): get_openai_client(settings)),
) -> RecommendationResponse:
    intake: Optional[IntakeData] = None
    if request.intake_id:
        record = store.get(request.intake_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Intake not found."
            )
        intake = record.payload
    else:
        intake = request.intake

    if not intake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No intake data provided.",
        )

    prompt = build_prompt(intake)

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
    except Exception as exc:  # pragma: no cover - network errors
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed: {exc}",
        ) from exc

    parsed = parse_recommendation(content)
    if parsed:
        parsed.raw_message = content
        return parsed

    return RecommendationResponse(
        summary="Unable to parse structured response. Showing raw model output.",
        options=[],
        notes=["Model returned unstructured text; please retry."],
        raw_message=content,
    )
