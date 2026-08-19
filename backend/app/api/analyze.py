import io
import logging
import traceback

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.schemas.analysis import AnalysisResponse, SentimentCounts, TweetResult
from app.services.predictor import ModelNotReadyError, predictor
from app.services.preprocessing import preprocess_batch
from app.utils.csv_handler import read_csv_upload

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    text_column: str | None = Form(default=None),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File tidak valid")

    filename = file.filename.lower()
    allowed_extensions = (".csv", ".xlsx", ".xls")

    if not filename.endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="File harus berformat .csv, .xlsx, atau .xls",
        )

    raw = await file.read()

    # Validasi ukuran file
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Ukuran file melebihi batas maksimum {settings.max_upload_mb} MB",
        )

    # Membaca DataFrame
    try:
        if filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(raw))
        else:
            df = read_csv_upload(raw, settings.max_upload_mb)
    except Exception as e:
        logger.error("Gagal membaca file upload: %s", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=400,
            detail=f"Gagal membaca isi file: {str(e)}",
        ) from e

    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="File kosong atau tidak berisi data")

    # 1. Bersihkan nama kolom dari spasi/BOM UTF-8
    df.columns = df.columns.astype(str).str.strip().str.replace("\ufeff", "")

    # 2. Cari kolom teks (Gunakan parameter -> settings -> alternatif otomatis)
    column = text_column or settings.text_column
    if column not in df.columns:
        # Pengecekan otomatis untuk nama kolom alternatif yang umum
        candidates = ["full_text", "text", "tweet", "cuitan", "content", "isi"]
        matched_col = next((c for c in candidates if c in df.columns), None)

        if matched_col:
            column = matched_col
        else:
            available = ", ".join(f"'{c}'" for c in df.columns)
            raise HTTPException(
                status_code=400,
                detail=f"Kolom '{column}' tidak ditemukan. Kolom yang ada dalam file: [{available}]",
            )

    df = df.dropna(subset=[column]).reset_index(drop=True)
    if df.empty:
        raise HTTPException(
            status_code=400, detail="Tidak ada baris dengan teks yang valid di file ini"
        )

    texts = df[column].astype(str).tolist()

    try:
        cleaned = preprocess_batch(texts)
    except Exception as e:
        logger.error("Gagal saat preprocessing teks: %s", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Gagal memproses teks: {str(e)}"
        ) from e

    try:
        labels = predictor.predict(cleaned)
    except ModelNotReadyError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        # Ini akan menangkap error apapun dari model (mismatch shape, tipe data, dsb)
        # yang sebelumnya lolos jadi 500 tanpa pesan jelas.
        logger.error("Gagal saat prediksi model: %s", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Gagal memproses prediksi: {str(e)}"
        ) from e

    if len(labels) != len(texts):
        logger.error(
            "Jumlah label (%d) tidak sama dengan jumlah teks (%d)",
            len(labels), len(texts),
        )
        raise HTTPException(
            status_code=500,
            detail="Hasil prediksi tidak sesuai dengan jumlah data input",
        )

    counts = {"positif": 0, "negatif": 0, "netral": 0}
    for label in labels:
        key = str(label).lower()
        if key in counts:
            counts[key] += 1

    total = len(labels)
    ratio = {k: round(v / total, 4) if total else 0.0 for k, v in counts.items()}

    # Cari nama kolom username & created_at secara fleksibel
    user_col = next((c for c in ["username", "user", "screen_name"] if c in df.columns), None)
    date_col = next((c for c in ["created_at", "date", "tanggal"] if c in df.columns), None)

    try:
        results = [
            TweetResult(
                text=texts[i],
                label=labels[i],
                username=str(df[user_col].iloc[i]) if user_col and pd.notna(df[user_col].iloc[i]) else None,
                created_at=str(df[date_col].iloc[i]) if date_col and pd.notna(df[date_col].iloc[i]) else None,
            )
            for i in range(len(texts))
        ]
    except Exception as e:
        # Paling sering terjadi kalau label dari model tidak cocok
        # dengan tipe/Literal/Enum yang didefinisikan di schema TweetResult.
        logger.error("Gagal membentuk TweetResult: %s", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Gagal membentuk hasil: {str(e)}"
        ) from e

    return AnalysisResponse(
        total=total,
        counts=SentimentCounts(**counts),
        ratio=ratio,
        results=results,
    )


@router.get("/health")
def health():
    return {"status": "ok"}