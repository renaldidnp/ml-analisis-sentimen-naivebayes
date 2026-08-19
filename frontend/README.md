# Rasa — Frontend

Landing page + upload CSV untuk analisis sentimen tweet. Next.js 14 (App Router) + TypeScript + Tailwind CSS.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Struktur

```
app/
  layout.tsx      # font (Fraunces, Inter, IBM Plex Mono) + metadata
  page.tsx         # landing page: hero, cara kerja, format CSV, footer
  globals.css      # design tokens & base styles
components/
  UploadDropzone.tsx    # drag & drop CSV, validasi, tombol analisis
  AnnotatedSample.tsx   # contoh tweet dengan tag sentimen animasi
```

## Yang masih perlu disambungkan

`components/UploadDropzone.tsx` punya fungsi `submitForAnalysis()` yang saat
ini cuma simulasi delay 1.4 detik (lihat komentar `TODO(backend)`). Saat
backend FastAPI sudah siap, ganti isi fungsi ini dengan `fetch` ke
`/api/analyze`, lalu redirect ke halaman hasil setelah dapat respons.

## Palet & tipografi

- `ink` `#191F1B` — teks utama
- `paper` `#F2EEE1` / `paper-deep` `#E7E1CD` — latar
- `turmeric` `#D69A2D` — aksen utama
- `sage` `#587A52` — sentimen positif
- `brick` `#A44432` — sentimen negatif
- Display: Fraunces · Body: Inter · Data/mono: IBM Plex Mono
