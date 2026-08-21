"use client";

import { useRef, useState } from "react";
import AnnotatedSample from "@/components/AnnotatedSample";
import UploadDropzone from "@/components/UploadDropzone";
import ResultSummary from "@/components/ResultSummary";
import SentimentChart from "@/components/SentimentChart";
import TweetTable from "@/components/TweetTable";
import PhaseUploadWizard from "@/components/PhaseUploadWizard";
import TemporalDashboard from "@/components/TemporalDashboard";
import type { AnalysisResult, FaseKey } from "@/lib/api";

const steps = [
  {
    n: "01",
    title: "Unggah",
    body: "Tarik file CSV atau XLSX berisi kolom Tweet ke kotak unggah, atau pilih dari perangkatmu.",
  },
  {
    n: "02",
    title: "Diproses",
    body: "Teks dibersihkan lalu diklasifikasikan sebagai positif, negatif, atau netral.",
  },
  {
    n: "03",
    title: "Lihat hasil",
    body: "Ringkasan distribusi sentimen, grafik, dan tabel per-tweet muncul di halaman yang sama.",
  },
];

const csvColumns = [
  { name: "Tweet", required: true, note: "isi teks tweet yang dianalisis" },
  { name: "created_at", required: false, note: "tanggal, untuk tren dari waktu ke waktu" },
  { name: "username", required: false, note: "ditampilkan di tabel hasil" },
];

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [semuaSelesai, setSemuaSelesai] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handlePhaseAnalyzed = (fase: FaseKey, r: AnalysisResult) => {
    setResult(r); // atau gabungkan dengan hasil fase lain kalau perlu total keseluruhan
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <main>
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-display text-xl tracking-tight text-ink">Rasa</span>
        <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-wide text-muted sm:flex">
          <a href="#cara-kerja" className="hover:text-ink">
            Cara kerja
          </a>
          <a href="#format" className="hover:text-ink">
            Format CSV
          </a>
        </nav>
        <a href="#unggah" className="rounded-full border border-ink/15 px-4 py-1.5 font-sans text-sm text-ink hover:border-ink/30">
          Mulai
        </a>
      </header>

      {/* Hero */}
      <section id="unggah" className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-8 sm:px-10 sm:pb-28 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="motion-safe:animate-rise-in">
          <p className="eyebrow mb-4">Analisis sentimen dari data tweet</p>
          <h1 className="font-display text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-[3.4rem]">
            Ribuan cuitan soal <span className="text-turmeric-deep">Makan Bergizi Gratis.</span> Satu jawaban jelas.
          </h1>
          <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-muted">Unggah data tweet dalam format CSV atau XLSX, dan lihat bagaimana publik benar-benar merespons — positif, negatif, atau netral — dalam hitungan detik.</p>

          <div className="mt-10">
            <PhaseUploadWizard onAllDone={() => setSemuaSelesai(true)} onPhaseAnalyzed={handlePhaseAnalyzed} />
          </div>
        </div>

        <div className="motion-safe:animate-rise-in lg:[animation-delay:150ms]">
          <AnnotatedSample />
        </div>
      </section>

      {/* Analisis temporal */}
      {semuaSelesai && (
        <section className="border-t border-ink/10 bg-paper-deep/40">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
            <p className="eyebrow mb-2">Analisis temporal</p>
            <h2 className="mb-8 font-display text-2xl text-ink sm:text-3xl">Perubahan sentimen sepanjang tiga fase kebijakan</h2>
            <TemporalDashboard />
          </div>
        </section>
      )}

      {/* Hasil analisis - tampil di halaman yang sama, tanpa pindah route */}
      {result && (
        <section ref={resultRef} className="border-t border-ink/10 bg-paper-deep/40 scroll-mt-6">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Hasil analisis</p>
                <h2 className="font-display text-2xl text-ink sm:text-3xl">{result.total} tweet sudah diberi label.</h2>
              </div>
              <button type="button" onClick={() => setResult(null)} className="rounded-full border border-ink/15 px-4 py-1.5 font-mono text-xs text-muted hover:border-ink/30 hover:text-ink">
                Tutup hasil
              </button>
            </div>

            <div className="mb-8">
              <ResultSummary total={result.total} counts={result.counts} ratio={result.ratio} />
            </div>

            <div className="mb-8">
              <SentimentChart counts={result.counts} />
            </div>

            <div>
              <p className="eyebrow mb-4">Rincian per tweet</p>
              <TweetTable results={result.results} />
            </div>
          </div>
        </section>
      )}

      {/* Cara kerja */}
      <section id="cara-kerja" className="border-t border-ink/10 bg-paper-deep/60">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
          <p className="eyebrow mb-3">Cara kerja</p>
          <h2 className="mb-12 max-w-lg font-display text-2xl text-ink sm:text-3xl">Tiga langkah dari file mentah ke kesimpulan.</h2>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((s) => (
              <div key={s.n}>
                <span className="font-mono text-sm text-turmeric-deep">{s.n}</span>
                <h3 className="mt-3 font-display text-xl text-ink">{s.title}</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Format CSV */}
      <section id="format" className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <p className="eyebrow mb-3">Format file</p>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">Kolom yang dikenali.</h2>
            <p className="mt-4 font-sans text-sm leading-relaxed text-muted">File bisa berupa CSV atau XLSX. Cukup satu kolom teks yang wajib ada. Kolom lain sifatnya opsional dan akan dipakai untuk memperkaya tampilan hasil.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/50">
            <table className="w-full text-left font-mono text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Kolom</th>
                  <th className="px-5 py-3 font-medium">Wajib</th>
                  <th className="px-5 py-3 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {csvColumns.map((c) => (
                  <tr key={c.name} className="border-b border-ink/5 last:border-0">
                    <td className="px-5 py-3 text-ink">{c.name}</td>
                    <td className="px-5 py-3">{c.required ? <span className="tag-chip tag-chip--negative">ya</span> : <span className="text-muted">tidak</span>}</td>
                    <td className="px-5 py-3 font-sans text-muted">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center sm:px-10">
          <span className="font-display text-lg text-ink">Rasa</span>
          <p className="font-mono text-[11px] text-muted">dibangun untuk analisis sentimen data tweet berbahasa Indonesia</p>
        </div>
      </footer>
    </main>
  );
}
