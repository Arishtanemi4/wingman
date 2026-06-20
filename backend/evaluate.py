"""
Run once: evaluates the male profile (Big Five analysis) against all 108 female
personas and saves one JSON per persona to ./evaluations/, plus a combined file.

Usage (from backend/):
    conda run -n wingman python evaluate.py
"""

import json
import sys
from pathlib import Path

# Resolve backend root so gen.config is importable
sys.path.insert(0, str(Path(__file__).parent))

from gen.config import LLM_BASE_URL, LLM_MODEL, LLM_API_KEY, PERSONAS_DIR
from openai import OpenAI

OUTPUT_DIR = Path(__file__).parent / "evaluations"

_client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)

# ── Male profile derived from the Big Five photo analysis ─────────────────────

MALE_PROFILE = """\
Big Five Personality Analysis (inferred from dating profile photos at Durdle Door, UK):

1. Openness to Experience — Moderate-High
   Wears an East Asian aesthetic graphic tee at a British coastal landmark, signalling
   cross-cultural curiosity beyond the local mainstream. Chose Durdle Door (geologically
   significant, historically layered) over a generic beach. Demonstrates compositional
   awareness in photo framing (arch deliberately positioned).

2. Conscientiousness — Moderate
   Carries a hat (sun preparedness), wears an analogue wristwatch, tidy but not rigidly
   curated appearance, jacket tied around waist for practical temperature adaptation.
   No strong signals of hyper-organisation or carelessness — adequate rather than meticulous.

3. Extraversion — Moderate to Moderate-High
   Direct, sustained gaze into camera with a genuine Duchenne smile. Comfortable being
   photographed prominently at a busy tourist landmark. Open, relaxed posture; weight
   distributed casually. No stiffness or performative attention-seeking.

4. Agreeableness — Moderate-High
   Classic approachability cluster: head tilt + genuine smile. Open body language with
   no crossed arms or dominance display. Minimal understated accessories (single bracelet,
   watch) — consistent with low status-signalling and a non-hierarchical interpersonal
   style. Soft, relaxed facial musculature — no adversarial affect.

5. Neuroticism / Emotional Stability — Low Neuroticism (High Stability)
   Genuine ease at an exposed clifftop environment; relaxed posture, no visible anxiety
   or environmental hypervigilance. Comfortable as the primary subject of a deliberately
   composed photograph — low self-consciousness in evaluative social contexts.\
"""

# ── Prompt template ───────────────────────────────────────────────────────────

_PROMPT = """\
You are an expert dating profile consultant and a highly advanced behavioral psychology engine. \
Your task is to roleplay as a specific female user persona and critically evaluate a male user's \
dating profile from her unique perspective.

### EVALUATION LOGIC & CRITERIA
When reviewing the male profile, you must evaluate it through the following psychological lenses \
relevant to your persona:
1. Provider & Ambition Signal: Does his lifestyle, career, or drive align with what you look for?
2. Physical & Kinesthetic Appeal: Do his photos suggest high energy, health, effort, and good grooming?
3. Social Intelligence & Warmth: Does he seem approachable and emotionally intelligent, or isolated and arrogant?
4. Conversational Openness: Does his profile provide natural conversation hooks, or is it a dead-end?
5. Green/Red Flags: Identify subtle subconscious cues in his images (e.g., messy room, poor lighting) \
or prompts (e.g., negativity, bitterness).

---

### THE EVALUATOR (YOUR PERSONA)
{persona}

---

### THE TARGET PROFILE (THE MALE PERSONA)
{male_profile}

---

### OUTPUT FORMAT
You must output your evaluation strictly in the following JSON format. \
Do not include any introductory or concluding conversational prose outside of the JSON.

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
    "direct_quote": "A single, highly characteristic quote in your persona's voice summarizing your thoughts."
  }}
}}\
"""


def _format_persona(p: dict) -> str:
    traits = ", ".join(p.get("personality_traits", []))
    hobbies = ", ".join(p.get("hobbies", []))
    return (
        f"Name: {p['name']}\n"
        f"Age: {p['age']}\n"
        f"Occupation: {p['occupation']}\n"
        f"Archetype: {p['archetype']}\n"
        f"Nationality: {p.get('nationality', 'N/A')}\n"
        f"Hobbies: {hobbies}\n"
        f"Personality Traits: {traits}\n"
        f"Communication Style: {p.get('communication_style', '')}\n"
        f"Relationship Goals: {p.get('relationship_goals', '')}\n"
        f"Behaviour: {p.get('behaviour', '')}\n"
        f"Background: {p.get('background', '')}"
    )


def _evaluate(persona: dict) -> dict:
    prompt = _PROMPT.format(persona=_format_persona(persona), male_profile=MALE_PROFILE)
    response = _client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if the model wraps output in ```json ... ```
    if raw.startswith("```"):
        raw = raw[raw.index("\n") + 1:]
        if raw.endswith("```"):
            raw = raw[: raw.rfind("```")]
    return json.loads(raw.strip())


def _load_personas() -> list[dict]:
    return [
        json.loads(p.read_text(encoding="utf-8"))
        for p in sorted(Path(PERSONAS_DIR).glob("*.json"))
    ]


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    personas = _load_personas()
    print(f"Loaded {len(personas)} personas. Saving evaluations to {OUTPUT_DIR}\n")

    all_results = []
    for i, persona in enumerate(personas, 1):
        name = persona["name"]
        print(f"[{i:>3}/{len(personas)}] {name} ...", end=" ", flush=True)
        try:
            result = _evaluate(persona)
            all_results.append(result)
            slug = name.lower().replace(" ", "_")
            (OUTPUT_DIR / f"{slug}.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
            score = result["agent_metadata"]["compatibility_score"]
            print(f"score={score}")
        except Exception as exc:
            print(f"ERROR — {exc}")

    (OUTPUT_DIR / "all_evaluations.json").write_text(json.dumps(all_results, indent=2), encoding="utf-8")
    print(f"\nComplete. {len(all_results)}/{len(personas)} evaluations saved.")


if __name__ == "__main__":
    main()
