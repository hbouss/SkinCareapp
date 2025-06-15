# app/routers/subscription.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.db.session import AsyncSessionLocal
from app.crud.user import update_user_subscription
from app.routers.auth import get_current_user
from app.models.user import UserPublic
from app.services.iap_verifier import verify_apple_receipt, verify_google_receipt

router = APIRouter(prefix="/subscription", tags=["subscription"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/status", response_model=UserPublic)
async def get_status(
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Renvoie l'utilisateur avec subscription_expiry pour que le front sache s’il est abonné.
    """
    return current_user

class ValidateReceiptBody(BaseModel):
    receipt: str
    platform: str  # 'apple' ou 'google'

@router.post("/validate", status_code=204)
async def validate_receipt(
    data: ValidateReceiptBody = Body(...),
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Vérifie le reçu (stub) puis met à jour subscription_expiry.
    """
    receipt = data.receipt
    platform = data.platform.lower()
    if platform not in ("apple", "google"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Platform must be 'apple' or 'google'"
        )

    # 1) Vérifier receipt (stub renvoie 30 jours)
    if platform == "apple":
        expiry = verify_apple_receipt(receipt)
    else:
        expiry = verify_google_receipt(receipt)

    # 2) Mettre à jour l’utilisateur
    await update_user_subscription(db, int(current_user.id), expiry)
    return
