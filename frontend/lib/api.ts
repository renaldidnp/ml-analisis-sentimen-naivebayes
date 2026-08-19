export interface TweetResult {
  text: string;
  label: string;
  username?: string | null;
  created_at?: string | null;
}

export interface SentimentCounts {
  positif: number;
  negatif: number;
  netral: number;
}

export interface AnalysisResponse {
  total: number;
  counts: SentimentCounts;
  ratio: Record<string, number>;
  results: TweetResult[];
}

export async function analyzeCsv(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || `Error ${response.status}: Gagal mengolah file.`;
    throw new Error(message);
  }

  return response.json();
}

export async function saveResult(data: AnalysisResponse): Promise<void> {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("sentiment_result", JSON.stringify(data));
  }
}
