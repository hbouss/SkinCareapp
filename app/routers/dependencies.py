# app/routers/dependencies.py
from fastapi import Depends, HTTPException, status
from datetime import datetime
from app.routers.auth import get_current_user  # votre dépendance existante
from app.models.user import UserPublic

async def subscription_required(
    current_user = Depends(get_current_user)
):
    if not getattr(current_user, "is_premium", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux utilisateurs Premium"
        )
    return current_user