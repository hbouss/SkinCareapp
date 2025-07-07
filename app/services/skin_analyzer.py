# app/services/skin_analyzer.py
import os
from uuid import uuid4
from typing import Dict, List, TypedDict

import cv2
import httpx

from app.core.config import settings

class Annotation(TypedDict):
    x: float    # ratio du centre en X
    y: float    # ratio du centre en Y
    width: float   # ratio largeur de box
    height: float  # ratio hauteur de box
    label: str

ALL_CLASSES = [
    "Acne", "Dark-Circle", "Dry-Skin", "EyeBags",
    "Normal-Skin", "Oily-Skin", "Pores", "Spots", "Wrinkles",
]

async def analyze_image(image_path: str) -> Dict[str, object]:
    # 1) charge l’image pour ses dimensions
    img = cv2.imread(image_path)
    if img is None:
        raise RuntimeError("Impossible de lire l'image pour normalisation")
    img_h, img_w = img.shape[:2]

    # 2) appel direct à l'API Roboflow
    url = f"{settings.ROBOFLOW_INFERENCE_API_URL}/model/{settings.ROBOFLOW_INFERENCE_MODEL_ID}/infer"
    params = {"api_key": settings.ROBOFLOW_INFERENCE_API_KEY}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # on envoie le fichier en multipart/form-data (httpx s’occupe du header)
        with open(image_path, "rb") as f:
            files = {"file": (os.path.basename(image_path), f, "application/octet-stream")}
            resp = await client.post(url, params=params, files=files)

        resp.raise_for_status()
        result = resp.json()

    preds = result.get("predictions", [])

    # 3) calcul des scores
    scores: Dict[str, float] = {cls: 0.0 for cls in ALL_CLASSES}
    for p in preds:
        cls = p["class"]
        if cls in scores:
            scores[cls] = p["confidence"]

    # 4) normalisation des boxes
    annotations: List[Annotation] = []
    for p in preds:
        cx, cy, w, h = p["x"], p["y"], p["width"], p["height"]
        annotations.append({
            "x":      cx / img_w,
            "y":      cy / img_h,
            "width":  w  / img_w,
            "height": h  / img_h,
            "label":  p["class"]
        })

    # 5) dessine les boxes sur l’image
    annotated = img.copy()
    for ann in annotations:
        cx = int(ann["x"] * img_w)
        cy = int(ann["y"] * img_h)
        bw = int(ann["width"] * img_w)
        bh = int(ann["height"] * img_h)
        x1, y1 = cx - bw // 2, cy - bh // 2
        x2, y2 = x1 + bw, y1 + bh
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (232, 106, 74), 2)
        cv2.putText(
            annotated, ann["label"], (x1, y1 - 6),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (232, 106, 74), 2
        )

    # 6) sauvegarde de l’image annotée
    os.makedirs(settings.IMAGE_SAVE_DIR, exist_ok=True)
    base = uuid4().hex
    annotated_filename = f"{base}_annotated.jpg"
    annotated_path = os.path.join(settings.IMAGE_SAVE_DIR, annotated_filename)
    cv2.imwrite(annotated_path, annotated)

    return {
        "scores": scores,
        "annotations": annotations,
        "annotated_path": annotated_path,
    }