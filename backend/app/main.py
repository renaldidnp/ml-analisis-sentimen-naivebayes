from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import preprocess_debug


from app.api.analyze import router as analyze_router
from app.core.config import settings

app = FastAPI(title="Rasa API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api")
app.include_router(preprocess_debug.router, prefix="/api", tags=["debug"])


@app.get("/")
def root():
    return {"name": "Rasa API", "status": "running"}
