# app/routers/skin.py
import os, traceback, logging
from typing import List, Any, Dict
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.storage import save_image
from app.services.skin_analyzer import analyze_image
from app.models.session import SkinAnalysisResponse
from app.models.stats import StatsResponse
from app.models.trend import TrendResponse
from app.crud.session import (
    create_session, get_sessions_for_user, delete_session,
    get_all_sessions, get_stats, get_trend
)
from app.routers.auth import get_current_user, admin_required, get_db
from app.routers.dependencies import subscription_required

router = APIRouter(prefix="/skin", tags=["skin"])
logger = logging.getLogger("skin")

# --- Endpoint gratuit : analyse de base (requiert login) ---
@router.post(
    "/analyze",
    summary="Upload et analyse de l’image de la peau",
    response_model=SkinAnalysisResponse,
    dependencies=[Depends(get_current_user)]  # accès gratuit mais login requis
)
async def analyze(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit être une image."
        )

    # Sauvegarde et analyse
    file_path, image_url = await save_image(file)
    logger.info(f"Lancement de l’analyse IA pour fichier {file_path!r}")
    try:
        analysis = await analyze_image(file_path)
        scores = analysis["scores"]
        annotations = analysis["annotations"]
        annotated_path = analysis["annotated_path"]
        annotated_filename = os.path.basename(annotated_path)
        annotated_image_url = f"{settings.IMAGE_URL_PREFIX}/{annotated_filename}"
    except Exception as e:
        logger.error(f"Analyse IA échouée : {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erreur du service d'analyse d'images : {e}"
        )

    session_record = await create_session(
        db=db,
        user_id=int(current_user.id),
        image_url=image_url,
        scores=scores,
        annotations=annotations,
        annotated_image_url=annotated_image_url
    )

    return {
        "session_id": session_record.id,
        "image_url": image_url,
        "annotated_image_url": annotated_image_url,
        "scores": scores,
        "annotations": annotations,
        "timestamp": session_record.timestamp.isoformat()
    }

# --- Endpoint premium : accès illimité aux analyses (abonnement requis) ---
@router.post(
    "/analyze-premium",
    summary="Analyse illimitée (abonnés premium)",
    response_model=SkinAnalysisResponse,
    dependencies=[Depends(subscription_required)]  # accès premium uniquement
)
async def analyze_premium(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(subscription_required)
):
    # Même logique que /analyze, mais accessible uniquement aux abonnés
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit être une image."
        )
    file_path, image_url = await save_image(file)
    try:
        analysis = await analyze_image(file_path)
        scores = analysis["scores"]
        annotations = analysis["annotations"]
        annotated_path = analysis["annotated_path"]
        annotated_filename = os.path.basename(annotated_path)
        annotated_image_url = f"{settings.IMAGE_URL_PREFIX}/{annotated_filename}"
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erreur du service d'analyse d'images : {e}"
        )
    session_record = await create_session(
        db=db,
        user_id=int(current_user.id),
        image_url=image_url,
        scores=scores,
        annotations=annotations,
        annotated_image_url=annotated_image_url
    )
    return {
        "session_id": session_record.id,
        "image_url": image_url,
        "annotated_image_url": annotated_image_url,
        "scores": scores,
        "annotations": annotations,
        "timestamp": session_record.timestamp.isoformat()
    }

# --- Route ADMIN : historique global (admin requis) ---
@router.get(
    "/admin/history",
    response_model=List[Dict],
    summary="(ADMIN) Récupère l'historique de toutes les analyses",
    dependencies=[Depends(admin_required)]
)
async def admin_history(
    db: AsyncSession = Depends(get_db)
):
    sessions = await get_all_sessions(db)
    return [
        {"session_id": s.id, "user_id": s.user_id, "image_url": s.image_url,
         "annotations": s.annotations, "annotated_image_url": s.annotated_image_url,
         "scores": s.scores, "timestamp": s.timestamp} for s in sessions
    ]

# --- Historique utilisateur (login requis) ---
@router.get(
    "/history",
    response_model=List[Dict],
    summary="Récupère l'historique des analyses de l'utilisateur",
    dependencies=[Depends(get_current_user)]
)
async def history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    sessions = await get_sessions_for_user(db, int(current_user.id), skip, limit)
    return [
        {"session_id": s.id, "image_url": s.image_url, "annotations": s.annotations,
         "annotated_image_url": s.annotated_image_url, "scores": s.scores,
         "timestamp": s.timestamp} for s in sessions
    ]

# --- Supprimer une analyse (login requis) ---
@router.delete(
    "/history/{session_id}",
    status_code=204,
    summary="Supprime une analyse de l'utilisateur",
    dependencies=[Depends(get_current_user)]
)
async def delete_history_item(
    session_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.crud.session import get_session_by_id
    session_record = await get_session_by_id(db, session_id)
    if not session_record or session_record.user_id != int(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session non trouvée")
    await delete_session(db, session_id)
    return

# --- Statistiques utilisateur (login requis) ---
@router.get(
    "/stats",
    response_model=StatsResponse,
    summary="Statistiques agrégées des analyses de l'utilisateur",
    dependencies=[Depends(get_current_user)]
)
async def stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return await get_stats(db, int(current_user.id))

# --- Tendance utilisateur (login requis) ---
@router.get(
    "/trend",
    response_model=TrendResponse,
    summary="Évolution des moyennes par période (month|week)",
    dependencies=[Depends(get_current_user)]
)
async def trend(
    period: str = Query("month", regex="^(month|week)$"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = await get_trend(db, int(current_user.id), period)
    return {"trend": data}
