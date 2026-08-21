"""
Endpoint analisis temporal untuk BAB 4.7 skripsi:
  4.7.1 Distribusi Sentimen Bulanan
  4.7.2 Pola Perubahan Sentimen Antar Tiga Fase Kebijakan
  4.7.3 Korelasi Perubahan Sentimen dengan Peristiwa Aktual (opsional, manual)

Membaca hasil yang sudah disimpan oleh POST /api/analyze (satu file
parquet per fase di storage/results/), bukan menghitung ulang dari nol.
Upload data lewat /api/analyze dulu untuk ketiga fase sebelum endpoint
di sini bisa memberi hasil.
"""

from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.core.config import settings

router = APIRouter()

RESULTS_DIR = Path(settings.MODEL_DIR).parent / "storage" / "results"

ORDER_FASE = ["pra", "awal", "pasca"]
FASE_LABEL = {
    "pra": "Pra-pencanangan",
    "awal": "Peluncuran awal",
    "pasca": "Pasca-peluncuran",
}


def _load_semua_fase() -> pd.DataFrame:
    frames = []
    fase_tersedia = []
    for fase in ORDER_FASE:
        path = RESULTS_DIR / f"{fase}.parquet"
        if path.exists():
            frames.append(pd.read_parquet(path))
            fase_tersedia.append(fase)

    if not frames:
        raise HTTPException(
            status_code=404,
            detail=(
                "Belum ada data hasil analisis. Upload data untuk ketiga fase "
                "(pra, awal, pasca) lewat POST /api/analyze terlebih dahulu."
            ),
        )

    fase_hilang = [f for f in ORDER_FASE if f not in fase_tersedia]
    if fase_hilang:
        nama_hilang = ", ".join(FASE_LABEL[f] for f in fase_hilang)
        print(
            f"[temporal] Peringatan: fase belum diupload: {nama_hilang}. "
            "Hasil di bawah cuma mencakup fase yang sudah ada."
        )

    return pd.concat(frames, ignore_index=True)


def _tabel_distribusi(df: pd.DataFrame, kolom_grup: str) -> pd.DataFrame:
    tabel = (
        df.groupby(kolom_grup)["label"]
        .value_counts(normalize=True)
        .unstack(fill_value=0)
        .reindex(columns=["Positif", "Negatif", "Netral"], fill_value=0)
        * 100
    )
    tabel["jumlah"] = df.groupby(kolom_grup).size()
    return tabel


@router.get("/temporal/status")
def status_data_temporal():
    """Cek fase mana saja yang sudah punya data, untuk ditampilkan di
    frontend sebelum user membuka halaman chart temporal."""
    status = {}
    for fase in ORDER_FASE:
        path = RESULTS_DIR / f"{fase}.parquet"
        if path.exists():
            df = pd.read_parquet(path)
            status[fase] = {
                "label": FASE_LABEL[fase],
                "tersedia": True,
                "jumlah_data": len(df),
                "jumlah_bertanggal": int(df["tanggal"].notna().sum()),
            }
        else:
            status[fase] = {
                "label": FASE_LABEL[fase],
                "tersedia": False,
                "jumlah_data": 0,
                "jumlah_bertanggal": 0,
            }
    return status


@router.get("/temporal/per-fase")
def distribusi_per_fase():
    """4.7.2 - Pola sentimen antar 3 fase kebijakan (untuk bar chart)."""
    data = _load_semua_fase()
    data["fase_label"] = data["fase"].map(FASE_LABEL)

    tabel = _tabel_distribusi(data, "fase_label")
    urutan = [FASE_LABEL[f] for f in ORDER_FASE if FASE_LABEL[f] in tabel.index]
    tabel = tabel.reindex(urutan)

    return {
        "fase": list(tabel.index),
        "positif": tabel["Positif"].round(2).tolist(),
        "negatif": tabel["Negatif"].round(2).tolist(),
        "netral": tabel["Netral"].round(2).tolist(),
        "jumlah_data": tabel["jumlah"].astype(int).tolist(),
    }


@router.get("/temporal/per-bulan")
def distribusi_per_bulan():
    """4.7.1 - Distribusi sentimen bulanan (untuk line chart tren)."""
    data = _load_semua_fase()
    data_valid = data.dropna(subset=["tanggal"]).copy()

    if data_valid.empty:
        raise HTTPException(
            status_code=422,
            detail=(
                "Tidak ada baris dengan tanggal valid di data yang tersimpan. "
                "Pastikan kolom tanggal terisi & bisa di-parse saat upload lewat /api/analyze."
            ),
        )

    data_valid["bulan"] = data_valid["tanggal"].dt.to_period("M")
    tabel = _tabel_distribusi(data_valid, "bulan").sort_index()

    return {
        "bulan": [str(p) for p in tabel.index],
        "positif": tabel["Positif"].round(2).tolist(),
        "negatif": tabel["Negatif"].round(2).tolist(),
        "netral": tabel["Netral"].round(2).tolist(),
        "jumlah_data": tabel["jumlah"].astype(int).tolist(),
    }


@router.get("/temporal/ringkasan")
def ringkasan_narasi():
    """Angka kunci siap pakai untuk narasi 4.7.1-4.7.2, mis. bulan dengan
    lonjakan sentimen negatif tertajam, atau fase dengan negatif tertinggi."""
    data = _load_semua_fase()
    data_valid = data.dropna(subset=["tanggal"]).copy()

    hasil = {}

    if not data_valid.empty:
        data_valid["bulan"] = data_valid["tanggal"].dt.to_period("M")
        tabel_bulan = _tabel_distribusi(data_valid, "bulan").sort_index()
        hasil["bulan_negatif_tertinggi"] = str(tabel_bulan["Negatif"].idxmax())
        hasil["nilai_negatif_tertinggi"] = round(tabel_bulan["Negatif"].max(), 2)
        hasil["bulan_positif_tertinggi"] = str(tabel_bulan["Positif"].idxmax())
        hasil["nilai_positif_tertinggi"] = round(tabel_bulan["Positif"].max(), 2)

    data["fase_label"] = data["fase"].map(FASE_LABEL)
    tabel_fase = _tabel_distribusi(data, "fase_label")
    urutan = [FASE_LABEL[f] for f in ORDER_FASE if FASE_LABEL[f] in tabel_fase.index]
    tabel_fase = tabel_fase.reindex(urutan)

    if len(tabel_fase) >= 2:
        selisih_negatif = tabel_fase["Negatif"].iloc[-1] - tabel_fase["Negatif"].iloc[0]
        hasil["perubahan_negatif_pra_ke_pasca"] = round(selisih_negatif, 2)

    hasil["distribusi_per_fase"] = tabel_fase.round(2).to_dict(orient="index")

    return hasil
