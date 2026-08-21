"use client";

import { useEffect, useState } from "react";
import { getTemporalPerBulan, getTemporalPerFase, getTemporalRingkasan, type PerBulanResponse, type PerFaseResponse, type RingkasanTemporal } from "@/lib/api";
import PhaseComparisonChart from "@/components/PhaseComparisonChart";
import MonthlyTrendChart from "@/components/MonthlyTrendChart";

export default function TemporalDashboard() {
  const [perFase, setPerFase] = useState<PerFaseResponse | null>(null);
  const [perBulan, setPerBulan] = useState<PerBulanResponse | null>(null);
  const [ringkasan, setRingkasan] = useState<RingkasanTemporal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let batal = false;
    setLoading(true);
    setError(null);

    Promise.all([getTemporalPerFase(), getTemporalPerBulan().catch(() => null), getTemporalRingkasan().catch(() => null)])
      .then(([fase, bulan, ring]) => {
        if (batal) return;
        setPerFase(fase);
        setPerBulan(bulan);
        setRingkasan(ring);
      })
      .catch((err) => {
        if (batal) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data tren temporal.");
      })
      .finally(() => !batal && setLoading(false));

    return () => {
      batal = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-turmeric-deep" />
        memuat data tren temporal…
      </div>
    );
  }

  if (error) {
    return <p className="font-mono text-xs text-brick">{error}</p>;
  }

  return (
    <div className="space-y-6">
      {ringkasan && (
        <div className="grid gap-3 sm:grid-cols-2">
          {ringkasan.bulan_negatif_tertinggi && (
            <div className="rounded-xl border border-brick/20 bg-brick/5 p-4">
              <p className="font-mono text-[11px] uppercase text-brick">Puncak sentimen negatif</p>
              <p className="mt-1 font-display text-lg text-ink">
                {ringkasan.bulan_negatif_tertinggi} · {ringkasan.nilai_negatif_tertinggi}%
              </p>
            </div>
          )}
          {ringkasan.perubahan_negatif_pra_ke_pasca !== undefined && (
            <div className="rounded-xl border border-ink/10 bg-paper-deep/50 p-4">
              <p className="font-mono text-[11px] uppercase text-muted">Perubahan sentimen negatif (pra → pasca)</p>
              <p className="mt-1 font-display text-lg text-ink">
                {ringkasan.perubahan_negatif_pra_ke_pasca > 0 ? "+" : ""}
                {ringkasan.perubahan_negatif_pra_ke_pasca} poin persen
              </p>
            </div>
          )}
        </div>
      )}

      {perFase && <PhaseComparisonChart data={perFase} />}
      {perBulan && <MonthlyTrendChart data={perBulan} />}
    </div>
  );
}
