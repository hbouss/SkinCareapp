# par exemple dans app/db/session.py, sous vos définitions de engine et AsyncSessionLocal

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models import Base   # <-- importez votre Base

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Créez les tables si elles n'existent pas (à faire une seule fois, ou au démarrage en dev)
async def init_models():
    async with engine.begin() as conn:
        # crée toutes les tables déclarées dans Base.metadata
        await conn.run_sync(Base.metadata.create_all)