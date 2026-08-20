"use client";

import { useMemo, useState } from "react";
import type { TweetResult } from "@/lib/api";

const FILTERS = ["semua", "positif", "netral", "negatif"] as const;
type Filter = (typeof FILTERS)[number];

function chipClass(label: string) {
  const l = label.toLowerCase();
  if (l === "positif") return "tag-chip--positive";
  if (l === "negatif") return "tag-chip--negative";
  return "tag-chip--neutral";
}

export default function TweetTable({ results }: { results: TweetResult[] }) {
  const [filter, setFilter] = useState<Filter>("semua");

  const hasUsername = results.some((r) => r.username);
  const hasDate = results.some((r) => r.created_at);

  const filtered = useMemo(() => {
    if (filter === "semua") return results;
    return results.filter((r) => r.label.toLowerCase() === filter);
  }, [results, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 font-mono text-xs capitalize transition-colors ${filter === f ? "border-ink bg-ink text-paper" : "border-ink/15 text-muted hover:border-ink/30 hover:text-ink"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/50">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-paper-deep/95 backdrop-blur-sm">
              <tr className="text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-mono font-medium">Teks</th>
                {hasUsername && <th className="px-5 py-3 font-mono font-medium">Akun</th>}
                {hasDate && <th className="px-5 py-3 font-mono font-medium">Tanggal</th>}
                <th className="px-5 py-3 font-mono font-medium">Label</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="border-t border-ink/5 align-top first:border-t-0">
                  <td className="max-w-md px-5 py-3 font-sans text-ink">{r.text}</td>
                  {hasUsername && <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted">{r.username ?? "—"}</td>}
                  {hasDate && <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted">{r.created_at ?? "—"}</td>}
                  <td className="whitespace-nowrap px-5 py-3">
                    <span className={`tag-chip ${chipClass(r.label)}`}>{r.label}</span>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center font-mono text-xs text-muted">
                    Tidak ada tweet dengan label ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted">
        menampilkan {filtered.length} dari {results.length} tweet
      </p>
    </div>
  );
}
