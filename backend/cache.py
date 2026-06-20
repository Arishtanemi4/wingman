import hashlib
import json
import os


def hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:16]


def hash_obj(obj) -> str:
    """Deterministic short hash of any JSON-serialisable object."""
    raw = json.dumps(obj, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


def cache_get(cache_dir: str, key: str) -> dict | None:
    path = os.path.join(cache_dir, f"{key}.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return None


def cache_set(cache_dir: str, key: str, data: dict) -> str:
    os.makedirs(cache_dir, exist_ok=True)
    path = os.path.join(cache_dir, f"{key}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return path
