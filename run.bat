@echo off
echo =========================================
echo  🐍 Activating Virtual Environment...
echo =========================================
call .\venv\Scripts\activate.bat

echo 🚀 Starting FastAPI Server...
echo 🌐 Server will run at: http://127.0.0.1:8000
echo =========================================
python -m uvicorn main:app --reload