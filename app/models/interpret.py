# app/models/interpret.py
from pydantic import BaseModel
from typing import Dict, List

class InterpretRequest(BaseModel):
    scores: Dict[str, float]

class InterpretResponse(BaseModel):
    interpretation: str
    suggestions: List[str]