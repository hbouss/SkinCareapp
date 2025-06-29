# app/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.routers.auth import admin_required, get_current_user, get_db
from app.models.user import UserAdmin
from app.crud.user import get_all_users, update_user_is_premium

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserAdmin], dependencies=[Depends(admin_required)])
async def list_users(db: AsyncSession = Depends(get_db)):
    """
    Renvoie tous les utilisateurs avec leur statut premium.
    """
    users = await get_all_users(db)
    return [UserAdmin(id=u.id, email=u.email, is_admin=u.is_admin, is_premium=u.is_premium)
            for u in users]

@router.post("/users/{user_id}/premium", dependencies=[Depends(admin_required)], status_code=204)
async def set_premium(
    user_id: int,
    make_premium: bool,
    db: AsyncSession = Depends(get_db)
):
    """
    Passe l’utilisateur en premium (make_premium=True) ou en free (False).
    """
    # On peut vérifier que l’utilisateur existe…
    await update_user_is_premium(db, user_id, make_premium)