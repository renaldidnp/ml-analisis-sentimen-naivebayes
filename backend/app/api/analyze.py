from pathlib import Path
from typing import Literal

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.schemas.analysis import AnalysisResponse, SentimentCounts, TweetResult
from app.services.predictor import ModelNotReadyError, predictor
from app.services.preprocessing import preprocess_batch
from app.utils.file_handler import read_tabular_upload

router = APIRouter()

ALLOWED_EXTENSIONS = (".csv", ".xlsx")

FASE_VALUES = ("pra", "awal", "pasca")
FASE_LABEL = {
    "pra": "Pra-peluncuran",
    "awal": "Peluncuran awal",
    "pasca": "Pasca-peluncuran",
}

# Folder tempat hasil analisis tiap fase disimpan (dipakai endpoint temporal).
RESULTS_DIR = Path(settings.MODEL_DIR).parent / "storage" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def _simpan_hasil_fase(df: pd.DataFrame, fase: str) -> None:
    """Simpan hasil analisis satu fase ke parquet, TIMPA hasil lama untuk
    fase yang sama (supaya re-upload/re-analisis fase yang sama tidak
    menumpuk duplikat)."""
    path = RESULTS_DIR / f"{fase}.parquet"
    df.to_parquet(path, index=False)


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    fase: Literal["pra", "awal", "pasca"] = Form(...),
    text_column: str | None = Form(default=None),
    date_column: str | None = Form(default="created_at"),
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
            created_at=str(df[date_column].iloc[i]) if date_column in df.columns else None,
        )
        for i in range(len(texts))
    ]

    # --- Simpan untuk analisis temporal (4.7) ---
    # Parsing tanggal: kalau kolom tanggal tidak ada / gagal parse semua,
    # tetap simpan hasilnya (supaya distribusi per-fase 4.6 tidak hilang),
    # tapi tabel bulanan (4.7.1) otomatis akan skip baris tanpa tanggal valid.
    df_simpan = pd.DataFrame({
        "text": texts,
        "label": labels,
        "fase": fase,
        "fase_label": FASE_LABEL[fase],
    })
    if date_column in df.columns:
        df_simpan["tanggal"] = pd.to_datetime(df[date_column], errors="coerce")
    else:
        df_simpan["tanggal"] = pd.NaT

    n_tanpa_tanggal = df_simpan["tanggal"].isna().sum()
    if n_tanpa_tanggal > 0:
        print(
            f"[analyze] Peringatan: {n_tanpa_tanggal}/{total} baris di fase '{fase}' "
            f"tidak punya tanggal valid dari kolom '{date_column}' -- baris ini akan "
            f"dilewati saat agregasi bulanan (4.7.1), tapi tetap dihitung di distribusi per-fase."
        )

    _simpan_hasil_fase(df_simpan, fase)

    return AnalysisResponse(
        total=total,
        counts=SentimentCounts(**counts),
        ratio=ratio,
        results=results,
    )


@router.get("/health")
def health():
    return {"status": "ok"}
