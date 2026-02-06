@echo off
REM Usage: test_request.bat path\to\image.jpg
set IMG=%1
if "%IMG%"=="" (
  echo Please provide an image path: test_request.bat test.jpg
  exit /b 1
)
curl -F "file=@%IMG%" http://localhost:8000/api/ocr
