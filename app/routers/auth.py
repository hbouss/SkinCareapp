# app/routers/auth.py

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from jose import JWTError

from app.models.user import UserCreate, UserPublic
from app.crud.user import get_user_by_email, create_user as crud_create_user, delete_user_by_id
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.core.config import settings
from app.db.session import AsyncSessionLocal

router = APIRouter(prefix="/auth", tags=["auth"])

# 1) OAuth2 scheme pour Swagger UI et Depends
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# 2) Dépendance pour la session DB
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

# 3) Dépendance pour récupérer l'utilisateur courant depuis le token
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> UserPublic:
    """
    Décode le JWT, récupère l'utilisateur en DB et renvoie un UserPublic.
    Lève 401 si le token est invalide, 404 si l'utilisateur n'existe pas.
    """
    try:
        payload = decode_access_token(token)
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")

    # On retourne un UserPublic (sans hashed_password)
    return UserPublic(id=user.id, email=user.email, is_admin=user.is_admin, is_premium=user.is_premium)

def admin_required(current_user: UserPublic = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé à l’administrateur")
    return current_user


@router.post(
    "/signup",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un nouvel utilisateur"
)
async def signup(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Inscription :
    - Vérifie qu'aucun utilisateur n'existe avec cet email.
    - Hache le mot de passe.
    - Crée et renvoie le UserPublic.
    """
    existing = await get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email déjà utilisé"
        )
    hashed = hash_password(user_in.password)
    new_user = await crud_create_user(db, user_in, hashed)
    return UserPublic(id=new_user.id, email=new_user.email, is_admin=new_user.is_admin)


@router.post(
    "/login",
    summary="Connexion et obtention d'un JWT",
    response_model=dict
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Connexion :
    - Vérifie l'utilisateur et le mot de passe.
    - Génère et renvoie le token JWT.
    """
    user = await get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Récupère les infos de l'utilisateur connecté"
)
async def read_users_me(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Renvoie directement le UserPublic extrait du token.
    """
    return current_user


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer le compte de l’utilisateur connecté"
)
async def delete_current_user(
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Supprime d'abord toutes les sessions puis l’utilisateur.
    """
    # Ici on délègue au CRUD :
    await delete_user_by_id(db, int(current_user.id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)