"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnalysisResponse } from "@/lib/api";

export default function HasilPage() {
  const [data, setData] = useState<AnalysisResponse | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("sentiment_result");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (err) {
        console.error("Gagal membaca hasil dari storage", err);
      }
    }
  }, []);

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Belum Ada Data</h1>
        <p className="mt-2 text-muted font-sans text-sm">Silakan unggah file CSV atau XLSX terlebih dahulu.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-moss-deep px-5 py-2 text-sm text-paper hover:opacity-90">
          Kembali ke Beranda
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow mb-1 block">Hasil Analisis</span>
          <h1 className="font-display text-3xl text-ink">Ringkasan Sentimen</h1>
        </div>
        <Link href="/" className="self-start rounded-full border border-ink/15 px-4 py-1.5 font-sans text-sm text-ink hover:border-moss-deep/40 sm:self-auto">
          Analisis File Lain
        </Link>
      </header>

      {/* Kartu Statistik */}
      <div className="grid gap-4 sm:grid-cols-4 mb-10">
        <div className="rounded-xl border border-ink/10 bg-paper-deep/50 p-5">
          <p className="font-mono text-xs text-muted uppercase">Total Tweet</p>
          <p className="mt-2 font-display text-3xl text-ink">{data.total}</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-paper-deep/50 p-5">
          <p className="font-mono text-xs text-moss-deep uppercase">Positif</p>
          <p className="mt-2 font-display text-3xl text-moss-deep">{data.counts.positif}</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-paper-deep/50 p-5">
          <p className="font-mono text-xs text-clay uppercase">Negatif</p>
          <p className="mt-2 font-display text-3xl text-clay">{data.counts.negatif}</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-paper-deep/50 p-5">
          <p className="font-mono text-xs text-slate uppercase">Netral</p>
          <p className="mt-2 font-display text-3xl text-slate">{data.counts.netral}</p>
        </div>
      </div>

      {/* Tabel Data Tweet */}
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/50">
        <table className="w-full text-left font-mono text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-[11px] uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-medium">Username</th>
              <th className="px-5 py-3 font-medium">Teks Tweet</th>
              <th className="px-5 py-3 font-medium">Sentimen</th>
            </tr>
          </thead>
          <tbody>
            {data.results?.map((t, idx) => {
              const labelLower = t.label.toLowerCase();
              return (
                <tr key={idx} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3 text-ink">{t.username || "-"}</td>
                  <td className="px-5 py-3 font-sans text-ink">{t.text}</td>
                  <td className="px-5 py-3">
                    <span className={`tag-chip ${labelLower === "positif" ? "tag-chip--positive" : labelLower === "negatif" ? "tag-chip--negative" : "tag-chip--neutral"}`}>{t.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
