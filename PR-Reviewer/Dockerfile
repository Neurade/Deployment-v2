FROM python:3.12-slim


RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app


COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt


RUN pip install --no-cache-dir debugpy pytest ipython


COPY . .


ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENV=development


EXPOSE 8000

CMD ["uvicorn", "src.api.endpoints:app", "--host", "0.0.0.0", "--port", "8000"]
