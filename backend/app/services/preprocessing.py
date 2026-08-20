"""
Preprocessing teks untuk inference di backend.

PENTING: fungsi di file ini HARUS menghasilkan output yang identik dengan
notebook Colab yang dipakai untuk training model (tfidf.pkl, naive_bayes.pkl).
Kalau ada langkah yang beda, vektor TF-IDF saat inference tidak akan cocok
dengan pola yang dipelajari model saat training, dan akurasi di produksi
akan lebih rendah dari yang terlihat di Colab.

Urutan langkah (SAMA PERSIS dengan Colab):
  1. case folding
  2. cleansing (normalisasi unicode, url, mention, hashtag, emoji, angka,
     tanda baca, karakter non-alfabet, reduksi elongasi, rapikan spasi)
  3. tokenisasi
  4. normalisasi kamus alay
  5. stopword removal
  6. stemming (dengan exceptions & protected terms)
"""

import csv
import re
import string

import emoji
import nltk
from nltk.corpus import stopwords as nltk_stopwords
from nltk.tokenize import word_tokenize
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

from app.core.config import settings

# ==========================================================
# NLTK data (idempotent: skip download kalau sudah ada)
# ==========================================================
for _pkg in ("punkt", "punkt_tab", "stopwords"):
    try:
        nltk.data.find(
            f"tokenizers/{_pkg}" if "punkt" in _pkg else f"corpora/{_pkg}"
        )
    except LookupError:
        nltk.download(_pkg, quiet=True)

# ==========================================================
# Istilah yang TIDAK boleh dinormalisasi/di-stopword/di-stem
# ==========================================================
# "mbg" dilindungi manual (sama seperti KATA_TERLINDUNGI_MANUAL di Colab).
# Kalau di Colab ada akronim lain yang auto-terdeteksi dari data scraping
# (lihat log "Akronim/istilah terlindungi terdeteksi: [...]"), TAMBAHKAN
# di sini juga supaya keduanya identik.
PROTECTED_TERMS = {"mbg"}

# Sastrawi kadang over-stem kata sehingga maknanya berubah (mis. "belagak"
# -> "bagak"). Harus SAMA PERSIS dengan STEMMING_EXCEPTIONS di Colab.
STEMMING_EXCEPTIONS = {
    "belagak": "belagak",
}

_stemmer = StemmerFactory().create_stemmer()
_stem_cache: dict[str, str] = {}

# Stopword gabungan: NLTK Indonesian + Sastrawi + tambahan manual
# (SAMA PERSIS dengan cell 5 di Colab).
_stopwords = set(nltk_stopwords.words("indonesian"))
_stopwords.update(StopWordRemoverFactory().get_stop_words())
_stopwords.update({"nya", "nih", "sih", "deh", "dong", "ya", "yah", "kan", "pun"})

_UNICODE_PUNCT_MAP = {
    "\u2018": "", "\u2019": "",   # ‘ ’
    "\u201c": "", "\u201d": "",   # “ ”
    "\u2013": " ", "\u2014": " ",  # – —
    "'": "",
}

_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_MENTION_RE = re.compile(r"@\w+")
_DIGIT_RE = re.compile(r"\d+")
_NON_ALPHA_RE = re.compile(r"[^a-zA-Z\s]")
_ELONGASI_RE = re.compile(r"(.)\1{2,}")
_MULTISPACE_RE = re.compile(r"\s+")
_PUNCT_TABLE = str.maketrans("", "", string.punctuation)


def _load_kamus_alay() -> dict[str, str]:
    """Load slang->formal word mapping from ml/kamus_alay.csv (columns: slang,formal).

    File ini harus dihasilkan dari sumber yang SAMA dengan yang dipakai
    Colab (kamus alay publik + kamus manual + protected terms), bukan
    sekadar file kosong/placeholder. Kalau file belum ada, normalisasi
    di-skip (perilaku degradasi aman, tapi hasil TIDAK akan cocok dengan
    model Colab).
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


def _normalisasi_unicode(text: str) -> str:
    for lama, baru in _UNICODE_PUNCT_MAP.items():
        text = text.replace(lama, baru)
    return text


def _hapus_elongasi(text: str) -> str:
    """'bagusssss' -> 'bagus', 'enaaakkk' -> 'enak'."""
    return _ELONGASI_RE.sub(r"\1", text)


def _cleansing(text: str) -> str:
    text = _normalisasi_unicode(text)
    text = _URL_RE.sub(" ", text)
    text = _MENTION_RE.sub(" ", text)
    text = text.replace("#", "")
    text = emoji.replace_emoji(text, replace=" ")
    text = _DIGIT_RE.sub(" ", text)
    text = text.translate(_PUNCT_TABLE)
    text = _NON_ALPHA_RE.sub(" ", text)
    text = _hapus_elongasi(text)
    text = _MULTISPACE_RE.sub(" ", text).strip()
    return text


def _normalisasi(tokens: list[str]) -> list[str]:
    return [
        t if t in PROTECTED_TERMS else _KAMUS_ALAY.get(t, t)
        for t in tokens
    ]


def _hapus_stopword(tokens: list[str]) -> list[str]:
    return [t for t in tokens if t in PROTECTED_TERMS or (t not in _stopwords and t != "")]


def _stemming(tokens: list[str]) -> list[str]:
    hasil = []
    for kata in tokens:
        if kata not in _stem_cache:
            if kata in PROTECTED_TERMS:
                _stem_cache[kata] = kata
            elif kata in STEMMING_EXCEPTIONS:
                _stem_cache[kata] = STEMMING_EXCEPTIONS[kata]
            else:
                _stem_cache[kata] = _stemmer.stem(kata)
        hasil.append(_stem_cache[kata])
    return hasil


def preprocess(text: str) -> str:
    """Case folding -> cleansing -> tokenisasi -> normalisasi -> stopword -> stemming.

    Identik dengan pipeline notebook Colab. Token dalam PROTECTED_TERMS
    dilewatkan tanpa normalisasi, stopword removal, atau stemming.
    """
    return preprocess_debug(text)["hasil_preprocessing"]


def preprocess_debug(text: str) -> dict[str, str]:
    """Sama seperti preprocess(), tapi mengembalikan SEMUA tahap perantara
    dengan nama kolom yang identik dengan file Excel hasil Colab
    ('Hasil Preprocessing *.xlsx'), supaya bisa dicocokkan baris per baris:
        case_folding, cleansing, tokenisasi, normalisasi, stopword,
        stemming, hasil_preprocessing
    """
    case_folding = text.lower()
    cleansing = _cleansing(case_folding)
    tokenisasi = word_tokenize(cleansing)
    normalisasi = _normalisasi(tokenisasi)
    stopword = _hapus_stopword(normalisasi)
    stemming = _stemming(stopword)
    hasil_preprocessing = " ".join(stemming)

    return {
        "original": text,
        "case_folding": case_folding,
        "cleansing": cleansing,
        "tokenisasi": tokenisasi,
        "normalisasi": normalisasi,
        "stopword": stopword,
        "stemming": stemming,
        "hasil_preprocessing": hasil_preprocessing,
    }


def preprocess_batch(texts: list[str]) -> list[str]:
    return [preprocess(t) for t in texts]


def preprocess_batch_debug(texts: list[str]) -> list[dict[str, str]]:
    return [preprocess_debug(t) for t in texts]