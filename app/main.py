# app/main.py

from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_models
from app.routers import auth, skin  # importez votre module auth
from fastapi.staticfiles import StaticFiles
from app.routers import interpret
from app.routers.subscription import router as subscription_router
from app.routers.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Au démarrage, créez les tables si nécessaire
    await init_models()
    yield
    # (Optionnel) au shutdown : libération de ressources

app = FastAPI(
    title="SkinCoach API",
    version="0.1.0",
    lifespan=lifespan
)

# --- (Optionnel mais recommandé) CORS pour autoriser le front React Native ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # en prod, remplacez "*" par l’URL de votre app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Montage des routers ---
app.include_router(
    auth.router,
    tags=["auth"]
)
app.include_router(skin.router, tags=["skin"])

app.include_router(interpret.router)


app.include_router(subscription_router)

app.include_router(admin_router)

# Sert le dossier ./images sous /images
app.mount(
    settings.IMAGE_URL_PREFIX,
    StaticFiles(directory=settings.IMAGE_SAVE_DIR),
    name="images"
)

# --- Vos endpoints de test ---
@app.get("/")
async def root():
    return {"message": "SkinCoach API is up!"}

@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)