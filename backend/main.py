from dotenv import load_dotenv
load_dotenv()

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from gen.config import NVIDIA_MODELS, DEFAULT_LLM_MODEL, IMAGE_CACHE_DIR, ANALYSIS_CACHE_DIR, EVAL_CACHE_DIR
from routes.personas import router as personas_router
from routes.analyze import router as analyze_router
from routes.evaluate import router as evaluate_router
from routes.image import router as image_router
from routes.auth import router as auth_router

app = FastAPI(title="Wingman API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(personas_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")
app.include_router(evaluate_router, prefix="/api")
app.include_router(image_router, prefix="/api")


@app.get("/api/models")
def list_models():
    return {
        "models": [{"id": k, "label": v} for k, v in NVIDIA_MODELS.items()],
        "default": DEFAULT_LLM_MODEL,
    }


@app.delete("/api/cache")
def clear_cache():
    cleared = 0
    for cache_dir in (IMAGE_CACHE_DIR, ANALYSIS_CACHE_DIR, EVAL_CACHE_DIR):
        for fname in os.listdir(cache_dir):
            fp = os.path.join(cache_dir, fname)
            if os.path.isfile(fp):
                os.remove(fp)
                cleared += 1
    return {"cleared": cleared}
