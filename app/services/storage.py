# app/services/storage.py
import os
from uuid import uuid4
import aiofiles
from fastapi import UploadFile

# 1) Imports pour la conversion HEIC → JPEG
from PIL import Image
import pillow_heif

from app.core.config import settings

async def save_image(file: UploadFile) -> tuple[str, str]:
    """
    Sauvegarde l’UploadFile sur le disque, convertit les HEIC/HEIF en JPEG si besoin,
    et renvoie un tuple (file_path, image_url).
    """

    # 1) Générer un nom unique basé sur l'extension d'origine
    original_ext = file.filename.rsplit(".", 1)[-1].lower()
    base_name = uuid4().hex

    # 2) Déterminer le nom de fichier final et si on doit convertir
    if original_ext in ("heic", "heif"):
        # on sortira un JPEG
        filename = f"{base_name}.jpg"
        needs_conversion = True
    else:
        filename = f"{base_name}.{original_ext}"
        needs_conversion = False

    # 3) Chemins : dossier de sauvegarde + temporaire
    os.makedirs(settings.IMAGE_SAVE_DIR, exist_ok=True)
    final_path = os.path.join(settings.IMAGE_SAVE_DIR, filename)
    temp_path = final_path + (".heic" if needs_conversion else "")

    # 4) Écriture asynchrone du fichier brut
    async with aiofiles.open(temp_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # 5) Si HEIC/HEIF, convertir en JPEG
    if needs_conversion:
        # Enregistrer l'opener HEIF pour Pillow
        pillow_heif.register_heif_opener()
        # Ouvrir et convertir
        with Image.open(temp_path) as img:
            rgb = img.convert("RGB")
            rgb.save(final_path, format="JPEG")
        # Supprimer le fichier temporaire
        os.remove(temp_path)
    else:
        # Sinon, on renomme simplement le temp en final
        os.replace(temp_path, final_path)

    # 6) Construire l'URL publique pour l'accès
    image_url = f"{settings.IMAGE_URL_PREFIX}/{filename}"

    return final_path, image_url