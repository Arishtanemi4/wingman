import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PERSONAS_DIR = os.path.join(BASE_DIR, "personas")
FRAGMENTS_DIR = os.path.join(BASE_DIR, "fragments")
EVALUATIONS_DIR = os.path.join(BASE_DIR, "evaluations")

IMAGE_CACHE_DIR = os.path.join(BASE_DIR, "image_cache")
ANALYSIS_CACHE_DIR = os.path.join(BASE_DIR, "analysis_cache")
EVAL_CACHE_DIR = os.path.join(BASE_DIR, "eval_cache")
USER_PROFILES_DIR = os.path.join(BASE_DIR, "user_profiles")

for _d in (EVALUATIONS_DIR, IMAGE_CACHE_DIR, ANALYSIS_CACHE_DIR, EVAL_CACHE_DIR, USER_PROFILES_DIR):
    os.makedirs(_d, exist_ok=True)

# NVIDIA NIM — text LLM
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "not-configured")

NVIDIA_MODELS = {
    "moonshotai/kimi-k2.6": "Kimi K2",
    "deepseek-ai/deepseek-v4-pro": "DeepSeek V4 Pro",
}
DEFAULT_LLM_MODEL = "moonshotai/kimi-k2.6"

# Vision model — NVIDIA NIM (same key as text LLM)
VISION_BASE_URL = os.getenv("VISION_BASE_URL", "https://integrate.api.nvidia.com/v1")
VISION_API_KEY = os.getenv("VISION_API_KEY", NVIDIA_API_KEY)
VISION_MODEL = os.getenv("VISION_MODEL", "meta/llama-3.2-11b-vision-instruct")

# Persona chat sampling
CHAT_TEMPERATURE = float(os.getenv("CHAT_TEMPERATURE", "0.9"))
CHAT_MAX_TOKENS = int(os.getenv("CHAT_MAX_TOKENS", "150"))

TOTAL_PERSONAS = 108
