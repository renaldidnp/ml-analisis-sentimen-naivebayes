from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.schemas.analysis import AnalysisResponse, SentimentCounts, TweetResult
from app.services.predictor import ModelNotReadyError, predictor
from app.services.preprocessing import preprocess_batch
from app.utils.file_handler import read_tabular_upload

router = APIRouter()

ALLOWED_EXTENSIONS = (".csv", ".xlsx")


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    text_column: str | None = Form(default=None),
):
    filename = file.filename or ""
    if not filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400, detail="File harus berformat .csv atau .xlsx"
        )

    raw = await file.read()

    try:
        df = read_tabular_upload(raw, filename, settings.max_upload_mb)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    column = text_column or settings.text_column
    if column not in df.columns:
        available = ", ".join(df.columns.astype(str))
        raise HTTPException(
            status_code=400,
            detail=f"Kolom '{column}' tidak ditemukan. Kolom yang ada: {available}",
        )

    df = df.dropna(subset=[column]).reset_index(drop=True)
    if df.empty:
        raise HTTPException(
            status_code=400, detail="Tidak ada baris dengan teks yang valid di file ini"
        )

    texts = df[column].astype(str).tolist()
    cleaned = preprocess_batch(texts)

    try:
        labels = predictor.predict(cleaned)
    except ModelNotReadyError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    counts = {"positif": 0, "negatif": 0, "netral": 0}
    for label in labels:
        key = label.lower()
        if key in counts:
            counts[key] += 1

    total = len(labels)
    ratio = {k: round(v / total, 4) if total else 0.0 for k, v in counts.items()}

    results = [
        TweetResult(
            text=texts[i],
            label=labels[i],
            username=str(df["username"].iloc[i]) if "username" in df.columns else None,
            created_at=str(df["created_at"].iloc[i]) if "created_at" in df.columns else None,
        )
        for i in range(len(texts))
    ]

    return AnalysisResponse(
        total=total,
        counts=SentimentCounts(**counts),
        ratio=ratio,
        results=results,
    )


@router.get("/health")
def health():
    return {"status": "ok"}