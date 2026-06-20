import base64
import json
import re

from fastapi import APIRouter, HTTPException
from json_repair import repair_json
from openai import OpenAI
from pydantic import BaseModel

from cache import cache_get, cache_set, hash_bytes
from gen.config import IMAGE_CACHE_DIR, LLM_API_KEY, LLM_BASE_URL, VISION_MODEL

router = APIRouter()
_client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY, timeout=120.0)

_VISION_PROMPT = """You are a professional dating-profile photo analyst with expertise in
facial aesthetics, photography, and behavioral psychology. Analyse this photo of a man.

Score each dimension from 1 to 10 (10 = exceptional):
- golden_ratio: how well his facial proportions / framing follow the golden ratio
- lighting: quality and flattering nature of the lighting
- contrast: image contrast, sharpness and clarity
- facial_symmetry: symmetry of his face
- physical_build: perceived fitness, posture and physical presence

Respond with ONLY valid JSON in this exact structure — no prose outside the JSON:
{
  "description": "2-3 sentences: what he's doing, the setting, the vibe, grooming, and what it subconsciously signals to a potential date",
  "scores": {
    "golden_ratio": 0,
    "lighting": 0,
    "contrast": 0,
    "facial_symmetry": 0,
    "physical_build": 0
  },
  "overall": 0,
  "improvement": "one concrete tip to make this a stronger dating photo"
}"""


class ImageInput(BaseModel):
    image_base64: str | None = None  # base64-encoded JPEG/PNG (no data: prefix)
    image_url: str | None = None     # publicly accessible image URL


class ImageAnalysis(BaseModel):
    image_hash: str
    cached: bool
    description: str
    scores: dict
    overall: float
    improvement: str


def _extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{.*\}', text, re.DOTALL)
    raw = match.group() if match else text
    result = repair_json(raw, return_objects=True)
    if not isinstance(result, dict):
        raise ValueError("vision model did not return a JSON object")
    return result


def analyze_image(image_base64: str | None, image_url: str | None) -> dict:
    """Describe + score a photo via qwen2.5-vl. Cached by image hash."""
    if not image_base64 and not image_url:
        raise ValueError("Provide image_base64 or image_url.")

    if image_base64:
        key = hash_bytes(base64.b64decode(image_base64))
        image_ref = f"data:image/jpeg;base64,{image_base64}"
    else:
        key = hash_bytes(image_url.encode("utf-8"))
        image_ref = image_url

    cached = cache_get(IMAGE_CACHE_DIR, key)
    if cached:
        return {**cached, "image_hash": key, "cached": True}

    response = _client.chat.completions.create(
        model=VISION_MODEL,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_ref}},
                {"type": "text", "text": _VISION_PROMPT},
            ],
        }],
    )
    data = _extract_json(response.choices[0].message.content)

    result = {
        "description": data.get("description", ""),
        "scores": data.get("scores", {}),
        "overall": float(data.get("overall", 0) or 0),
        "improvement": data.get("improvement", ""),
    }
    cache_set(IMAGE_CACHE_DIR, key, result)
    return {**result, "image_hash": key, "cached": False}


def aggregate_photo_score(image_analyses: list[dict]) -> dict | None:
    """
    Combine per-photo 'overall' scores into one 'photo strength'.
    Best-dominant (halo / first impression) with a soft penalty for a weak pic.
    The first photo is treated as the main/headline. Keep constants in sync with
    frontend/services/photoScore.js.
    """
    overalls = [float(a.get("overall", 0) or 0) for a in image_analyses or []]
    if not overalls:
        return None

    best, avg, main, worst = max(overalls), sum(overalls) / len(overalls), overalls[0], min(overalls)
    base = 0.5 * best + 0.3 * main + 0.2 * avg
    penalty = max(0.0, 5 - worst) * 0.5          # soft: only weak pics (<5) dent
    strength = round(min(10.0, max(1.0, base - penalty)), 1)

    weakest_index = overalls.index(worst)
    return {
        "strength": strength,
        "best": best,
        "weakest_index": weakest_index,
        "weakest_score": worst,
        "count": len(overalls),
    }


def format_image_block(image_descriptions: list[str], image_analyses: list[dict]) -> str:
    """Render photo data (plain descriptions + scored analyses) for LLM prompts."""
    lines = []
    for d in image_descriptions or []:
        lines.append(f"- {d}")
    for i, a in enumerate(image_analyses or []):
        scores = a.get("scores", {})
        scores_str = ", ".join(f"{k}: {v}/10" for k, v in scores.items())
        overall = a.get("overall")
        tag = "main photo" if i == 0 else f"photo {i + 1}"
        suffix = f" [{tag} — {scores_str}; overall {overall}/10]" if scores else ""
        lines.append(f"- {a.get('description', '')}{suffix}")

    agg = aggregate_photo_score(image_analyses)
    if agg and agg["count"] > 1:
        weakest = image_analyses[agg["weakest_index"]]
        lines.append(
            f"\nOverall photo strength: {agg['strength']}/10 across {agg['count']} photos. "
            f"His strongest photo leads the first impression; his weakest "
            f"(\"{weakest.get('description', '')[:60]}\", {agg['weakest_score']}/10) is a mild drag. "
            f"Weigh his best pic heavily, but don't ignore a weak one."
        )
    return "\n".join(lines)


@router.post("/image/describe", response_model=ImageAnalysis)
def describe_image(payload: ImageInput) -> ImageAnalysis:
    """
    Describes + scores a user's photo using qwen2.5-vl (golden ratio, lighting,
    contrast, facial symmetry, physical build). Cached by image hash so the same
    photo is never re-processed. Pass the returned object into
    UserProfile.image_analyses for /analyze and /evaluate.
    """
    if not payload.image_base64 and not payload.image_url:
        raise HTTPException(400, "Provide image_base64 or image_url.")
    try:
        return ImageAnalysis(**analyze_image(payload.image_base64, payload.image_url))
    except Exception as exc:
        raise HTTPException(500, f"Image analysis failed: {exc}")
