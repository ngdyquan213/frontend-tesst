FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /build

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md requirements.lock /build/
COPY app /build/app

RUN python -m pip install --upgrade pip==25.2 setuptools==82.0.1 wheel==0.46.3 \
    && pip wheel --wheel-dir /wheels -r /build/requirements.lock \
    && pip wheel --wheel-dir /wheels --no-deps /build


FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup --home /app appuser

COPY --from=builder /wheels /wheels
RUN python -m pip install --upgrade pip==25.2 \
    && pip install /wheels/*.whl

COPY app /app/app
COPY alembic /app/alembic
COPY alembic.ini /app/
COPY scripts /app/scripts

RUN mkdir -p /app/uploads \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips=\"${FORWARDED_ALLOW_IPS:-127.0.0.1}\""]
