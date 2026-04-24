# CPU-only Dockerfile for Render deployment
FROM python:3.12-slim
 
# Install system dependencies required by OpenCV and PaddleOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*
 
# Set working directory to PARENT of ocr_backend so relative imports work
WORKDIR /workspace
 
# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel
 
COPY requirements.txt .
RUN pip install paddlepaddle==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
RUN pip install -r requirements.txt
 
# Copy app files into ocr_backend/ subfolder so relative imports work
COPY . ./ocr_backend/
 
RUN mkdir -p ocr_backend/uploads ocr_backend/output
 
EXPOSE 8000
 
# Run as a module from parent directory so "from .ocr_utils import" works
CMD ["uvicorn", "ocr_backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
 
