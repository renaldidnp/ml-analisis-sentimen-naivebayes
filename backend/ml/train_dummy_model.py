"""
BUKAN model untuk skripsi. Script ini cuma bikin tfidf.pkl + naive_bayes.pkl
placeholder dari beberapa contoh kalimat, supaya endpoint /api/analyze bisa
langsung dites sebelum model asli hasil training di Colab kamu di-export
ke folder ml/ ini.

Jalankan sekali:
    python ml/train_dummy_model.py

Setelah model asli siap, GANTI tfidf.pkl dan naive_bayes.pkl di folder ini
dengan hasil joblib.dump(...) dari notebook Colab kamu.
"""

from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

samples = [
    ("program bagus gizi lancar", "positif"),
    ("makan enak anak senang", "positif"),
    ("layan ramah tepat waktu", "positif"),
    ("porsi kurang telat sering", "negatif"),
    ("makan basi tidak layak", "negatif"),
    ("kecewa program berantakan", "negatif"),
    ("program jalan seperti biasa", "netral"),
    ("belum ada ubah arti", "netral"),
]

texts, labels = zip(*samples)

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)

classifier = MultinomialNB()
classifier.fit(X, labels)

out_dir = Path(__file__).resolve().parent
joblib.dump(vectorizer, out_dir / "tfidf.pkl")
joblib.dump(classifier, out_dir / "naive_bayes.pkl")

print(f"Model placeholder disimpan di {out_dir}")
print("PERINGATAN: ini model dummy untuk testing pipeline saja.")
print("Ganti dengan model hasil training asli dari Colab sebelum dipakai untuk skripsi.")
