"""
Endpoint debug untuk membandingkan hasil preprocessing backend vs Colab.

Cara pakai:
  1. POST /api/preprocess-debug dengan file (.csv/.xlsx) yang SAMA dengan
     yang Anda proses di Colab, atau
  2. POST /api/preprocess-debug/text dengan teks tunggal untuk cek cepat.

Response berisi tiap tahap (case_folding, cleansing, tokenisasi,
normalisasi, stopword, stemming, hasil_preprocessing) dengan nama kolom
yang SAMA dengan file 'Hasil Preprocessing *.xlsx' dari Colab, supaya bisa
dibandingkan berdampingan / di-diff langsung.

TIDAK untuk produksi — endpoint ini hanya untuk tahap validasi/debug
sebelum model dari Colab dipasang. Pertimbangkan untuk dihapus atau
dilindungi (mis. hanya aktif kalau settings.DEBUG=True) sebelum deploy.
"""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.services.preprocessing import preprocess_batch_debug, preprocess_debug
from app.utils.file_handler import read_tabular_upload

router = APIRouter()

ALLOWED_EXTENSIONS = (".csv", ".xlsx")


class TextDebugRequest(BaseModel):
    text: str


@router.post("/preprocess-debug/text")
def preprocess_debug_text(payload: TextDebugRequest):
    """Cek cepat satu kalimat. Cocok untuk copy-paste satu baris dari
    Colab dan lihat apakah tiap tahap menghasilkan output yang sama."""
    return preprocess_debug(payload.text)


@router.post("/preprocess-debug")
async def preprocess_debug_file(
    file: UploadFile = File(...),
    text_column: str | None = Form(default=None),
    limit: int = Form(default=50),
):
    """Jalankan preprocessing tahap-demi-tahap ke file yang sama dengan
    yang Anda pakai di Colab. `limit` membatasi jumlah baris yang
    diproses (default 50) supaya response tidak terlalu besar saat
    dites lewat browser/Postman -- naikkan sesuai kebutuhan.
    """
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

    texts = df[column].astype(str).tolist()[:limit]
    results = preprocess_batch_debug(texts)

    return {
        "total_diproses": len(results),
        "total_baris_di_file": len(df),
        "rows": results,
    }