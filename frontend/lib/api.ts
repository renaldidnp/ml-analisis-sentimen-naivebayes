// ============================================================
// TAMBAHAN untuk lib/api.ts — sisipkan/gabungkan dengan yang sudah ada.
// Type & fungsi analyzeCsv() lama perlu DIGANTI (lihat catatan di bawah),
// sisanya murni tambahan baru, tidak menghapus apa pun yang sudah ada
// (loadResult/clearResult yang dipakai app/hasil/page.tsx tetap dipertahankan
// apa adanya — file ini cuma menunjukkan bagian yang perlu ditambah/diubah).
// ============================================================

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

// --- BARU: identitas 3 fase kebijakan, dipakai di seluruh alur upload & chart ---
export type FaseKey = "pra" | "awal" | "pasca";

export const FASE_LIST: { key: FaseKey; label: string }[] = [
  { key: "pra", label: "Pra-pencanangan" },
  { key: "awal", label: "Peluncuran awal" },
  { key: "pasca", label: "Pasca-peluncuran" },
];

export const FASE_LABEL: Record<FaseKey, string> = {
  pra: "Pra-pencanangan",
  awal: "Peluncuran awal",
  pasca: "Pasca-peluncuran",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// --- DIUBAH: analyzeCsv sekarang WAJIB menerima fase, karena backend
// /api/analyze sekarang mewajibkan parameter ini (dipakai untuk menyimpan
// hasil per fase, dasar chart temporal 4.7). Ganti fungsi lama dengan ini. ---
export async function analyzeCsv(file: File, fase: FaseKey, textColumn?: string, dateColumn?: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fase", fase);
  if (textColumn) formData.append("text_column", textColumn);
  if (dateColumn) formData.append("date_column", dateColumn);

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

// ============================================================
// BARU: fungsi & tipe untuk endpoint temporal (BAB 4.7)
// ============================================================

export type TemporalStatus = Record<
  FaseKey,
  { label: string; tersedia: boolean; jumlah_data: number; jumlah_bertanggal: number }
>;

export type PerFaseResponse = {
  fase: string[];
  positif: number[];
  negatif: number[];
  netral: number[];
  jumlah_data: number[];
};

export type PerBulanResponse = {
  bulan: string[];
  positif: number[];
  negatif: number[];
  netral: number[];
  jumlah_data: number[];
};

export type RingkasanTemporal = {
  bulan_negatif_tertinggi?: string;
  nilai_negatif_tertinggi?: number;
  bulan_positif_tertinggi?: string;
  nilai_positif_tertinggi?: number;
  perubahan_negatif_pra_ke_pasca?: number;
  distribusi_per_fase: Record<string, { Positif: number; Negatif: number; Netral: number; jumlah: number }>;
};

async function getJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`);
  } catch {
    throw new Error("Tidak bisa menghubungi server. Pastikan backend berjalan di " + API_URL);
  }
  if (!res.ok) {
    let message = "Gagal mengambil data.";
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {
      // abaikan, pakai pesan default
    }
    throw new Error(message);
  }
  return res.json();
}

export const getTemporalStatus = () => getJson<TemporalStatus>("/api/temporal/status");
export const getTemporalPerFase = () => getJson<PerFaseResponse>("/api/temporal/per-fase");
export const getTemporalPerBulan = () => getJson<PerBulanResponse>("/api/temporal/per-bulan");
export const getTemporalRingkasan = () => getJson<RingkasanTemporal>("/api/temporal/ringkasan");
