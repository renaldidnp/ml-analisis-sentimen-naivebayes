type Counts = { positif: number; negatif: number; netral: number };

const cards: {
  key: keyof Counts;
  label: string;
  chipClass: string;
}[] = [
  { key: "positif", label: "Positif", chipClass: "tag-chip--positive" },
  { key: "netral", label: "Netral", chipClass: "tag-chip--neutral" },
  { key: "negatif", label: "Negatif", chipClass: "tag-chip--negative" },
];

export default function ResultSummary({ total, counts, ratio }: { total: number; counts: Counts; ratio: Record<string, number> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => {
        const pct = Math.round((ratio[c.key] ?? 0) * 100);
        return (
          <div key={c.key} className="rounded-2xl border border-ink/10 bg-white/50 p-5">
            <span className={`tag-chip ${c.chipClass}`}>{c.label}</span>
            <p className="mt-4 font-display text-3xl text-ink">
              {counts[c.key]}
              <span className="ml-2 font-mono text-sm font-normal text-muted">{pct}%</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted">dari {total} tweet</p>
          </div>
        );
      })}
    </div>
  );
}
