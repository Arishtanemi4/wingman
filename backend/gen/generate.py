"""
TinyTroupe-based persona generation.
Generates richer AI-elaborated personas using NVIDIA NIM.
Set NVIDIA_API_KEY in env before running.

Run once; personas are saved to personas/.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from gen.config import PERSONAS_DIR, NVIDIA_BASE_URL, NVIDIA_API_KEY, DEFAULT_LLM_MODEL

try:
    import tinytroupe
    from tinytroupe.factory import TinyPersonFactory
except ImportError:
    raise SystemExit("tinytroupe not installed. Run: pip install tinytroupe")

import openai

os.makedirs(PERSONAS_DIR, exist_ok=True)

openai.api_base = NVIDIA_BASE_URL
openai.api_key = NVIDIA_API_KEY

# 12 demographic descriptions, 9 personas each = 108
DEMOGRAPHICS = [
    {
        "archetype": "intellectual",
        "description": (
            "A highly educated woman aged 22–36, driven by intellectual curiosity. "
            "She may be a researcher, academic, scientist, analyst, or journalist. "
            "Values deep conversation and learning. Nationality and background vary widely."
        ),
        "count": 9,
    },
    {
        "archetype": "creative",
        "description": (
            "A creative woman aged 22–33, working as an artist, musician, writer, designer, "
            "photographer, filmmaker, or dancer. Emotionally expressive and aesthetically driven. "
            "Diverse national and cultural backgrounds."
        ),
        "count": 9,
    },
    {
        "archetype": "adventurer",
        "description": (
            "An adventurous woman aged 22–34, who works outdoors or through travel — "
            "as a guide, wildlife photographer, marine biologist, ranger, or expedition leader. "
            "Physically fearless and experience-driven. Internationally diverse."
        ),
        "count": 9,
    },
    {
        "archetype": "careerist",
        "description": (
            "An ambitious professional woman aged 27–37, working in finance, law, tech, "
            "consulting, marketing, or as a founder. Driven, strategic, high-achieving. "
            "Various cultural backgrounds."
        ),
        "count": 9,
    },
    {
        "archetype": "nurturer",
        "description": (
            "A deeply empathetic woman aged 25–36, working as a nurse, teacher, therapist, "
            "social worker, life coach, or carer. Warm, patient, and community-oriented. "
            "Diverse backgrounds."
        ),
        "count": 9,
    },
    {
        "archetype": "rebel",
        "description": (
            "A principled, nonconformist woman aged 22–32, working as an activist, artist, "
            "journalist, comedian, tattoo artist, or lawyer fighting for rights. "
            "Independent, bold, politically engaged. Various nationalities."
        ),
        "count": 9,
    },
    {
        "archetype": "social_butterfly",
        "description": (
            "An extroverted, charismatic woman aged 22–33, working as an influencer, "
            "event planner, PR professional, presenter, DJ, or agent. "
            "People-driven, energetic, and socially fluent. Diverse backgrounds."
        ),
        "count": 9,
    },
    {
        "archetype": "homebody",
        "description": (
            "An introverted, domestic woman aged 23–34, working in roles like software "
            "development, baking, translation, librarianship, or archiving. "
            "Calm, loyal, and deeply contented in her own space. Various backgrounds."
        ),
        "count": 9,
    },
    {
        "archetype": "athlete",
        "description": (
            "A disciplined, physically focused woman aged 21–32, who is a professional athlete, "
            "coach, trainer, physiotherapist, or nutritionist. "
            "Goal-oriented, direct, and grounded. Diverse nationalities."
        ),
        "count": 9,
    },
    {
        "archetype": "spiritualist",
        "description": (
            "A spiritually oriented woman aged 24–34, working as a meditation teacher, "
            "yoga instructor, healer, astrologer, ayurvedic practitioner, or spiritual author. "
            "Intuitive, grounded, and open-minded. Diverse cultural backgrounds."
        ),
        "count": 9,
    },
    {
        "archetype": "free_spirit",
        "description": (
            "A free-spirited, unconventional woman aged 22–32, working as a digital nomad, "
            "surf instructor, organic farmer, busker, artisan, or travelling chef. "
            "Anti-accumulation, joyful, and ethically grounded. Internationally diverse."
        ),
        "count": 9,
    },
    {
        "archetype": "traditionalist",
        "description": (
            "A family and community-oriented woman aged 25–35, working as a nurse, teacher, "
            "accountant, manager, homemaker, counsellor, or community leader. "
            "Loyal, stable, and value-driven. Various cultural backgrounds."
        ),
        "count": 9,
    },
]

PERSONA_FIELDS = ["name", "age", "gender", "sexuality", "nationality",
                  "occupation", "hobbies", "behaviour", "personality_traits",
                  "communication_style", "relationship_goals", "background"]


def save_persona(persona, archetype, index):
    slug = persona.get("name", f"persona_{index}").lower().replace(" ", "_").replace("'", "")
    filename = f"{archetype}_{index+1:02d}_{slug}.json"
    path = os.path.join(PERSONAS_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(persona, f, indent=2, ensure_ascii=False)
    return path


def extract_spec(tiny_person, archetype):
    """Pull relevant fields from a TinyPerson spec dict."""
    spec = tiny_person.get_full_specification() if hasattr(tiny_person, "get_full_specification") else {}
    return {
        "name": spec.get("name", ""),
        "age": spec.get("age"),
        "gender": "female",
        "sexuality": spec.get("sexuality", "heterosexual"),
        "nationality": spec.get("nationality", ""),
        "occupation": spec.get("occupation", ""),
        "hobbies": spec.get("routines", []),
        "behaviour": spec.get("personality_traits", {}).get("big_five", ""),
        "personality_traits": list(spec.get("personality_traits", {}).values()),
        "communication_style": "",
        "relationship_goals": "",
        "background": spec.get("backstory", ""),
        "archetype": archetype,
    }


def main():
    total = 0
    for demo in DEMOGRAPHICS:
        arch = demo["archetype"]
        factory = TinyPersonFactory.create_factory_from_demography(
            demo["description"],
            number_of_people=demo["count"],
        )
        people = factory.generate_people(demo["count"], parallelize=True)
        for i, person in enumerate(people):
            spec = extract_spec(person, arch)
            path = save_persona(spec, arch, i)
            print(f"  saved: {os.path.basename(path)}")
            total += 1

    print(f"\nDone. {total} personas written to {PERSONAS_DIR}")


if __name__ == "__main__":
    main()
