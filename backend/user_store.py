import json
import os
from datetime import datetime

from gen.config import USER_PROFILES_DIR


def _path(username: str) -> str:
    safe = username.lower().replace(" ", "_")
    return os.path.join(USER_PROFILES_DIR, f"{safe}.json")


def _load(username: str) -> dict:
    p = _path(username)
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    return {"username": username, "history": []}


def _save(username: str, data: dict):
    with open(_path(username), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def append_analysis(username: str, profile: dict, analysis: dict):
    """Add an analyze result to the user's profile history."""
    if not username:
        return
    data = _load(username)
    data["history"].append({
        "type": "analysis",
        "timestamp": datetime.utcnow().isoformat(),
        "profile_name": profile.get("name", ""),
        "profile": profile,
        "analysis": analysis,
    })
    _save(username, data)


def append_evaluation(username: str, profile: dict, evaluations: list):
    """Add an evaluate result to the user's profile history."""
    if not username:
        return
    data = _load(username)
    data["history"].append({
        "type": "evaluation",
        "timestamp": datetime.utcnow().isoformat(),
        "profile_name": profile.get("name", ""),
        "profile": profile,
        "evaluations": evaluations,
    })
    _save(username, data)
