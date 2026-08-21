"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PerBulanResponse } from "@/lib/api";

const COLORS = { positif: "#587A52", netral: "#767065", negatif: "#A44432" };

export default function MonthlyTrendChart({ data }: { data: PerBulanResponse }) {
  const chartData = data.bulan.map((bulan, i) => ({
    bulan,
    Positif: data.positif[i],
    Netral: data.netral[i],
    Negatif: data.negatif[i],
  }));

  return (
    <div className="rounded-2xl border border-ink/10 bg-white/50 p-5 sm:p-6">
      <p className="eyebrow mb-1">Gambar 4.7</p>
      <p className="mb-4 font-display text-lg text-ink">Tren perubahan sentimen publik dari waktu ke waktu</p>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(25,31,27,0.06)" vertical={false} />
            <XAxis
              dataKey="bulan"
              angle={-45}
              textAnchor="end"
              height={50}
              tickLine={false}
              axisLine={{ stroke: "rgba(25,31,27,0.12)" }}
              tick={{ fontFamily: "var(--font-plex-mono)", fontSize: 10, fill: "#767065" }}
            />
            <YAxis unit="%" tickLine={false} axisLine={false} tick={{ fontFamily: "var(--font-plex-mono)", fontSize: 11, fill: "#767065" }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgba(25,31,27,0.1)",
                fontFamily: "var(--font-plex-mono)",
                fontSize: 12,
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend wrapperStyle={{ fontFamily: "var(--font-plex-mono)", fontSize: 11 }} />
            <Line type="monotone" dataKey="Positif" stroke={COLORS.positif} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Netral" stroke={COLORS.netral} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Negatif" stroke={COLORS.negatif} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
