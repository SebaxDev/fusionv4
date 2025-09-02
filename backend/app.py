from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import time
import logging
from contextlib import asynccontextmanager

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Importar configuración
from .config import settings
from .utils.data_manager import initialize_data_manager, DataManager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting CRM FusionV4 API...")
    
    dm = initialize_data_manager()
    if dm:
        await dm.load_all_data()
        app.state.data_manager = dm
        logger.info("✅ DataManager initialized and data loaded successfully.")
    else:
        app.state.data_manager = None
        logger.error("❌ DataManager failed to initialize. Application will run with limited functionality.")

    yield
    
    # Shutdown
    logger.info("🛑 Stopping application...")
    if hasattr(app.state, 'data_manager') and app.state.data_manager:
        # If cleanup logic is needed in the future, it goes here.
        pass
    logger.info("✅ Application stopped.")

# Crear aplicación FastAPI con lifespan
app = FastAPI(
    title=settings.app_name,
    description="API para el sistema CRM con Google Sheets - Sistema de gestión de reclamos técnicos",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configurar middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https?://.*\.(render|onrender)\.com",
)

# Compresión GZIP para mejor performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Importar y configurar rutas
from .routes import reclamos, auth, reportes, clientes, cierre #, tecnicos, notifications

# Importar las nuevas rutas de métricas
# This is disabled for now as the module is not fully implemented
METRICS_ENABLED = False
# try:
#     from .routes import metricas
#     METRICS_ENABLED = True
#     logger.info("✅ Módulo de métricas importado correctamente")
# except ImportError as e:
#     METRICS_ENABLED = False
#     logger.warning(f"⚠️  Módulo de métricas no disponible: {str(e)}")

# Incluir rutas
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(reclamos.router, prefix="/api/v1/reclamos", tags=["Reclamos"])
app.include_router(clientes.router, prefix="/api/v1/clientes", tags=["Clientes"])
# app.include_router(tecnicos.router, prefix="/api/v1/tecnicos", tags=["Técnicos"])
app.include_router(reportes.router, prefix="/api/v1/reportes", tags=["Reportes"])
app.include_router(cierre.router, prefix="/api/v1/cierre", tags=["Cierre de Reclamos"])
# app.include_router(notifications.router, prefix="/api/v1/notificaciones", tags=["Notificaciones"])

# Incluir rutas de métricas si están disponibles
if METRICS_ENABLED:
    app.include_router(metricas.router, prefix="/api/v1", tags=["Métricas"])
    logger.info("✅ Rutas de métricas incluidas")

# Middleware para logging de requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Skip logging for health checks and docs in production
    if (settings.is_render and 
        request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]):
        response = await call_next(request)
        return response
    
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Log metrics for dashboard endpoints
    if request.url.path.startswith('/api/v1/reclamos/metricas') or request.url.path.startswith('/api/v1/reclamos/estadisticas'):
        logger.info(f"📊 Métricas - {request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    
    # Log only slow requests or errors in production
    if settings.is_render:
        if process_time > 1.0 or response.status_code >= 400:
            logger.warning(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    else:
        logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    
    return response

# Rutas básicas
@app.get("/")
async def root():
    return {
        "message": "CRM FusionV4 API funcionando correctamente",
        "version": settings.app_version,
        "description": "Sistema de gestión de reclamos técnicos y clientes",
        "docs": "/docs",
        "health": "/health",
        "environment": "production" if settings.is_render else "development",
        "features": {
            "dashboard_metrics": METRICS_ENABLED,
            "authentication": True,
            "reclamos": True,
            "clientes": True,
            "tecnicos": True,
            "reportes": True,
            "notificaciones": True
        }
    }

@app.get("/health")
async def health_check(request: Request):
    """
    Provides a health check for the application and its connection to Google Sheets.
    """
    dm: DataManager = request.app.state.data_manager
    data_loaded = False
    if dm and not dm.claims_df.empty:
        data_loaded = True

    return {
        "status": "healthy" if dm and data_loaded else "unhealthy",
        "version": settings.app_version,
        "environment": "production" if settings.is_render else "development",
        "data_manager_initialized": dm is not None,
        "data_loaded": data_loaded,
        "loaded_claims": len(dm.claims_df) if data_loaded else 0
    }

# Manejo de errores global
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint no encontrado",
            "path": request.url.path,
            "available_endpoints": [
                "/docs",
                "/health",
                "/system/info",
                "/config/check",
                "/api/v1/test/metrics"
            ] + (["/api/v1/reclamos/metricas-dashboard"] if METRICS_ENABLED else [])
        }
    )

@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Error interno del servidor",
            "path": request.url.path,
            "timestamp": time.time()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no manejado: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Error interno del servidor",
            "detail": str(exc) if settings.DEBUG_MODE else "Contacte al administrador",
            "timestamp": time.time()
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0" if settings.is_render else "127.0.0.1"
    
    print(f"🚀 Iniciando {settings.app_name} v{settings.app_version}")
    print(f"🌐 Servidor: {host}:{port}")
    print(f"📚 Documentación: http://{host}:{port}/docs")
    print(f"🔧 Entorno: {'Producción' if settings.is_render else 'Desarrollo'}")
    print(f"📊 Métricas: {'Habilitadas' if METRICS_ENABLED else 'Deshabilitadas'}")
    print(f"🐍 Python: {os.sys.version}")
    print("─" * 50)
    
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        reload=settings.is_development,
        log_level="info" if settings.is_render else "debug",
        timeout_keep_alive=30
    )