"use client";

import { useCallback, useRef, useState } from "react";
import { analyzeCsv, type AnalysisResult } from "@/lib/api";

type Status = "idle" | "dragging" | "ready" | "processing" | "error";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDropzone({ onSuccess }: { onSuccess: (result: AnalysisResult) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = useCallback((candidate: File | undefined) => {
    if (!candidate) return;
    const name = candidate.name.toLowerCase();
    const isValidType = name.endsWith(".csv") || name.endsWith(".xlsx") || candidate.type === "text/csv" || candidate.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!isValidType) {
      setErrorMsg("File harus berformat .csv atau .xlsx");
      setStatus("error");
      return;
    }
    if (candidate.size > 25 * 1024 * 1024) {
      setErrorMsg("Ukuran file maksimal 25 MB");
      setStatus("error");
      return;
    }
    setErrorMsg(null);
    setFile(candidate);
    setStatus("ready");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      acceptFile(e.dataTransfer.files?.[0]);
    },
    [acceptFile],
  );

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("processing");
    setErrorMsg(null);
    try {
      const result = await analyzeCsv(file);
      onSuccess(result);
      setFile(null);
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memproses file. Coba lagi.");
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-md">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (status !== "processing") setStatus("dragging");
        }}
        onDragLeave={() => status === "dragging" && setStatus("idle")}
        onDrop={handleDrop}
        onClick={() => status !== "processing" && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex min-h-[168px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          status === "dragging" ? "border-turmeric-deep bg-turmeric/10" : status === "error" ? "border-brick/40 bg-brick/5" : "border-ink/20 bg-white/50 hover:border-ink/35 hover:bg-white/70"
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => acceptFile(e.target.files?.[0])} />

        {!file && (
          <>
            <span className="font-display text-lg text-ink">Tarik file CSV/XLSX ke sini</span>
            <span className="mt-1 font-mono text-xs text-muted">atau klik untuk memilih dari perangkatmu</span>
          </>
        )}

        {file && status !== "processing" && (
          <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-paper px-4 py-3">
            <div className="min-w-0 text-left">
              <p className="truncate font-mono text-sm text-ink">{file.name}</p>
              <p className="font-mono text-[11px] text-muted">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="shrink-0 font-mono text-[11px] text-muted underline decoration-dotted hover:text-brick"
            >
              ganti
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="flex flex-col items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-turmeric-deep" />
            <span className="font-mono text-xs text-muted">memproses {file?.name}…</span>
          </div>
        )}
      </div>

      {errorMsg && <p className="mt-2 font-mono text-xs text-brick">{errorMsg}</p>}

      <button
        type="button"
        disabled={!file || status === "processing"}
        onClick={handleAnalyze}
        className="mt-4 w-full rounded-full bg-ink px-6 py-3 font-sans text-sm font-medium text-paper transition-opacity disabled:cursor-not-allowed disabled:opacity-30 hover:opacity-90"
      >
        {status === "processing" ? "Memproses…" : "Analisis sekarang"}
      </button>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted">
        format: .csv atau .xlsx, kolom teks bernama <code className="text-ink">Tweet</code>, maks. 25 MB
      </p>
    </div>
  );
}
