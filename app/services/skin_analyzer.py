# app/services/skin_analyzer.py
import os
from uuid import uuid4

import cv2
from typing import Dict, List, TypedDict
from inference_sdk import InferenceHTTPClient
from app.core.config import settings

class Annotation(TypedDict):
    x: float    # ratio du centre en X
    y: float    # ratio du centre en Y
    width: float   # ratio largeur de box
    height: float  # ratio hauteur de box
    label: str

CLIENT = InferenceHTTPClient(
    api_url=settings.ROBOFLOW_INFERENCE_API_URL,
    api_key=settings.ROBOFLOW_INFERENCE_API_KEY
)

ALL_CLASSES = [
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

async def analyze_image(image_path: str) -> Dict[str, object]:
    # 1) d’abord chargez l’image pour connaître sa résolution
    img = cv2.imread(image_path)
    if img is None:
        raise RuntimeError("Impossible de lire l'image pour normalisation")
    img_h, img_w = img.shape[:2]

    # 2) appelez Roboflow
    result = CLIENT.infer(image_path, model_id=settings.ROBOFLOW_INFERENCE_MODEL_ID)

    preds = result.get("predictions", [])

    # 3) initialisation uniforme
    scores: Dict[str, float] = {cls: 0.0 for cls in ALL_CLASSES}
    for p in preds:
        cls = p["class"]
        if cls in scores:
            scores[cls] = p["confidence"]

    # 4) normalisez les annotations
    annotations: List[Annotation] = []
    for p in preds:
        # Roboflow renvoie x,y center en pixels et width,height en pixels
        cx, cy, w, h = p["x"], p["y"], p["width"], p["height"]
        annotations.append({
            "x":      cx / img_w,
            "y":      cy / img_h,
            "width":  w  / img_w,
            "height": h  / img_h,
            "label":  p["class"]
        })

        # 5) Dessin des bounding boxes
    annotated = img.copy()
    for ann in annotations:
        # reconvertir ratios en pixels
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

    # 6) Sauvegarde de l’image annotée
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