# app/models/stats.py
from pydantic import BaseModel
from typing import List, Dict, Optional


class LabelStat(BaseModel):
    label: str
    count: int
    percent: float

class StatsResponse(BaseModel):
    total_sessions: int
    by_label: List[LabelStat]


class TrendPoint(BaseModel):
    month: str             # ex. "Mar 2025"
    week: Optional[str]
    averages: Dict[str, float]

class TrendResponse(BaseModel):
    trend: List[TrendPoint]