FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml ./

RUN uv sync

COPY src/ ./src/

ENV PYTHONPATH=/app
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8002

CMD ["python", "-m", "src.main"]