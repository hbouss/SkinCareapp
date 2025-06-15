# app/crud/session.py

from typing import List, Dict

from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.models import Session as DBSession
from datetime import datetime
from sqlalchemy import func, cast, extract
from sqlalchemy.types import Float
from collections import defaultdict
from calendar import month_name

async def create_session(
    db: AsyncSession,
    user_id: int,
    image_url: str,
    annotated_image_url: str,
    scores: dict,
    annotations: list
) -> DBSession:
    new = DBSession(
        user_id=user_id,
        image_url=image_url,
        annotated_image_url=annotated_image_url,
        scores=scores,
        annotations=annotations,
        timestamp=datetime.utcnow()
    )
    db.add(new)
    await db.commit()
    await db.refresh(new)
    return new

async def get_sessions_for_user(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[DBSession]:
    result = await db.execute(
        select(DBSession)
        .where(DBSession.user_id == user_id)
        .order_by(DBSession.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def delete_session(db: AsyncSession, session_id: int) -> None:
    await db.execute(
        delete(DBSession).where(DBSession.id == session_id)
    )
    await db.commit()

async def get_session_by_id(db: AsyncSession, session_id: int) -> DBSession | None:
    """
    Retourne l'objet Session SQLAlchemy ou None si introuvable.
    """
    result = await db.execute(
        select(DBSession).where(DBSession.id == session_id)
    )
    return result.scalar_one_or_none()

async def get_all_sessions(db: AsyncSession) -> List[DBSession]:
    """
    Retourne toutes les sessions en base, triées par date décroissante.
    Usage réservé à l'admin.
    """
    result = await db.execute(
        select(DBSession)
        .order_by(DBSession.timestamp.desc())
    )
    return result.scalars().all()

LABELS = [
    "Acne",
    "Dark-Circle",
    "Dry-Skin",
    "EyeBags",
    "Normal-Skin",
    "Oily-Skin",
    "Pores",
    "Spots",
    "Wrinkles",
]

async def get_stats(db: AsyncSession, user_id: int) -> dict:
    """
    Retourne pour un user donné :
      - total_sessions : int
      - by_label : liste de { label, count, percent }
    """

    # 1) Total d’analyses
    total_q = await db.execute(
        select(func.count(DBSession.id))
        .where(DBSession.user_id == user_id)
    )
    total = total_q.scalar_one()

    # 2) Pour chaque label, compter les sessions où scores[label] > 0
    stats_by_label = []
    for label in LABELS:
        count_q = await db.execute(
            select(func.count(DBSession.id))
            .where(DBSession.user_id == user_id)
            # PostgreSQL JSONB extraction : scores ->> 'label' casté en float
            .where(
                cast(
                    DBSession.scores[label].astext,
                    Float
                ) > 0.0
            )
        )
        count = count_q.scalar_one()
        percent = round((count / total * 100), 1) if total > 0 else 0.0
        stats_by_label.append({
            "label":   label,
            "count":   count,
            "percent": percent,
        })

    return {
        "total_sessions": total,
        "by_label":       stats_by_label
    }

async def get_trend(
    db: AsyncSession,
    user_id: int,
    period: str  # "month" ou "week"
) -> List[Dict]:
    """
    Retourne la liste de points de tendance, selon 'period':
     - 'month'  ⇒ group by année-mois
     - 'week'   ⇒ group by iso_week
    """
    if period == "month":
        # on regroupe par YYYY-MM
        stmt = (
          select(
            func.to_char(DBSession.timestamp, "Mon YYYY").label("month"),
            func.to_char(DBSession.timestamp, "IYYY\"-\"IW").label("week"),
            # pour chaque label, moyenne de scores->>'label'
            *[
              func.avg((DBSession.scores[label].as_float())).label(label)
              for label in ["acne","wrinkles","redness","dryness","eyebags"]
            ]
          )
          .where(DBSession.user_id == user_id)
          .group_by("month","week")
          .order_by(func.min(DBSession.timestamp))
        )
    else:
        # group by année & semaine ISO
        stmt = (
          select(
            func.to_char(DBSession.timestamp, "Mon YYYY").label("month"),
            func.to_char(DBSession.timestamp, "IYYY\"-\"IW").label("week"),
            *[
              func.avg((DBSession.scores[label].as_float())).label(label)
              for label in ["acne","wrinkles","redness","dryness","eyebags"]
            ]
          )
          .where(DBSession.user_id == user_id)
          .group_by("month","week")
          .order_by(func.min(DBSession.timestamp))
        )
    result = await db.execute(stmt)
    rows = result.all()
    trend = []
    for row in rows:
        month, week, *avgs = row
        trend.append({
            "month": month,
            "week": week,
            "averages": {
              label: float(avgs[i] or 0) for i,label in enumerate(
                ["acne","wrinkles","redness","dryness","eyebags"]
              )
            }
        })
    return trend