"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Counts = { positif: number; negatif: number; netral: number };

const COLORS: Record<keyof Counts, string> = {
  positif: "#587A52",
  netral: "#767065",
  negatif: "#A44432",
};

export default function SentimentChart({ counts }: { counts: Counts }) {
  const data = [
    { name: "Positif", key: "positif", value: counts.positif },
    { name: "Netral", key: "netral", value: counts.netral },
    { name: "Negatif", key: "negatif", value: counts.negatif },
  ];

  return (
    <div className="rounded-2xl border border-ink/10 bg-white/50 p-5 sm:p-6">
      <p className="eyebrow mb-4">Distribusi sentimen</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "rgba(25,31,27,0.12)" }} tick={{ fontFamily: "var(--font-plex-mono)", fontSize: 11, fill: "#767065" }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontFamily: "var(--font-plex-mono)", fontSize: 11, fill: "#767065" }} />
            <Tooltip
              cursor={{ fill: "rgba(25,31,27,0.04)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgba(25,31,27,0.1)",
                fontFamily: "var(--font-plex-mono)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
              {data.map((d) => (
                <Cell key={d.key} fill={COLORS[d.key as keyof Counts]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
