import glob
import json
import os
import random

from gen.config import PERSONAS_DIR

def _load_all() -> list[dict]:
    files = glob.glob(os.path.join(PERSONAS_DIR, "*.json"))
    personas = []
    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            personas.append(json.load(f))
    return personas

_ALL: list[dict] = _load_all()
_BY_NAME: dict[str, dict] = {p["name"].lower(): p for p in _ALL}


def list_personas(archetype: str | None = None) -> list[dict]:
    if archetype:
        return [p for p in _ALL if p["archetype"] == archetype]
    return list(_ALL)


def get_persona(name: str) -> dict | None:
    return _BY_NAME.get(name.lower())


def random_persona(archetype: str | None = None) -> dict:
    pool = list_personas(archetype)
    return random.choice(pool)
