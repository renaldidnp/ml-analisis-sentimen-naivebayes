import csv
import re

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

from app.core.config import settings

# Istilah yang TIDAK boleh dinormalisasi/di-stopword/di-stem, karena punya arti
# khusus untuk analisis ini (mis. singkatan program). Tambahkan sesuai kebutuhan.
PROTECTED_TERMS = {"mbg"}

_stemmer = StemmerFactory().create_stemmer()
_stopwords = set(StopWordRemoverFactory().get_stop_words())

_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_MENTION_RE = re.compile(r"@\w+")
_HASHTAG_SYM_RE = re.compile(r"#")
_NON_ALPHA_RE = re.compile(r"[^a-z\s]")
_MULTISPACE_RE = re.compile(r"\s+")


def _load_kamus_alay() -> dict[str, str]:
    """Load slang->formal word mapping from ml/kamus_alay.csv (columns: slang,formal).

    Returns an empty mapping (normalization skipped) if the file isn't present yet.
    """
    path = settings.MODEL_DIR / "kamus_alay.csv"
    mapping: dict[str, str] = {}
    if not path.exists():
        return mapping
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)  # skip header
        for row in reader:
            if len(row) >= 2:
                mapping[row[0].strip().lower()] = row[1].strip().lower()
    return mapping


_KAMUS_ALAY = _load_kamus_alay()


def _clean_raw(text: str) -> str:
    text = text.lower()
    text = _URL_RE.sub(" ", text)
    text = _MENTION_RE.sub(" ", text)
    text = _HASHTAG_SYM_RE.sub(" ", text)
    text = _NON_ALPHA_RE.sub(" ", text)
    text = _MULTISPACE_RE.sub(" ", text).strip()
    return text


def preprocess(text: str) -> str:
    """Clean -> normalize kamus alay -> remove stopwords -> stem.

    Tokens in PROTECTED_TERMS pass through normalization, stopword
    removal, and stemming untouched.
    """
    cleaned = _clean_raw(text)
    tokens = cleaned.split()

    normalized = [t if t in PROTECTED_TERMS else _KAMUS_ALAY.get(t, t) for t in tokens]

    filtered = [t for t in normalized if t in PROTECTED_TERMS or t not in _stopwords]

    stemmed = [t if t in PROTECTED_TERMS else _stemmer.stem(t) for t in filtered]

    return " ".join(stemmed)


def preprocess_batch(texts: list[str]) -> list[str]:
    return [preprocess(t) for t in texts]
