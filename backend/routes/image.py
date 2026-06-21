import asyncio
import base64
import json
import re
import time

from fastapi import APIRouter, HTTPException
from json_repair import repair_json
from openai import OpenAI
from pydantic import BaseModel

from cache import cache_get, cache_set, hash_bytes
from gen.config import IMAGE_CACHE_DIR, VISION_BASE_URL, VISION_API_KEY, VISION_MODEL

router = APIRouter()
_client = OpenAI(base_url=VISION_BASE_URL, api_key=VISION_API_KEY, timeout=120.0)
# cap concurrent vision API calls — model returns prose instead of JSON when overloaded
_vision_sem = asyncio.Semaphore(1)

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
    if not text:
        raise ValueError("vision model returned empty content")

    # Direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    # Strip markdown code fences, then retry
    stripped = re.sub(r'```(?:json)?\s*', '', text).strip()
    try:
        return json.loads(stripped)
    except (json.JSONDecodeError, ValueError):
        pass

    # Find first balanced { ... } object (avoids greedy overshoot)
    depth, start = 0, None
    for i, ch in enumerate(text):
        if ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                candidate = text[start:i + 1]
                result = repair_json(candidate, return_objects=True)
                if isinstance(result, dict):
                    return result
                break

    # Last resort: repair the whole response
    result = repair_json(text, return_objects=True)
    if isinstance(result, dict):
        return result

    raise ValueError("vision model did not return a JSON object")


def _to_score(val, default: float = 0.0) -> float:
    """Coerce a model value (number, '7/10', a sentence…) to a 0–10 float."""
    if isinstance(val, bool):
        return default
    if isinstance(val, (int, float)):
        num = float(val)
    elif isinstance(val, str):
        m = re.search(r"-?\d+(?:\.\d+)?", val)
        num = float(m.group()) if m else default
    else:
        num = default
    return max(0.0, min(10.0, num))


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

    last_err = None
    for _attempt in range(2):
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
        content = response.choices[0].message.content or ""
        try:
            data = _extract_json(content)
            last_err = None
            break
        except ValueError as exc:
            last_err = exc
            time.sleep(1.5)  # brief pause before retry
    if last_err:
        raise last_err
    time.sleep(1.5)  # stay under 40 RPM across all API calls

    raw_scores = data.get("scores", {})
    scores = (
        {k: _to_score(v) for k, v in raw_scores.items()}
        if isinstance(raw_scores, dict) else {}
    )
    # overall may come back as a sentence — fall back to the mean of the sub-scores
    overall = _to_score(data.get("overall"), default=0.0)
    if overall <= 0:
        overall = round(sum(scores.values()) / len(scores), 1) if scores else 5.0

    result = {
        "description": str(data.get("description", "")),
        "scores": scores,
        "overall": overall,
        "improvement": str(data.get("improvement", "")),
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
async def describe_image(payload: ImageInput) -> ImageAnalysis:
    """
    Describes + scores a photo. Serialised via semaphore — the vision model
    returns prose instead of JSON when hit with concurrent requests.
    Cached by image hash so the same photo is never re-processed.
    """
    if not payload.image_base64 and not payload.image_url:
        raise HTTPException(400, "Provide image_base64 or image_url.")
    try:
        async with _vision_sem:
            result = await asyncio.to_thread(
                analyze_image, payload.image_base64, payload.image_url
            )
        return ImageAnalysis(**result)
    except Exception as exc:
        raise HTTPException(500, f"Image analysis failed: {exc}")
