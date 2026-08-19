from typing import Optional

from pydantic import BaseModel


class SentimentCounts(BaseModel):
    positif: int
    negatif: int
    netral: int


class TweetResult(BaseModel):
    text: str
    label: str
    username: Optional[str] = None
    created_at: Optional[str] = None


class AnalysisResponse(BaseModel):
    total: int
    counts: SentimentCounts
    ratio: dict[str, float]
    results: list[TweetResult]
