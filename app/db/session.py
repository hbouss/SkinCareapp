# app/db/session.py
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models import Base

# 1) On parse la chaîne pour pouvoir la modifier
url = make_url(settings.DATABASE_URL)

# 2) Si c'est postgresql « synchrone », on le force en asyncpg
if url.drivername == "postgresql":
    url = url.set(drivername="postgresql+asyncpg")

# 3) On crée l’engine asynchrone **avec** l’URL corrigée
engine = create_async_engine(url, echo=True)

# 4) Session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# 5) Création des tables au démarrage
async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)