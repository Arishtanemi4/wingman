import os

BASE_DIR = os.path.dirname(__file__)
PERSONAS_DIR = os.path.join(BASE_DIR, "personas")
FRAGMENTS_DIR = os.path.join(BASE_DIR, "fragments")

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3")
LLM_API_KEY = os.getenv("LLM_API_KEY", "ollama")

TOTAL_PERSONAS = 108
