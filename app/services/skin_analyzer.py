# app/services/skin_analyzer.py
import os
from uuid import uuid4
from typing import Dict, List, TypedDict

import cv2
import httpx

from app.core.config import settings

class Annotation(TypedDict):
    x: float; y: float; width: float; height: float; label: str

ALL_CLASSES = [
    "Acne","Dark-Circle","Dry-Skin","EyeBags",
    "Normal-Skin","Oily-Skin","Pores","Spots","Wrinkles",
]

async def analyze_image(image_path: str) -> Dict[str, object]:
    # 1) charge l’image
    img = cv2.imread(image_path)
    if img is None:
        raise RuntimeError("Impossible de lire l'image")
    h, w = img.shape[:2]

    # 2) construis l’URL Roboflow (sans "/model" ni "/infer")
    url = f"{settings.ROBOFLOW_INFERENCE_API_URL}/{settings.ROBOFLOW_INFERENCE_MODEL_ID}"
    params = {"api_key": settings.ROBOFLOW_INFERENCE_API_KEY}

    # 3) fais le POST multipart/form-data
    async with httpx.AsyncClient(timeout=30) as client:
        with open(image_path, "rb") as f:
            files = {"file": (os.path.basename(image_path), f, "application/octet-stream")}
            resp = await client.post(url, params=params, files=files)

        resp.raise_for_status()
        data = resp.json()

    preds = data.get("predictions", [])

    # 4) calcule scores et annotations
    scores = {cls: 0.0 for cls in ALL_CLASSES}
    annotations: List[Annotation] = []
    for p in preds:
        if p["class"] in scores:
            scores[p["class"]] = p["confidence"]
        cx, cy, pw, ph = p["x"], p["y"], p["width"], p["height"]
        annotations.append({
            "x": cx / w, "y": cy / h,
            "width": pw / w, "height": ph / h,
            "label": p["class"]
        })

    # 5) dessine les bounding boxes
    vis = img.copy()
    for ann in annotations:
        cx, cy = int(ann["x"]*w), int(ann["y"]*h)
        bw, bh = int(ann["width"]*w), int(ann["height"]*h)
        x1, y1 = cx-bw//2, cy-bh//2
        x2, y2 = x1+bw, y1+bh
        cv2.rectangle(vis, (x1,y1),(x2,y2),(232,106,74),2)
        cv2.putText(vis, ann["label"], (x1, y1-6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (232,106,74), 2)

    # 6) sauvegarde annotée
    os.makedirs(settings.IMAGE_SAVE_DIR, exist_ok=True)
    name = f"{uuid4().hex}_annotated.jpg"
    out = os.path.join(settings.IMAGE_SAVE_DIR, name)
    cv2.imwrite(out, vis)

    return {"scores": scores, "annotations": annotations, "annotated_path": out}