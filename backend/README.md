# Rasa — Backend

FastAPI service yang menerima CSV, memproses teks (Sastrawi + kamus alay +
protected terms), lalu memprediksi sentimen pakai model `.pkl` hasil
training di Colab.

## Menjalankan

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
copy .env.example .env          # Windows, atau: cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

Cek di browser: http://127.0.0.1:8000/api/health → `{"status": "ok"}`

Dokumentasi interaktif (Swagger): http://127.0.0.1:8000/docs

## Model

Folder `ml/` sudah diisi **model dummy** (`tfidf.pkl` + `naive_bayes.pkl`)
hasil dari `ml/train_dummy_model.py`, supaya endpoint bisa langsung dites
tanpa nunggu model asli. **Ganti dua file ini** dengan hasil export dari
notebook Colab kamu:

```python
import joblib
joblib.dump(vectorizer, "tfidf.pkl")
joblib.dump(classifier, "naive_bayes.pkl")
```

Kalau butuh model dummy lagi kapan-kapan: `python ml/train_dummy_model.py`

### Kamus alay & protected terms

- `app/services/preprocessing.py` akan otomatis baca `ml/kamus_alay.csv`
  (kolom: `slang,formal`) kalau file itu ada — taruh file kamus alay kamu
  di situ. Kalau belum ada, normalisasi alay dilewati (tidak error).
- Istilah yang tidak boleh di-normalisasi/stopword/stem (seperti `mbg`)
  ada di `PROTECTED_TERMS` di file yang sama — tambah sesuai kebutuhan.

## Endpoint

`POST /api/analyze`
- Body: `multipart/form-data`, field `file` (CSV), opsional field
  `text_column` (default: `full_text`, bisa diubah lewat `.env`)
- Sukses (200): ringkasan jumlah & rasio sentimen + daftar hasil per baris
- Kolom teks tidak ditemukan (400)
- File bukan `.csv` atau lebih besar dari `MAX_UPLOAD_MB` (400)
- Model belum ada di `ml/` (503)

## Menyambungkan ke frontend

Di `frontend/components/UploadDropzone.tsx`, ganti fungsi
`submitForAnalysis()` (yang sekarang cuma simulasi delay) dengan:

```ts
async function submitForAnalysis(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://127.0.0.1:8000/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Gagal memproses file");
  }

  return res.json(); // { total, counts, ratio, results }
}
```

CORS sudah diatur untuk menerima request dari `http://localhost:3000`
(bisa diubah lewat `CORS_ORIGINS` di `.env`, pisahkan dengan koma kalau
lebih dari satu origin).

## Struktur

```
app/
  main.py                # entrypoint FastAPI + CORS
  core/config.py          # baca .env
  api/analyze.py          # endpoint POST /api/analyze
  services/
    preprocessing.py      # cleaning, kamus alay, stopword, stemming
    predictor.py           # load tfidf.pkl + naive_bayes.pkl, predict
  schemas/analysis.py      # response models
  utils/csv_handler.py     # baca & validasi CSV upload
ml/
  tfidf.pkl / naive_bayes.pkl   # model (ganti dengan hasil Colab)
  train_dummy_model.py          # generator model placeholder
storage/uploads/           # (kosong, disiapkan untuk penyimpanan sementara)
```
