# BookLoop AI – Complete Installation & Setup Guide

This guide walks through setting up and running **BookLoop AI – Intelligent Second-Hand Book Marketplace** from scratch on any development machine.

---

## 1. System Requirements

- **Python**: Version 3.10, 3.11, 3.12, 3.13, or 3.14
- **Node.js**: Version 18.x, 20.x or higher (with npm)
- **Operating System**: Windows 10/11, macOS, or Linux

---

## 2. Step-by-Step Installation

### Step 1: Open the Project Root
```powershell
cd "c:\Users\D V SKANDA\OneDrive\Desktop\bookapi"
```

### Step 2: Activate the Python Virtual Environment
```powershell
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
```

### Step 3: Install Backend Dependencies
```powershell
pip install -r requirements.txt
```
*Key packages installed:* `fastapi`, `uvicorn`, `sqlalchemy`, `google-genai`, `pyjwt`, `bcrypt`, `pydantic`, `pytest`.

### Step 4: Configure Environment Variables
Verify your `.env` file in the root folder contains:
```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
GEMINI_MODEL=gemini-3.5-flash-lite

# Security
JWT_SECRET_KEY=bookloop_ai_secure_development_secret_key_2026_xyz
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database & Server
DATABASE_URL=sqlite:///./bookloop.db
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000

# Courier Delivery Defaults
DEFAULT_BASE_DELIVERY_FEE=35.0
DEFAULT_PER_KM_RATE=1.8
DEFAULT_PER_250G_RATE=5.0
DEFAULT_FREE_DELIVERY_THRESHOLD=800.0
```

### Step 5: Seed the SQLite Database
Initialize and seed realistic second-hand book listings with original MRP, resale prices, Indian PIN codes, and verified reviews:
```powershell
python -m backend.seed_data
```

### Step 6: Build the Frontend SPA Bundle
```powershell
cd frontend
npm install
npm run build
cd ..
```

---

## 3. Running the Application

### Launch Single-Server Backend & SPA:
```powershell
python run_backend.py
```
*This starts the FastAPI server on port 8000, serving the complete React production bundle from `frontend/dist/`!*

### Access in Browser:
- **Application Web UI**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 4. Running Automated Tests
```powershell
pytest tests/test_backend.py -v
```
All 13 test suites will run and verify second-hand pricing constraints, distance calculation, order locking, and AI agent tools.
