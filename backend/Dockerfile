FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Build-time env only for collectstatic; runtime env overrides these values.
ENV SECRET_KEY=build-time-placeholder-not-for-runtime \
    DEBUG=False \
    ALLOWED_HOSTS=*

# Run collectstatic for production
RUN python manage.py collectstatic --noinput

EXPOSE 8000
