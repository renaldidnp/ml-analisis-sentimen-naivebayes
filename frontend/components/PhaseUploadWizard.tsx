"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeCsv, FASE_LIST, type AnalysisResult, type FaseKey } from "@/lib/api";

type SlotStatus = "idle" | "dragging" | "ready" | "processing" | "done" | "error";

type SlotState = {
  file: File | null;
  status: SlotStatus;
  errorMsg: string | null;
  result: AnalysisResult | null;
};

const initialSlot: SlotState = { file: null, status: "idle", errorMsg: null, result: null };

const PROCESSING_MESSAGES = ["Membaca file…", "Membersihkan teks…", "Mengklasifikasikan…", "Merangkum hasil…"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidFile(candidate: File) {
  const name = candidate.name.toLowerCase();
  return name.endsWith(".csv") || name.endsWith(".xlsx") || candidate.type === "text/csv" || candidate.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

/** Equalizer bar + teks status bergantian — dipakai saat file sedang dianalisis. */
function ProcessingIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % PROCESSING_MESSAGES.length), 1300);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-6 items-end gap-1" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="w-1.5 origin-bottom rounded-full bg-turmeric-deep animate-bar-grow" style={{ height: "100%", animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
      <div className="h-4 overflow-hidden">
        <span key={step} className="font-mono text-[10px] text-muted animate-fade-slide">
          {PROCESSING_MESSAGES[step]}
        </span>
      </div>
    </div>
  );
}

/**
 * Wizard upload 3 fase (Pra-peluncuran / Peluncuran awal / Pasca-peluncuran).
 * Tiap fase diupload terpisah ke POST /api/analyze dengan parameter `fase`.
 * Setelah SEMUA fase selesai (status "done"), onAllDone dipanggil supaya
 * halaman induk bisa menampilkan dashboard temporal (4.7).
 */
export default function PhaseUploadWizard({ onAllDone, onPhaseAnalyzed }: { onAllDone: () => void; onPhaseAnalyzed?: (fase: FaseKey, result: AnalysisResult) => void }) {
  const [slots, setSlots] = useState<Record<FaseKey, SlotState>>({
    pra: { ...initialSlot },
    awal: { ...initialSlot },
    pasca: { ...initialSlot },
  });
  const inputRefs = useRef<Record<FaseKey, HTMLInputElement | null>>({ pra: null, awal: null, pasca: null });

  const updateSlot = (fase: FaseKey, patch: Partial<SlotState>) => {
    setSlots((prev) => ({ ...prev, [fase]: { ...prev[fase], ...patch } }));
  };

  const acceptFile = useCallback((fase: FaseKey, candidate: File | undefined) => {
    if (!candidate) return;
    if (!isValidFile(candidate)) {
      updateSlot(fase, { errorMsg: "File harus berformat .csv atau .xlsx", status: "error" });
      return;
    }
    if (candidate.size > 25 * 1024 * 1024) {
      updateSlot(fase, { errorMsg: "Ukuran file maksimal 25 MB", status: "error" });
      return;
    }
    updateSlot(fase, { file: candidate, errorMsg: null, status: "ready" });
  }, []);

  const handleAnalyze = async (fase: FaseKey) => {
    const slot = slots[fase];
    if (!slot.file) return;
    updateSlot(fase, { status: "processing", errorMsg: null });
    try {
      const result = await analyzeCsv(slot.file, fase);

      setSlots((prev) => {
        const next = { ...prev, [fase]: { ...prev[fase], status: "done" as const, result } };
        const semuaSelesai = FASE_LIST.every((f) => next[f.key].status === "done");
        if (semuaSelesai) queueMicrotask(() => onAllDone());
        return next;
      });

      onPhaseAnalyzed?.(fase, result);
    } catch (err) {
      updateSlot(fase, {
        status: "error",
        errorMsg: err instanceof Error ? err.message : "Gagal memproses file. Coba lagi.",
      });
    }
  };

  const jumlahSelesai = FASE_LIST.filter((f) => slots[f.key].status === "done").length;

  return (
    <div className="w-full max-w-2xl">
      {/* Progress stepper, ganti teks polos "x dari y" */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex gap-1.5">
          {FASE_LIST.map(({ key }) => (
            <span key={key} className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${slots[key].status === "done" ? "bg-sage" : slots[key].status === "processing" ? "bg-turmeric-deep" : "bg-ink/10"}`} />
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted">
          {jumlahSelesai}/{FASE_LIST.length} fase selesai
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {FASE_LIST.map(({ key, label }) => {
          const slot = slots[key];
          return (
            <div key={key} className="flex flex-col">
              <span className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted">
                {slot.status === "done" && <span className="h-1.5 w-1.5 rounded-full bg-sage" />}
                {label}
              </span>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (slot.status !== "processing") updateSlot(key, { status: "dragging" });
                }}
                onDragLeave={() => slot.status === "dragging" && updateSlot(key, { status: "idle" })}
                onDrop={(e) => {
                  e.preventDefault();
                  acceptFile(key, e.dataTransfer.files?.[0]);
                }}
                onClick={() => slot.status !== "processing" && inputRefs.current[key]?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") inputRefs.current[key]?.click();
                }}
                className={`flex min-h-[128px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all duration-200 ${
                  slot.status === "dragging"
                    ? "scale-[1.02] border-turmeric-deep bg-turmeric/10"
                    : slot.status === "error"
                      ? "border-brick/40 bg-brick/5"
                      : slot.status === "done"
                        ? "border-sage/50 bg-sage/5"
                        : slot.status === "processing"
                          ? "border-turmeric-deep/40 bg-turmeric/5"
                          : "border-ink/20 bg-white/50 hover:border-ink/35 hover:bg-white/70"
                }`}
              >
                <input
                  ref={(el) => {
                    inputRefs.current[key] = el;
                  }}
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => acceptFile(key, e.target.files?.[0])}
                />

                {!slot.file && slot.status !== "done" && (
                  <>
                    <span className="font-sans text-sm text-ink">Tarik file di sini</span>
                    <span className="mt-1 font-mono text-[10px] text-muted">atau klik untuk memilih</span>
                  </>
                )}

                {slot.file && slot.status !== "processing" && slot.status !== "done" && (
                  <div className="w-full text-left">
                    <p className="truncate font-mono text-xs text-ink">{slot.file.name}</p>
                    <p className="font-mono text-[10px] text-muted">{formatBytes(slot.file.size)}</p>
                  </div>
                )}

                {slot.status === "processing" && <ProcessingIndicator />}

                {slot.status === "done" && slot.result && (
                  <div className="w-full text-left motion-safe:animate-rise-in">
                    <p className="font-mono text-xs text-sage">✓ {slot.result.total} tweet dianalisis</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted">{slot.file?.name}</p>
                  </div>
                )}
              </div>

              {slot.errorMsg && <p className="mt-1.5 font-mono text-[10px] text-brick">{slot.errorMsg}</p>}

              {slot.status !== "done" && (
                <button
                  type="button"
                  disabled={!slot.file || slot.status === "processing"}
                  onClick={() => handleAnalyze(key)}
                  className="mt-2 w-full rounded-full bg-ink px-4 py-2 font-sans text-xs font-medium text-paper transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 hover:opacity-90 hover:enabled:scale-[1.02]"
                >
                  {slot.status === "processing" ? "Memproses…" : "Analisis"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted">format: .csv atau .xlsx, kolom teks bernama Tweet, maks. 25 MB per file. Ketiga fase perlu diupload untuk melihat dashboard tren temporal.</p>
    </div>
  );
}
