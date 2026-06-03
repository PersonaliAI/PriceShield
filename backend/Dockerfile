FROM python:3.13-slim

WORKDIR /workspace

# All packages have pre-built wheels — no C/Rust compilation needed.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
