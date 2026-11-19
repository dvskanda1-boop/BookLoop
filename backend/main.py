import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.database import engine, Base
from backend.seed_data import seed_database

# Routers
from backend.routers.auth import router as auth_router
from backend.routers.books import router as books_router
from backend.routers.orders import router as orders_router
from backend.routers.delivery import router as delivery_router
from backend.routers.reviews import router as reviews_router
from backend.routers.wishlist import router as wishlist_router
from backend.routers.addresses import router as addresses_router
from backend.routers.exchanges import router as exchanges_router
from backend.routers.credits import router as credits_router
from backend.routers.ai import router as ai_router
from backend.routers.users import router as users_router
from backend.routers.admin import router as admin_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bookloop")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BookLoop AI database and schemas...")
    Base.metadata.create_all(bind=engine)
    seed_database()
    logger.info("BookLoop AI Second-Hand Marketplace backend ready.")
    yield
    logger.info("Shutting down BookLoop AI backend.")

app = FastAPI(
    title="BookLoop AI - Second-Hand Book Marketplace API",
    description="Full-stack AI-powered second-hand book e-commerce platform with distance estimation and Gemini price intelligence.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React/Vite development, production frontends, and Local Area Network devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bookloop-three.vercel.app",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ],
    allow_origin_regex=r"https?://.*\.vercel\.app|https?://.*\.trycloudflare\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API Routers
app.include_router(auth_router)
app.include_router(books_router)
app.include_router(orders_router)
app.include_router(delivery_router)
app.include_router(reviews_router)
app.include_router(wishlist_router)
app.include_router(addresses_router)
app.include_router(exchanges_router)
app.include_router(credits_router)
app.include_router(ai_router)
app.include_router(users_router)
app.include_router(admin_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "platform": "BookLoop AI Second-Hand Marketplace",
        "version": "2.0.0",
        "database": "sqlite_connected",
        "gemini_model": settings.GEMINI_MODEL,
        "api_key_configured": bool(settings.GEMINI_API_KEY)
    }

# Serve Frontend SPA from dist if built
DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST_DIR.exists():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json"]:
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(DIST_DIR / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to BookLoop AI Second-Hand Book Marketplace API",
            "version": "2.0.0",
            "docs_url": "/docs",
            "status": "online"
        }
