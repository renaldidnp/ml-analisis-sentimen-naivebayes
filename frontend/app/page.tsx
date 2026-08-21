"use client";

import { useRef, useState } from "react";
import AnnotatedSample from "@/components/AnnotatedSample";
import ResultSummary from "@/components/ResultSummary";
import SentimentChart from "@/components/SentimentChart";
import TweetTable from "@/components/TweetTable";
import PhaseUploadWizard from "@/components/PhaseUploadWizard";
import TemporalDashboard from "@/components/TemporalDashboard";
import { FASE_LIST, type AnalysisResult, type FaseKey } from "@/lib/api";

const steps = [
  { n: "01", title: "Unggah File", body: "Format CSV atau XLSX dengan kolom berisi teks tweet. Parsing otomatis secara instan." },
  { n: "02", title: "Pemrosesan NLP", body: "Pembersihan noise teks, ekstraksi kata kunci, dan klasifikasi model sentimen." },
  { n: "03", title: "Dashboard Analitik", body: "Visualisasi distribusi sentimen, tren waktu, dan tabel data terperinci." },
];

const csvColumns = [
  { name: "Tweet", required: true, note: "Kolom Teks Utama Yang Dianalisis" },
  { name: "created_at", required: false, note: "Timestamp untuk agregasi tren temporal" },
  { name: "username", required: false, note: "Atribut identitas akun (opsional)" },
];

const features = ["CSV / XLSX Support", "Pemrosesan Real-time", "Ekspor Visualisasi"];

const initialResults: Record<FaseKey, AnalysisResult | null> = {
  pra: null,
  awal: null,
  pasca: null,
};

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-emerald-600">
      <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [results, setResults] = useState<Record<FaseKey, AnalysisResult | null>>(initialResults);
  const [activeFase, setActiveFase] = useState<FaseKey | null>(null);
  const [semuaSelesai, setSemuaSelesai] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handlePhaseAnalyzed = (fase: FaseKey, r: AnalysisResult) => {
    setResults((prev) => ({ ...prev, [fase]: r }));
    setActiveFase(fase);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const faseSelesai = FASE_LIST.filter((f) => results[f.key] !== null);
  const activeResult = activeFase ? results[activeFase] : null;

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#FBF9F5]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 sm:px-8">
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 font-mono text-xs font-bold text-white shadow-sm transition-transform group-hover:scale-105">R</span>
          </a>

          <nav className="hidden items-center gap-6 font-mono text-xs uppercase tracking-wider text-stone-600 sm:flex">
            <a href="#cara-kerja" className="transition-colors hover:text-stone-900">
              Cara Kerja
            </a>
            <a href="#format" className="transition-colors hover:text-stone-900">
              Format Data
            </a>
          </nav>

          <a href="#unggah" className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2 font-sans text-xs font-semibold text-white shadow-sm hover:bg-stone-800 transition-all active:scale-[0.98]">
            Mulai Analisis
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section id="unggah" className="border-b border-stone-200/60 bg-gradient-to-b from-transparent to-stone-100/40">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-24 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1 font-mono text-[11px] text-stone-600 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Engine Analisis Sentimen v2.0
            </div>

            <h1 className="mt-5 font-sans text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-[2.75rem] lg:leading-[1.15]">
              Bedah opini publik seputar <br className="hidden sm:inline" />
              <span className="font-serif italic font-normal text-amber-700">"Makan Bergizi Gratis"</span> secara ilmiah.
            </h1>

            <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-stone-600">Transformasikan ribuan baris percakapan tidak terstruktur menjadi data kuantitatif. Klasifikasi cepat, akurat, dan siap dianalisis.</p>

            <div className="mt-6 flex flex-wrap gap-4 border-y border-stone-200/60 py-3.5">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-2 font-mono text-xs text-stone-600">
                  <CheckIcon />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <PhaseUploadWizard onAllDone={() => setSemuaSelesai(true)} onPhaseAnalyzed={handlePhaseAnalyzed} />
            </div>
          </div>

          <div className="mt-12 lg:mt-0 lg:col-span-5">
            <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/5">
              <AnnotatedSample />
            </div>
          </div>
        </div>
      </section>

      {/* Analisis Temporal (Conditional) */}
      {semuaSelesai && (
        <section className="border-b border-stone-200/80 bg-stone-100/30">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
            <div className="mb-6">
              <p className="eyebrow">Visualisasi Tren</p>
              <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight text-stone-900">Pergeseran Sentimen Lintas Fase</h2>
            </div>
            <TemporalDashboard />
          </div>
        </section>
      )}

      {/* Result Section */}
      {activeResult && activeFase && (
        <section ref={resultRef} className="scroll-mt-12 border-b border-stone-200/80 bg-stone-50/50">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
              <div>
                <p className="eyebrow">Ringkasan Hasil</p>
                <h2 className="mt-1 font-sans text-2xl font-bold text-stone-900">{activeResult.total.toLocaleString("id-ID")} Data Tweet Terproses</h2>
              </div>
              <button type="button" onClick={() => setActiveFase(null)} className="rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 font-mono text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50">
                Tutup Ringkasan
              </button>
            </div>

            {faseSelesai.length > 1 && (
              <div className="mb-6 flex gap-2">
                {faseSelesai.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveFase(key)}
                    className={`rounded-lg px-3.5 py-1.5 font-mono text-xs transition-all ${activeFase === key ? "bg-stone-900 text-white shadow-sm" : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <ResultSummary total={activeResult.total} counts={activeResult.counts} ratio={activeResult.ratio} />
              </div>
              <div className="lg:col-span-7">
                <SentimentChart counts={activeResult.counts} />
              </div>
            </div>

            <div className="mt-10">
              <p className="eyebrow mb-3">Tabel Eksplorasi Data</p>
              <TweetTable results={activeResult.results} />
            </div>
          </div>
        </section>
      )}

      {/* Cara Kerja */}
      <section id="cara-kerja" className="border-b border-stone-200/80 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <p className="eyebrow">Sistem Kerja</p>
          <h2 className="mt-1 font-sans text-2xl font-bold text-stone-900 sm:text-3xl">Tiga Langkah Pengolahan Data</h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-xl border border-stone-200/80 bg-[#FBF9F5]/50 p-6">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded">Langkah {s.n}</span>
                <h3 className="mt-4 font-sans text-lg font-bold text-stone-900">{s.title}</h3>
                <p className="mt-2 font-sans text-sm text-stone-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Format File */}
      <section id="format" className="py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4">
              <p className="eyebrow">Spesifikasi Input</p>
              <h2 className="mt-1 font-sans text-2xl font-bold text-stone-900">Format Kolom File</h2>
              <p className="mt-3 font-sans text-sm text-stone-600 leading-relaxed">Sistem secara cerdas mendeteksi variasi nama kolom secara fleksibel. Pastikan file Anda memenuhi kriteria minimal berikut.</p>
            </div>

            <div className="lg:col-span-8">
              <div className="card-surface overflow-hidden">
                <table className="w-full text-left font-sans text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 font-mono text-[11px] uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nama Kolom</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Fungsi Dalam Sistem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200/60 font-sans">
                    {csvColumns.map((c) => (
                      <tr key={c.name} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-stone-900">{c.name}</td>
                        <td className="px-6 py-4">{c.required ? <span className="tag-chip tag-chip--negative">Wajib</span> : <span className="tag-chip tag-chip--neutral">Opsional</span>}</td>
                        <td className="px-6 py-4 text-stone-600 text-xs sm:text-sm">{c.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-stone-900 font-mono text-[10px] font-bold text-white">R</span>
          </div>
          <p className="font-mono text-xs text-stone-500">© {new Date().getFullYear()} Teroptimasi untuk Bahasa Indonesia.</p>
        </div>
      </footer>
    </main>
  );
}
