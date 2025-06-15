# app/services/interpret_service.py
import openai
from app.core.config import settings
from typing import Dict, List
from fastapi.concurrency import run_in_threadpool

# Initialisation du client OpenAI V1
# (depuis openai>=1.0, on utilise la classe OpenAI)
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

async def interpret_scores(scores: Dict[str, float]) -> Dict[str, object]:
    """
    Envoie les scores à GPT pour obtenir :
      - un texte d'interprétation
      - une liste de suggestions de prestations
    """
    # Construire le prompt
    prompt_lines = [
        "Vous êtes un expert en soin de la peau pour l'institut SBeauty (Mons, Belgique).",
        "Les prestations disponibles sont : microneedling, hydrafacial 5en1, BB Glow, radiofréquence, lifting coréen non chirurgical, dermaplanning.",
        "Voici les scores d'analyse :"
    ]
    for cls, val in scores.items():
        prompt_lines.append(f"- {cls} : {val*100:.0f}%")
    prompt_lines.extend([
                "",
                "1) Donnez une interprétation concise de ces résultats.",
                "2) En tenant compte des prestations SBeauty listées, proposez EXACTEMENT 3 prestations les plus adaptées.",
        ])
    prompt = "\n".join(prompt_lines)

    # Appel bloquant synchronisé dans un thread séparé
    response = await run_in_threadpool(
        client.chat.completions.create,
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=300,
    )

    content = response.choices[0].message.content.strip()
    # Séparez interprétation / suggestions
    parts = content.split("Suggestions:")
    interpretation = parts[0].replace("Interprétation:", "").strip()
    suggestions: List[str] = []
    if len(parts) > 1:
        for line in parts[1].splitlines():
            text = line.strip().lstrip("•0123456789.) ").strip()
            if text:
                suggestions.append(text)

    return {"interpretation": interpretation, "suggestions": suggestions}