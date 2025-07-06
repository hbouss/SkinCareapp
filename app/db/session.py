# par exemple dans app/db/session.py, sous vos définitions de engine et AsyncSessionLocal

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models import Base   # <-- importez votre Base
from sqlalchemy.engine import make_url

# 1) On récupère l'URL et on la corrige si besoin
url_obj = make_url(settings.DATABASE_URL)
if url_obj.drivername == "postgresql":
    url_obj = url_obj.set(drivername="postgresql+asyncpg")

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Créez les tables si elles n'existent pas (à faire une seule fois, ou au démarrage en dev)
async def init_models():
    async with engine.begin() as conn:
        # crée toutes les tables déclarées dans Base.metadata
        await conn.run_sync(Base.metadata.create_all)