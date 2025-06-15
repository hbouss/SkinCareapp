# app/db/models.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from pydantic import BaseModel
from typing    import List

# 1) Base pour tous vos modèles
Base = declarative_base()

# 2) Définition de la table "users"
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    subscription_expiry = Column(DateTime, nullable=True)
    sessions = relationship("Session", back_populates="user", cascade="all, delete")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String, nullable=False)
    annotated_image_url = Column(String, nullable=True)
    scores = Column(JSONB, nullable=False)       # stocke le dict {"acne":0.1, …}
    annotations = Column(JSONB, nullable=False, default=list)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")