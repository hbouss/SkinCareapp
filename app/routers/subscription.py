# app/routers/subscription.py
from typing import Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.routers.auth import get_current_user, get_db, UserPublic, admin_required
from app.crud.user import update_user_is_premium

router = APIRouter(prefix="/subscription", tags=["subscription"])

@router.post(
    "/subscribe",
    response_model=UserPublic,
    summary="Passe l'utilisateur en Premium"
)
async def subscribe(
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Active le flag is_premium pour l'utilisateur connecté.
    (Ici, on ne fait pas de vérif de paiement ; c'est manuel ou factice.)
    """
    await update_user_is_premium(db, int(current_user.id), True)
    # Renvoi le nouvel état utilisateur
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        is_admin=current_user.is_admin,
        is_premium=True
    )

# 1) On déclare d’abord le Pydantic model
class ValidateRequest(BaseModel):
    receipt: str
    platform: str

# 2) Puis on décore **la fonction**, pas la classe
@router.post(
    "/validate",
    status_code=status.HTTP_200_OK,
    summary="Valide un achat et active le premium",
    response_model=UserPublic  # ou {"detail": str} si vous préférez
)
async def validate_subscription(
    body: ValidateRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Valide un achat (receipt + platform JSON dans le body)
    et bascule l’utilisateur en Premium.
    """
    await update_user_is_premium(db, int(current_user.id), True)
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        is_admin=current_user.is_admin,
        is_premium=True
    )