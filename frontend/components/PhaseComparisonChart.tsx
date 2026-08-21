"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PerFaseResponse } from "@/lib/api";

const COLORS = { positif: "#587A52", netral: "#767065", negatif: "#A44432" };

export default function PhaseComparisonChart({ data }: { data: PerFaseResponse }) {
  const chartData = data.fase.map((fase, i) => ({
    fase,
    Positif: data.positif[i],
    Netral: data.netral[i],
    Negatif: data.negatif[i],
    jumlah: data.jumlah_data[i],
  }));

  return (
    <div className="rounded-2xl border border-ink/10 bg-white/50 p-5 sm:p-6">
      <p className="eyebrow mb-1">Gambar 4.8</p>
      <p className="mb-4 font-display text-lg text-ink">Perbandingan distribusi sentimen antar fase</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(25,31,27,0.06)" vertical={false} />
            <XAxis dataKey="fase" tickLine={false} axisLine={{ stroke: "rgba(25,31,27,0.12)" }} tick={{ fontFamily: "var(--font-plex-mono)", fontSize: 11, fill: "#767065" }} />
            <YAxis unit="%" tickLine={false} axisLine={false} tick={{ fontFamily: "var(--font-plex-mono)", fontSize: 11, fill: "#767065" }} />
            <Tooltip
              cursor={{ fill: "rgba(25,31,27,0.04)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgba(25,31,27,0.1)",
                fontFamily: "var(--font-plex-mono)",
                fontSize: 12,
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend wrapperStyle={{ fontFamily: "var(--font-plex-mono)", fontSize: 11 }} />
            <Bar dataKey="Positif" fill={COLORS.positif} radius={[4, 4, 0, 0]} maxBarSize={48} />
            <Bar dataKey="Netral" fill={COLORS.netral} radius={[4, 4, 0, 0]} maxBarSize={48} />
            <Bar dataKey="Negatif" fill={COLORS.negatif} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
