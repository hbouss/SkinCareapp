# app/routers/dependencies.py
from fastapi import Depends, HTTPException, status
from datetime import datetime
from app.routers.auth import get_current_user  # votre dépendance existante
from app.models.user import UserPublic

async def subscription_required(
    current_user: UserPublic = Depends(get_current_user)
) -> UserPublic:
    """
    Lève une 402 si l'utilisateur n'a pas d'abonnement actif.
    Renvoie l'objet UserPublic sinon.
    """
    expiry = current_user.subscription_expiry
    now = datetime.utcnow()
    if not expiry or expiry < now:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Abonnement expiré ou inexistant. Veuillez souscrire pour accéder à cette ressource."
        )
    return current_user