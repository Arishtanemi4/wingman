import json
import os
import re

from fastapi import APIRouter, HTTPException
from json_repair import repair_json
from openai import OpenAI
from pydantic import BaseModel

from cache import cache_get, cache_set, hash_obj
from gen.config import ANALYSIS_CACHE_DIR, FRAGMENTS_DIR, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
INSIGHTS_CACHE_DIR = ANALYSIS_CACHE_DIR  # reuse same dir, different key prefix
from routes.image import format_image_block
from user_store import append_analysis

router = APIRouter()
_client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)

# Fragment pools loaded once at startup
with open(os.path.join(FRAGMENTS_DIR, "hobbies.json"), encoding="utf-8") as _f:
    _HOBBIES: dict = json.load(_f)

with open(os.path.join(FRAGMENTS_DIR, "archetypes.json"), encoding="utf-8") as _f:
    _ARCHETYPES: dict = json.load(_f)


# ── Models ────────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    name: str
    age: int
    bio: str
    occupation: str | None = None
    hobbies: list[str]
    image_descriptions: list[str] = []
    image_analyses: list[dict] = []
    username: str | None = None               # set by frontend from session


class HobbyFeedback(BaseModel):
    hobby: str
    appeals_to: list[str]
    improvement_direction: str
    standout_tip: str


class ArchetypeGap(BaseModel):
    archetype: str
    reason: str
    quick_win: str


class AnalysisResult(BaseModel):
    summary: str
    hobby_feedback: list[HobbyFeedback]
    archetype_gaps: list[ArchetypeGap]
    top_recommendations: list[str]


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
    occupation_str = profile.occupation or "not specified"

    img_block = ""
    photos = format_image_block(profile.image_descriptions, profile.image_analyses)
    if photos:
        img_block = f"\n\n## Photos (with aesthetic scores out of 10)\n{photos}"

    return f"""You are a sharp, psychologically-aware dating coach.
Analyse this man's profile and give specific, actionable feedback on how he can
develop his hobbies and interests to stand out more to women with different personality types.
Use the 12 female persona archetypes below as your frame of reference.
Where photo scores are given, factor the visual presentation into your read.

## Female Persona Archetypes (12 types, 108 women total)
{arch_context}

## User Profile
Name: {profile.name}
Age: {profile.age}
Occupation: {occupation_str}
Bio: {profile.bio}
Hobbies: {hobbies_str}{img_block}

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
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{.*\}', text, re.DOTALL)
    raw = match.group() if match else text
    result = repair_json(raw, return_objects=True)
    if not isinstance(result, dict):
        raise ValueError("No valid JSON found in LLM response")
    return result


def _normalise(data: dict) -> dict:
    # llama3 sometimes emits recs as [{"text": ""}] instead of ["text"]
    recs = data.get("top_recommendations", [])
    if recs and isinstance(recs[0], dict):
        data["top_recommendations"] = [next(iter(r.values()), "") for r in recs if isinstance(r, dict)]
    return data


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalysisResult)
def analyze_profile(profile: UserProfile) -> AnalysisResult:
    """
    Analyses the user's profile against the 12 female persona archetypes,
    factoring in scored photo analyses. Results are cached by profile hash
    so an identical profile is never re-processed.
    """
    if not profile.hobbies:
        raise HTTPException(400, "At least one hobby is required for analysis.")

    key = hash_obj(profile.model_dump())
    cached = cache_get(ANALYSIS_CACHE_DIR, key)
    if cached:
        return AnalysisResult(**cached)

    arch_context = _archetype_context()
    prompt = _build_prompt(profile, arch_context)

    response = _client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content

    try:
        data = _normalise(_extract_json(raw))
        result = AnalysisResult(**data)
    except Exception as exc:
        raise HTTPException(
            500,
            f"Failed to parse LLM response: {exc}. "
            f"Raw output (first 300 chars): {raw[:300]}"
        )

    cache_set(ANALYSIS_CACHE_DIR, key, result.model_dump())
    append_analysis(profile.username or "", profile.model_dump(exclude={"username"}), result.model_dump())
    return result


# ── Archetype Insights ────────────────────────────────────────────────────────

_INSIGHTS_PROMPT = """You are a dating coach. Based on this man's dating profile, analyse his
compatibility with each of the 12 female personality archetypes below.
For each archetype give exactly 2 pros (what naturally appeals to women of this type about him)
and 2 cons (what he would need to improve to better attract this type).
Be specific — reference his actual hobbies, bio, and job.

## His Profile
Name: {name}, Age: {age}, Occupation: {occupation}
Bio: {bio}
Hobbies: {hobbies}

## Archetypes
{arch_context}

Respond ONLY with valid JSON — no prose outside it:
{{
  "insights": [
    {{
      "archetype": "<archetype key>",
      "pros": ["specific pro 1", "specific pro 2"],
      "cons": ["specific con 1", "specific con 2"]
    }}
  ]
}}"""


class ArchetypeInsight(BaseModel):
    archetype: str
    pros: list[str]
    cons: list[str]


class InsightsResult(BaseModel):
    insights: list[ArchetypeInsight]


@router.post("/archetypes/insights", response_model=InsightsResult)
def archetype_insights(profile: UserProfile) -> InsightsResult:
    """One LLM call — returns pros/cons for all 12 archetypes. Cached by profile hash."""
    if not profile.hobbies:
        raise HTTPException(400, "At least one hobby is required.")

    key = "insights_" + hash_obj(profile.model_dump())
    cached = cache_get(INSIGHTS_CACHE_DIR, key)
    if cached:
        return InsightsResult(**cached)

    prompt = _INSIGHTS_PROMPT.format(
        name=profile.name,
        age=profile.age,
        occupation=profile.occupation or "not specified",
        bio=profile.bio,
        hobbies=", ".join(profile.hobbies),
        arch_context=_archetype_context(),
    )
    response = _client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content

    try:
        data = _extract_json(raw)
        result = InsightsResult(**data)
    except Exception as exc:
        raise HTTPException(500, f"Failed to parse insights: {exc}. Raw: {raw[:300]}")

    cache_set(INSIGHTS_CACHE_DIR, key, result.model_dump())
    return result
