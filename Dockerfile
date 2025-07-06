# syntax=docker/dockerfile:1
FROM python:3.11-slim

# 1) Installer les libs système dont OpenCV a besoin
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libgl1 libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

# 2) Copier et installer les dépendances Python
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3) Copier le code
COPY . .

# 4) Exposer le port et lancer uvicorn
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]