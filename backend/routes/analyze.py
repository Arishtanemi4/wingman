import json
import os
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI

from gen.config import FRAGMENTS_DIR, LLM_BASE_URL, LLM_MODEL, LLM_API_KEY

router = APIRouter()
_client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)

# Fragment pools loaded once at startup
with open(os.path.join(FRAGMENTS_DIR, "hobbies.json"), encoding="utf-8") as _f:
    _HOBBIES: dict = json.load(_f)

with open(os.path.join(FRAGMENTS_DIR, "archetypes.json"), encoding="utf-8") as _f:
    _ARCHETYPES: dict = json.load(_f)


# ── Input Models ─────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    name: str
    age: int
    bio: str
    occupation: str | None = None
    hobbies: list[str]
    interests: list[str] = []
    # Future multi-modal: text descriptions from a locally-hosted vision model
    # Populate via POST /api/image/describe before calling /analyze
    image_descriptions: list[str] = []


class ImageInput(BaseModel):
    # Supply exactly one of the two fields
    image_base64: str | None = None  # base64-encoded JPEG/PNG
    image_url: str | None = None     # publicly accessible image URL


# ── Output Models ─────────────────────────────────────────────────────────────

class HobbyFeedback(BaseModel):
    hobby: str
    appeals_to: list[str]         # archetype names this hobby resonates with
    improvement_direction: str    # concrete angle to develop this hobby
    standout_tip: str             # the specific depth that becomes impressive


class ArchetypeGap(BaseModel):
    archetype: str
    reason: str      # why this archetype is underserved by the current profile
    quick_win: str   # one concrete addition or shift to bridge the gap


class AnalysisResult(BaseModel):
    summary: str
    hobby_feedback: list[HobbyFeedback]
    archetype_gaps: list[ArchetypeGap]
    top_recommendations: list[str]  # 3-5 prioritised actionable tips


class ImageDescription(BaseModel):
    description: str  # text description to pass into UserProfile.image_descriptions


# ── Helpers ───────────────────────────────────────────────────────────────────

def _archetype_context() -> str:
    lines = []
    for arch, data in _ARCHETYPES.items():
        hobbies = ", ".join(_HOBBIES.get(arch, [])[:6])
        goal = data["relationship_goals_pool"][0]
        traits = ", ".join(data["personality_trait_pool"][:4])
        lines.append(
            f"- {arch}: traits [{traits}] | interests [{hobbies}] | seeks: {goal}"
        )
    return "\n".join(lines)


def _build_prompt(profile: UserProfile, arch_context: str) -> str:
    hobbies_str = ", ".join(profile.hobbies) or "none listed"
    interests_str = ", ".join(profile.interests) if profile.interests else "none listed"
    occupation_str = profile.occupation or "not specified"

    img_block = ""
    if profile.image_descriptions:
        imgs = "; ".join(profile.image_descriptions)
        img_block = f"\nVisual context from photos: {imgs}"

    return f"""You are a sharp, psychologically-aware dating coach.
Analyse this man's profile and give specific, actionable feedback on how he can
develop his hobbies and interests to stand out more to women with different personality types.
Use the 12 female persona archetypes below as your frame of reference.

## Female Persona Archetypes (12 types, 108 women total)
{arch_context}

## User Profile
Name: {profile.name}
Age: {profile.age}
Occupation: {occupation_str}
Bio: {profile.bio}
Hobbies: {hobbies_str}
Interests: {interests_str}{img_block}

## Task
For each of the user's hobbies:
1. Which 1–3 archetypes find this naturally appealing and why
2. A specific DIRECTION to develop this hobby — not "do more of it", but a concrete angle
   that opens it to more types of women or makes it a genuine conversation-starter
3. The standout tip: the exact level or aspect of this hobby that becomes genuinely impressive

Also identify the 2–3 archetypes the user currently has the WEAKEST overlap with.
For each, give one concrete quick-win — a small addition or pivot that would start to
bridge that gap authentically.

Finally give 3–5 top-level prioritised recommendations.

Respond ONLY with valid JSON in this exact structure — no explanation outside the JSON:
{{
  "summary": "2–3 sentence overall read on his profile",
  "hobby_feedback": [
    {{
      "hobby": "exact hobby name from his list",
      "appeals_to": ["archetype1", "archetype2"],
      "improvement_direction": "specific concrete direction",
      "standout_tip": "the level or angle that becomes impressive"
    }}
  ],
  "archetype_gaps": [
    {{
      "archetype": "archetype name",
      "reason": "why his profile currently underserves this archetype",
      "quick_win": "one specific, authentic addition or pivot"
    }}
  ],
  "top_recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}}"""


def _extract_json(text: str) -> dict:
    """Parse JSON from LLM response; handles markdown code fences and leading text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("No valid JSON found in LLM response")


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/image/describe", response_model=ImageDescription)
def describe_image(payload: ImageInput) -> ImageDescription:
    """
    Converts a photo into a text description using a locally-hosted vision model.
    The returned description should be added to UserProfile.image_descriptions
    before calling POST /api/analyze.

    Requires a vision-capable model (e.g. LLaVA via Ollama).
    Set LLM_MODEL=llava (or any vision model) in your environment.

    Provision: wire the actual vision call when the model is available.
    """
    if not payload.image_base64 and not payload.image_url:
        raise HTTPException(400, "Provide image_base64 or image_url.")

    image_ref = (
        f"data:image/jpeg;base64,{payload.image_base64}"
        if payload.image_base64
        else payload.image_url
    )

    response = _client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": image_ref},
                },
                {
                    "type": "text",
                    "text": (
                        "Describe what this person is doing, where they are, and what "
                        "this reveals about their personality, lifestyle, and interests. "
                        "Be specific. 2–3 sentences."
                    ),
                },
            ],
        }],
    )
    return ImageDescription(description=response.choices[0].message.content)


@router.post("/analyze", response_model=AnalysisResult)
def analyze_profile(profile: UserProfile) -> AnalysisResult:
    """
    Analyses the user's profile against 108 female persona archetypes.

    Returns:
    - Per-hobby feedback: which archetypes it appeals to, how to improve it,
      and the standout angle that makes it impressive.
    - Archetype gaps: the types of women the profile currently underserves,
      with one concrete quick-win per gap.
    - Top recommendations: 3–5 prioritised actions.

    To include photo context, first call POST /api/image/describe for each photo
    and pass the returned descriptions in the image_descriptions field.
    """
    if not profile.hobbies:
        raise HTTPException(400, "At least one hobby is required for analysis.")

    arch_context = _archetype_context()
    prompt = _build_prompt(profile, arch_context)

    response = _client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content

    try:
        data = _extract_json(raw)
        return AnalysisResult(**data)
    except Exception as exc:
        raise HTTPException(
            500,
            f"Failed to parse LLM response: {exc}. "
            f"Raw output (first 300 chars): {raw[:300]}"
        )
