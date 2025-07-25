# app/crud/user.py

from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from sqlalchemy import update, delete
from app.db.models import User as DBUser, Session as DBSession      # votre modèle SQLAlchemy
from app.models.user import UserCreate, UserInDB, UserPublic
from app.db.models import User

async def get_user_by_email(
    db: AsyncSession,
    email: str
) -> Optional[UserInDB]:
    """
    Recherche un utilisateur par email. Retourne un UserInDB ou None.
    """
    result = await db.execute(
        select(DBUser).where(DBUser.email == email)
    )
    user: DBUser = result.scalars().first()
    if not user:
        return None
    return UserInDB(
        id=str(user.id),
        email=user.email,
        hashed_password=user.hashed_password,
        is_admin=user.is_admin,
        is_premium=user.is_premium
    )


async def get_user_by_id(
    db: AsyncSession,
    user_id: int
) -> Optional[UserInDB]:
    """
    Recherche un utilisateur par son ID. Retourne un UserInDB ou None.
    """
    result = await db.execute(
        select(DBUser).where(DBUser.id == user_id)
    )
    user: DBUser = result.scalars().first()
    if not user:
        return None
    return UserInDB(
        id=str(user.id),
        email=user.email,
        hashed_password=user.hashed_password,
        is_admin=user.is_admin,
        is_premium=user.is_premium
    )


async def list_users(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> List[UserPublic]:
    """
    Liste les utilisateurs (pagination basique), retourne UserPublic (sans mot de passe).
    """
    result = await db.execute(
        select(DBUser).offset(skip).limit(limit)
    )
    users: List[DBUser] = result.scalars().all()
    return [
        UserPublic(
            id=str(u.id),
            email=u.email,
            is_admin=u.is_admin
        )
        for u in users
    ]


async def create_user(
    db: AsyncSession,
    user_in: UserCreate,
    hashed_password: str
) -> UserInDB:
    """
    Crée un nouvel utilisateur en base et renvoie un UserInDB.
    """
    db_user = DBUser(
        email=user_in.email,
        hashed_password=hashed_password,
        is_admin=False
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return UserInDB(
        id=str(db_user.id),
        email=db_user.email,
        hashed_password=db_user.hashed_password,
        is_admin=db_user.is_admin,
    )

async def get_all_users(db: AsyncSession) -> list[UserInDB]:
    result = await db.execute(select(User).order_by(User.email))
    return result.scalars().all()

async def update_user_is_premium(
    db: AsyncSession,
    user_id: int,
    is_premium: bool
) -> None:
    """
    Active ou désactive le flag is_premium pour l'utilisateur donné.
    """
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(is_premium=is_premium)
    )
    await db.commit()

async def delete_user_by_id(db: AsyncSession, user_id: int) -> None:
    """
    Supprime les sessions puis l’utilisateur.
    """
    # 1) Supprimer toutes les sessions de l’utilisateur
    await db.execute(
        delete(DBSession).where(DBSession.user_id == user_id)
    )
    # 2) (Éventuellement) supprimer d’autres dépendances :
    #    await db.execute(delete(Analyses).where(Analyses.user_id == user_id))
    # 3) Supprimer l’utilisateur
    await db.execute(
        delete(DBUser).where(DBUser.id == user_id)
    )
    await db.commit()