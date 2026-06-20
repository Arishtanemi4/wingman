from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.personas import router as personas_router
from routes.analyze import router as analyze_router
from routes.evaluate import router as evaluate_router

app = FastAPI(title="Wingman API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(personas_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")
app.include_router(evaluate_router, prefix="/api")
