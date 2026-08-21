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
  { n: "01", title: "Unggah", body: "Tarik file CSV atau XLSX berisi kolom Tweet ke kotak unggah, atau pilih dari perangkatmu." },
  { n: "02", title: "Diproses", body: "Teks dibersihkan lalu diklasifikasikan sebagai positif, negatif, atau netral." },
  { n: "03", title: "Lihat hasil", body: "Ringkasan distribusi sentimen, grafik, dan tabel per-tweet muncul di halaman yang sama." },
];

const csvColumns = [
  { name: "Tweet", required: true, note: "isi teks tweet yang dianalisis" },
  { name: "created_at", required: false, note: "tanggal, untuk tren dari waktu ke waktu" },
  { name: "username", required: false, note: "ditampilkan di tabel hasil" },
];

const features = ["CSV & XLSX", "Klasifikasi otomatis", "Grafik & tabel siap pakai"];

const initialResults: Record<FaseKey, AnalysisResult | null> = {
  pra: null,
  awal: null,
  pasca: null,
};

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-sage">
      <path d="M2 6.2l2.6 2.6L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
    <main>
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
          <a href="#" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-display text-sm text-paper">R</span>
            <span className="font-display text-lg tracking-tight text-ink">Rasa</span>
          </a>
          <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-wide text-muted sm:flex">
            <a href="#cara-kerja" className="transition-colors hover:text-ink">
              Cara kerja
            </a>
            <a href="#format" className="transition-colors hover:text-ink">
              Format file
            </a>
          </nav>
          <a href="#unggah" className="rounded-full bg-ink px-4 py-2 font-sans text-sm text-paper transition-transform duration-200 hover:scale-[1.04]">
            Mulai analisis
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="unggah" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-16 right-[-4rem] h-72 w-72 rounded-full bg-turmeric/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 sm:px-10 sm:pb-28 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="motion-safe:animate-rise-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" />
              Analisis sentimen otomatis
            </span>

            <h1 className="mt-6 font-display text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-[3.4rem]">
              Ribuan cuitan soal <span className="text-turmeric-deep">Makan Bergizi Gratis.</span> Satu jawaban jelas.
            </h1>

            <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-muted">
              Unggah data tweet dalam format CSV atau XLSX, dan lihat bagaimana publik benar-benar merespons — positif, negatif, atau netral — dalam hitungan detik.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 font-mono text-xs text-muted">
                  <CheckIcon /> {f}
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <PhaseUploadWizard onAllDone={() => setSemuaSelesai(true)} onPhaseAnalyzed={handlePhaseAnalyzed} />
            </div>
          </div>

          <div className="motion-safe:animate-rise-in lg:[animation-delay:150ms]">
            <AnnotatedSample />
          </div>
        </div>
      </section>

      {/* Analisis temporal */}
      {semuaSelesai && (
        <section className="bg-paper-deep/40">
          <div className="section-divider" />
          <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
            <p className="eyebrow mb-2">Analisis temporal</p>
            <h2 className="mb-8 font-display text-2xl text-ink sm:text-3xl">Perubahan sentimen sepanjang tiga fase kebijakan</h2>
            <TemporalDashboard />
          </div>
        </section>
      )}

      {/* Hasil analisis per fase */}
      {activeResult && activeFase && (
        <section ref={resultRef} className="scroll-mt-6 bg-paper-deep/40">
          <div className="section-divider" />
          <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Hasil analisis</p>
                <h2 className="font-display text-2xl text-ink sm:text-3xl">{activeResult.total} tweet sudah diberi label.</h2>
              </div>
              <button type="button" onClick={() => setActiveFase(null)} className="rounded-full border border-ink/15 px-4 py-1.5 font-mono text-xs text-muted transition-colors hover:border-ink/30 hover:text-ink">
                Tutup hasil
              </button>
            </div>

            {faseSelesai.length > 1 && (
              <div className="mb-8 flex gap-2">
                {faseSelesai.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveFase(key)}
                    className={`rounded-full px-4 py-1.5 font-mono text-xs transition-colors ${activeFase === key ? "bg-ink text-paper" : "border border-ink/15 text-muted hover:border-ink/30 hover:text-ink"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-8">
              <ResultSummary total={activeResult.total} counts={activeResult.counts} ratio={activeResult.ratio} />
            </div>

            <div className="mb-8">
              <SentimentChart counts={activeResult.counts} />
            </div>

            <div>
              <p className="eyebrow mb-4">Rincian per tweet</p>
              <TweetTable results={activeResult.results} />
            </div>
          </div>
        </section>
      )}

      {/* Cara kerja — timeline, bukan grid polos */}
      <section id="cara-kerja" className="bg-paper-deep/50">
        <div className="section-divider" />
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
          <p className="eyebrow mb-3">Cara kerja</p>
          <h2 className="mb-14 max-w-lg font-display text-2xl text-ink sm:text-3xl">Tiga langkah dari file mentah ke kesimpulan.</h2>

          <div className="relative grid gap-10 sm:grid-cols-3 sm:gap-8">
            <div aria-hidden className="absolute left-5 right-5 top-5 hidden h-px bg-ink/10 sm:block" />
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-paper-deep font-mono text-sm text-turmeric-deep">{s.n}</span>
                <h3 className="mt-4 font-display text-xl text-ink">{s.title}</h3>
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

          <div className="card-surface overflow-hidden">
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
                  <tr key={c.name} className="border-b border-ink/5 transition-colors last:border-0 hover:bg-ink/[0.03]">
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
      <footer className="bg-paper-deep/30">
        <div className="section-divider" />
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <a href="#" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-xs text-paper">R</span>
            <span className="font-display text-lg text-ink">Rasa</span>
          </a>
          <p className="font-mono text-[11px] text-muted">Dibangun untuk analisis sentimen data tweet berbahasa Indonesia</p>
        </div>
      </footer>
    </main>
  );
}
