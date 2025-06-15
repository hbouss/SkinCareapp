# app/routers/interpret.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.interpret import InterpretRequest, InterpretResponse
from app.services.interpret_service import interpret_scores
from app.routers.auth import get_current_user, get_db

router = APIRouter(prefix="/interpret", tags=["interpret"])

@router.post(
    "/",
    response_model=InterpretResponse,
    summary="Interprétation des scores via GPT"
)
async def interpret(
    body: InterpretRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    1) Vérifie que l'utilisateur est authentifié.
    2) Envoie les scores au service GPT.
    3) Renvoie le texte et les suggestions.
    """
    try:
        result = await interpret_scores(body.scores)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erreur d'interprétation : {e}"
        )
    return InterpretResponse(
        interpretation=result["interpretation"],
        suggestions=result["suggestions"],
    )