export type SentimentLabel = "positif" | "negatif" | "netral" | string;

export type TweetResult = {
  text: string;
  label: SentimentLabel;
  username?: string | null;
  created_at?: string | null;
};

export type AnalysisResult = {
  total: number;
  counts: { positif: number; negatif: number; netral: number };
  ratio: Record<string, number>;
  results: TweetResult[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function analyzeCsv(file: File, textColumn?: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (textColumn) formData.append("text_column", textColumn);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Tidak bisa menghubungi server. Pastikan backend berjalan di " + API_URL);
  }

  if (!res.ok) {
    let message = "Gagal memproses file. Coba lagi.";
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {
      // respons bukan JSON, pakai pesan default
    }
    throw new Error(message);
  }

  return res.json();
}
