# app/models/session.py
from pydantic import BaseModel
from typing import Dict, List, Optional


class Annotation(BaseModel):
    x: float
    y: float
    width: float
    height: float
    label: str

class SkinAnalysisResponse(BaseModel):
    session_id: int
    image_url: str
    annotated_image_url: str
    scores: Dict[str, float]
    annotations: List[Annotation]
    timestamp: str