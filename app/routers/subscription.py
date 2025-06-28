# app/routers/subscription.py
from fastapi import APIRouter, Depends, HTTPException, status
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