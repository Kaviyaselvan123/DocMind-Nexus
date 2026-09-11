import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.db.session import init_db
from backend.scheduler.compliance_job import start_scheduler, stop_scheduler
from backend.api.routes_auth import router as auth_router
from backend.api.routes_documents import router as documents_router
from backend.api.routes_audit import router as audit_router
from backend.api.routes_chat import router as chat_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("docmind")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DocMind AI database...")
    init_db()
    logger.info("Starting background compliance scheduler...")
    start_scheduler()
    yield
    logger.info("Shutting down background services...")
    stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Document Management System powered by Model Context Protocol (MCP)",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(documents_router, prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])
app.include_router(audit_router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit & Compliance"])
app.include_router(chat_router, tags=["Chat"])

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
