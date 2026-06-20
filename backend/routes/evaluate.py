import json
import os
import re
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

from json_repair import repair_json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel

from agents import list_personas
from cache import cache_get, cache_set, hash_obj
from gen.config import EVAL_CACHE_DIR, EVALUATIONS_DIR, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
from routes.image import format_image_block
from user_store import append_evaluation

router = APIRouter()
_client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY, timeout=60.0)

_EVAL_PROMPT = """You are an expert dating profile consultant and a highly advanced behavioral psychology engine. Your task is to roleplay as a specific female user persona and critically evaluate a male user's dating profile from her unique perspective.

### EVALUATION LOGIC & CRITERIA
When reviewing the male profile, you must evaluate it through the following psychological lenses relevant to your persona:
1. Provider & Ambition Signal: Does his lifestyle, career, or drive align with what you look for?
2. Physical & Kinesthetic Appeal: Do his photos suggest high energy, health, effort, and good grooming?
3. Social Intelligence & Warmth: Does he seem approachable and emotionally intelligent, or isolated and arrogant?
4. Conversational Openness: Does his profile provide natural conversation hooks, or is it a dead-end?
5. Green/Red Flags: Identify subtle subconscious cues in his images (e.g., messy room, poor lighting) or prompts (e.g., negativity, bitterness).

---

### THE EVALUATOR (YOUR PERSONA)
{persona}

---

### THE TARGET PROFILE (THE MALE PERSONA)
{male_profile}

---

### OUTPUT FORMAT
You must output your evaluation strictly in the following JSON format. Do not include any introductory or concluding conversational prose outside of the JSON.

{{
  "agent_metadata": {{
    "agent_name": "[Name of Agent]",
    "compatibility_score": [An integer from 1 to 100 representing how likely you would be to swipe right]
  }},
  "psychological_critique": {{
    "first_impression": "Your immediate psychological reaction to his photos and overall vibe.",
    "perceived_value": "How you view his social status, ambition, and emotional maturity based on his profile.",
    "dealbreakers_detected": "Any micro-red flags or turn-offs specific to your persona."
  }},
  "actionable_feedback": {{
    "prompt_changes": "Specific advice on his bio, tone, or word choice to make him more appealing to women like you.",
    "direct_quote": "A single, highly characteristic quote in your persona's voice summarizing your thoughts (e.g., 'If you showed a bit more of your goofy side instead of trying to look tough, I'd swipe right.')."
  }}
}}"""


class EvaluationReport(BaseModel):
    profile_name: str
    timestamp: str
    total: int
    file_path: str
    evaluations: list[dict]


def _format_persona(p: dict) -> str:
    traits = ", ".join(p.get("personality_traits", []))
    hobbies = ", ".join(p.get("hobbies", []))
    return (
        f"Name: {p['name']}\n"
        f"Age: {p['age']}\n"
        f"Occupation: {p['occupation']}\n"
        f"Nationality: {p['nationality']}\n"
        f"Archetype: {p['archetype']}\n"
        f"Personality: {traits}\n"
        f"Hobbies: {hobbies}\n"
        f"Relationship goals: {p.get('relationship_goals', '')}\n"
        f"Background: {p.get('background', '')}"
    )


def _format_male_profile(name: str, age: int, occupation: str, bio: str,
                          hobbies: list[str], interests: list[str],
                          image_descriptions: list[str], image_analyses: list[dict]) -> str:
    photos = format_image_block(image_descriptions, image_analyses) or "none"
    return (
        f"Name: {name}\n"
        f"Age: {age}\n"
        f"Occupation: {occupation or 'not specified'}\n"
        f"Bio: {bio}\n"
        f"Hobbies: {', '.join(hobbies)}\n"
        f"Interests: {', '.join(interests) if interests else 'none listed'}\n"
        f"Photos (with aesthetic scores out of 10):\n{photos}"
    )


def _extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{.*\}', text, re.DOTALL)
    raw = match.group() if match else text
    # return_objects=True gives a dict directly, skipping the re-parse step
    result = repair_json(raw, return_objects=True)
    if not isinstance(result, dict):
        raise ValueError(f"repair_json returned {type(result)}, expected dict")
    return result


def _evaluate_one(persona_data: dict, male_profile_str: str) -> dict | None:
    try:
        prompt = _EVAL_PROMPT.format(
            persona=_format_persona(persona_data),
            male_profile=male_profile_str,
        )
        response = _client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        return _extract_json(response.choices[0].message.content)
    except Exception:
        return None


def run_evaluation(name: str, age: int, occupation: str, bio: str,
                   hobbies: list[str], interests: list[str],
                   image_descriptions: list[str], image_analyses: list[dict]) -> str:
    """
    Runs all 108 personas against the male profile in parallel.
    Saves report to gen/evaluations/<name>_<timestamp>.json.
    Returns the saved file path.
    """
    print(f"[eval] Starting evaluation for '{name}'")

    male_profile_str = _format_male_profile(
        name, age, occupation, bio, hobbies, interests, image_descriptions, image_analyses
    )

    # One persona per archetype — 12 calls instead of 108
    all_personas = list_personas()
    seen = set()
    personas = []
    for p in all_personas:
        if p["archetype"] not in seen:
            seen.add(p["archetype"])
            personas.append(p)

    print(f"[eval] Running {len(personas)} evaluations (1 per archetype)")

    evaluations = []

    # 1 worker: Ollama is single-threaded, parallelism just queues
    with ThreadPoolExecutor(max_workers=1) as executor:
        futures = {
            executor.submit(_evaluate_one, p, male_profile_str): p["name"]
            for p in personas
        }
        done = 0
        for future in as_completed(futures):
            try:
                result = future.result()
                if result:
                    evaluations.append(result)
            except Exception:
                pass
            done += 1
            print(f"[eval] {done}/{len(personas)} done")

    print(f"[eval] Completed {len(evaluations)}/{len(personas)} evaluations")

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = name.lower().replace(" ", "_")
    filepath = os.path.abspath(os.path.join(EVALUATIONS_DIR, f"{safe_name}_{timestamp}.json"))

    report = {
        "profile_name": name,
        "timestamp": timestamp,
        "total": len(evaluations),
        "evaluations": evaluations,
    }

    print(f"[eval] Writing to {filepath}")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"[eval] Saved → {filepath}")
    return filepath


class UserProfile(BaseModel):
    name: str
    age: int
    bio: str
    occupation: str | None = None
    hobbies: list[str]
    interests: list[str] = []
    image_descriptions: list[str] = []
    image_analyses: list[dict] = []
    username: str | None = None


@router.post("/evaluate", response_model=EvaluationReport)
def evaluate_profile_route(profile: UserProfile) -> EvaluationReport:
    if not profile.hobbies:
        raise HTTPException(400, "At least one hobby is required.")

    filepath = run_evaluation(
        profile.name, profile.age, profile.occupation or "",
        profile.bio, profile.hobbies, profile.interests,
        profile.image_descriptions, profile.image_analyses,
    )

    with open(filepath, encoding="utf-8") as f:
        report = json.load(f)

    return EvaluationReport(**report, file_path=filepath)


@router.post("/evaluate/stream")
def evaluate_stream(profile: UserProfile):
    """SSE endpoint — streams one evaluation per archetype, updates JSON file per result."""
    if not profile.hobbies:
        raise HTTPException(400, "At least one hobby is required.")

    key = hash_obj(profile.model_dump())

    def generate():
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_name = profile.name.lower().replace(" ", "_")
        filepath = os.path.abspath(
            os.path.join(EVALUATIONS_DIR, f"{safe_name}_{timestamp}.json")
        )

        # Cache hit → replay stored evaluations instantly, no LLM calls
        cached = cache_get(EVAL_CACHE_DIR, key)
        if cached:
            evals = cached.get("evaluations", [])
            yield f"data: {json.dumps({'type': 'start', 'total': len(evals), 'cached': True})}\n\n"
            for i, result in enumerate(evals):
                yield f"data: {json.dumps({'type': 'result', 'index': i + 1, 'data': result})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'total': len(evals), 'cached': True})}\n\n"
            return

        report = {"profile_name": profile.name, "timestamp": timestamp, "total": 0, "evaluations": []}
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        # One persona per archetype (12 total)
        seen, personas = set(), []
        for p in list_personas():
            if p["archetype"] not in seen:
                seen.add(p["archetype"])
                personas.append(p)

        male_profile_str = _format_male_profile(
            profile.name, profile.age, profile.occupation or "",
            profile.bio, profile.hobbies, profile.interests,
            profile.image_descriptions, profile.image_analyses,
        )

        yield f"data: {json.dumps({'type': 'start', 'total': len(personas), 'file_path': filepath})}\n\n"

        for i, persona_data in enumerate(personas):
            result = _evaluate_one(persona_data, male_profile_str)
            if result:
                report["evaluations"].append(result)
                report["total"] = len(report["evaluations"])
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(report, f, indent=2, ensure_ascii=False)
                yield f"data: {json.dumps({'type': 'result', 'index': i + 1, 'data': result})}\n\n"

        # Persist completed report to cache for instant future replays
        cache_set(EVAL_CACHE_DIR, key, report)
        append_evaluation(
            profile.username or "",
            profile.model_dump(exclude={"username"}),
            report["evaluations"],
        )
        yield f"data: {json.dumps({'type': 'done', 'total': report['total'], 'file_path': filepath})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
