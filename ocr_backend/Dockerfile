# CPU-only Dockerfile for Render deployment
FROM python:3.12-slim

# Install system dependencies required by OpenCV and PaddleOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
# PaddlePaddle CPU version must be installed first
RUN pip install --upgrade pip setuptools wheel

COPY requirements.txt .
RUN pip install paddlepaddle==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
RUN pip install -r requirements.txt

# Copy app files
COPY . .

RUN mkdir -p uploads output

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
