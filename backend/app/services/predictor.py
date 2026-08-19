from pathlib import Path

import joblib

from app.core.config import settings


class ModelNotReadyError(Exception):
    """Raised when the trained model files aren't present in ml/ yet."""


class SentimentPredictor:
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self._vectorizer = None
        self._classifier = None
        self._loaded = False

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return

        vec_path = self.model_dir / "tfidf.pkl"
        clf_path = self.model_dir / "naive_bayes.pkl"

        if not vec_path.exists() or not clf_path.exists():
            raise ModelNotReadyError(
                f"Model belum ditemukan di {self.model_dir}. "
                "Taruh 'tfidf.pkl' dan 'naive_bayes.pkl' hasil export dari Colab di folder ml/ "
                "(atau jalankan 'python ml/train_dummy_model.py' untuk model placeholder saat testing)."
            )

        self._vectorizer = joblib.load(vec_path)
        self._classifier = joblib.load(clf_path)
        self._loaded = True

    def predict(self, cleaned_texts: list[str]) -> list[str]:
        self._ensure_loaded()
        X = self._vectorizer.transform(cleaned_texts)
        preds = self._classifier.predict(X)
        return [str(p) for p in preds]


predictor = SentimentPredictor(model_dir=settings.MODEL_DIR)
