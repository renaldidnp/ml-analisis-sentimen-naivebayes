import io

import pandas as pd


def read_tabular_upload(raw: bytes, filename: str, max_mb: int) -> pd.DataFrame:
    """Read an uploaded CSV or XLSX file's raw bytes into a DataFrame."""
    size_mb = len(raw) / (1024 * 1024)
    if size_mb > max_mb:
        raise ValueError(f"Ukuran file {size_mb:.1f}MB melebihi batas {max_mb}MB")

    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "xlsx":
        try:
            return pd.read_excel(io.BytesIO(raw), engine="openpyxl")
        except Exception as e:
            raise ValueError(f"Gagal membaca file XLSX: {e}") from e

    if ext == "csv":
        # tweet-harvest / Excel export tidak selalu plain UTF-8, coba beberapa encoding
        last_error: Exception | None = None
        for encoding in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                return pd.read_csv(io.BytesIO(raw), encoding=encoding)
            except UnicodeDecodeError as e:
                last_error = e
                continue
            except Exception as e:
                raise ValueError(f"Gagal membaca CSV: {e}") from e
        raise ValueError(f"Gagal membaca encoding file: {last_error}")

    raise ValueError("Format file harus .csv atau .xlsx")