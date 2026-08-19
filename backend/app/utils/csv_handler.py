import io

import pandas as pd


def read_csv_upload(raw: bytes, max_mb: int) -> pd.DataFrame:
    """Read an uploaded CSV file's raw bytes into a DataFrame.

    Tries a few common encodings since tweet-harvest / Excel exports
    aren't always plain UTF-8.
    """
    size_mb = len(raw) / (1024 * 1024)
    if size_mb > max_mb:
        raise ValueError(f"Ukuran file {size_mb:.1f}MB melebihi batas {max_mb}MB")

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
