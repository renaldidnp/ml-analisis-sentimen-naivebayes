"use client";

import { useEffect, useState } from "react";

const MESSAGES = ["Membaca kolom Tweet...", "Membersihkan teks & tanda baca...", "Mengenali pola kalimat...", "Mengklasifikasikan sentimen...", "Merangkum hasil..."];

export default function AnalyzingState({ label }: { label?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % MESSAGES.length), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card-surface flex flex-col items-center gap-6 px-8 py-10 text-center motion-safe:animate-rise-in">
      <div className="flex h-12 items-end gap-1.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="w-2 origin-bottom rounded-full bg-turmeric-deep animate-bar-grow" style={{ height: "100%", animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>

      <div className="h-5 overflow-hidden">
        <p key={step} className="font-mono text-xs uppercase tracking-[0.14em] text-muted animate-fade-slide">
          {label ?? MESSAGES[step]}
        </p>
      </div>

      <div className="h-1.5 w-52 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-turmeric/40 via-turmeric-deep to-turmeric/40 bg-[length:200%_100%] animate-shimmer" />
      </div>
    </div>
  );
}
