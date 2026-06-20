import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PERSONAS_DIR = os.path.join(BASE_DIR, "personas")
FRAGMENTS_DIR = os.path.join(BASE_DIR, "fragments")
EVALUATIONS_DIR = os.path.join(BASE_DIR, "evaluations")

# Metadata caches — keyed by content hash so work isn't repeated
IMAGE_CACHE_DIR = os.path.join(BASE_DIR, "image_cache")
ANALYSIS_CACHE_DIR = os.path.join(BASE_DIR, "analysis_cache")
EVAL_CACHE_DIR = os.path.join(BASE_DIR, "eval_cache")

USER_PROFILES_DIR = os.path.join(BASE_DIR, "user_profiles")

for _d in (EVALUATIONS_DIR, IMAGE_CACHE_DIR, ANALYSIS_CACHE_DIR, EVAL_CACHE_DIR, USER_PROFILES_DIR):
    os.makedirs(_d, exist_ok=True)

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3")
VISION_MODEL = os.getenv("VISION_MODEL", "minicpm-v")
LLM_API_KEY = os.getenv("LLM_API_KEY", "ollama")

TOTAL_PERSONAS = 108
