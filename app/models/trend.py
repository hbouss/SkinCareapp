from pydantic import BaseModel
from typing import List, Dict

class MonthlyAvg(BaseModel):
    month: str
    averages: Dict[str, float]   # label → moyenne %

class TrendResponse(BaseModel):
    trend: List[MonthlyAvg]