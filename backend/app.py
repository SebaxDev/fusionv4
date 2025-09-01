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
from config import settings

# Configuración del lifespan para mejor manejo de recursos
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    startup_time = time.time()
    logger.info("🚀 Iniciando CRM FusionV4 API...")
    
    try:
        from utils.data_manager import initialize_data_manager
        
        # Inicializar DataManager con la nueva configuración
        app.state.data_manager = initialize_data_manager()
        logger.info("✅ DataManager inicializado correctamente")
        
        # Verificar conexión con Google Sheets
        test_connection = await app.state.data_manager.test_connection()
        if test_connection:
            logger.info("✅ Conexión con Google Sheets establecida")
        else:
            logger.warning("⚠️  No se pudo verificar la conexión con Google Sheets")
        
        # Inicializar cache de métricas si está habilitado
        if hasattr(settings, 'enable_metrics_cache') and settings.enable_metrics_cache:
            from utils.metrics_cache import MetricsCache
            app.state.metrics_cache = MetricsCache()
            logger.info("✅ Cache de métricas inicializado")
        
        logger.info(f"✅ Aplicación iniciada correctamente en {time.time() - startup_time:.2f}s")
        logger.info(f"📊 Entorno: {'Producción' if settings.is_render else 'Desarrollo'}")
        logger.info(f"🔗 Sheets ID: {settings.sheet_id}")
        logger.info(f"📈 Dashboard: Métricas {'habilitadas' if hasattr(settings, 'enable_dashboard_metrics') and settings.enable_dashboard_metrics else 'deshabilitadas'}")
        
    except Exception as e:
        logger.error(f"❌ Error durante el startup: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Deteniendo aplicación...")
    try:
        # Limpiar cache y recursos
        if hasattr(app.state, 'data_manager'):
            await app.state.data_manager.cleanup()
        
        # Limpiar cache de métricas
        if hasattr(app.state, 'metrics_cache'):
            await app.state.metrics_cache.cleanup()
            
        logger.info("✅ Aplicación detenida correctamente")
    except Exception as e:
        logger.error(f"❌ Error durante el shutdown: {str(e)}")

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
from routes import reclamos, auth, reportes, clientes, cierre, tecnicos, notifications

# Importar las nuevas rutas de métricas
try:
    from routes import metricas
    METRICS_ENABLED = True
    logger.info("✅ Módulo de métricas importado correctamente")
except ImportError as e:
    METRICS_ENABLED = False
    logger.warning(f"⚠️  Módulo de métricas no disponible: {str(e)}")

# Incluir rutas
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(reclamos.router, prefix="/api/v1/reclamos", tags=["Reclamos"])
app.include_router(clientes.router, prefix="/api/v1/clientes", tags=["Clientes"])
app.include_router(tecnicos.router, prefix="/api/v1/tecnicos", tags=["Técnicos"])
app.include_router(reportes.router, prefix="/api/v1/reportes", tags=["Reportes"])
app.include_router(cierre.router, prefix="/api/v1/cierre", tags=["Cierre de Reclamos"])
app.include_router(notifications.router, prefix="/api/v1/notificaciones", tags=["Notificaciones"])

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
async def health_check():
    try:
        # Verificar conexión con Google Sheets
        sheets_connected = False
        if hasattr(app.state, 'data_manager'):
            sheets_connected = await app.state.data_manager.test_connection()
        
        # Verificar cache de métricas
        metrics_cache_status = "disabled"
        if hasattr(app.state, 'metrics_cache'):
            metrics_cache_status = "enabled"
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "sheets_connection": "connected" if sheets_connected else "disconnected",
            "metrics_cache": metrics_cache_status,
            "dashboard_metrics": "enabled" if METRICS_ENABLED else "disabled",
            "version": settings.app_version,
            "environment": "production" if settings.is_render else "development",
            "debug_mode": settings.DEBUG_MODE,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }

@app.get("/system/info")
async def system_info():
    """Endpoint para obtener información detallada del sistema"""
    import platform
    import psutil
    
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": "production" if settings.is_render else "development",
        "sheets_id": settings.sheet_id,
        "backend": "FastAPI + Python",
        "frontend": "React + Material-UI",
        "database": "Google Sheets",
        "debug_mode": settings.DEBUG_MODE,
        "is_render": settings.is_render,
        "is_development": settings.is_development,
        "metrics_enabled": METRICS_ENABLED,
        "system": {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "memory_usage": f"{psutil.Process().memory_info().rss / 1024 / 1024:.1f} MB",
            "cpu_count": psutil.cpu_count()
        },
        "features": {
            "technicians_count": len(settings.tecnicos_disponibles),
            "sectors_count": len(settings.sectores_disponibles),
            "claim_types_count": len(settings.tipos_reclamo),
            "notification_types": len(settings.notification_types),
            "dashboard_metrics": METRICS_ENABLED
        }
    }

@app.get("/config/check")
async def config_check():
    """Verificar que todas las configuraciones estén cargadas correctamente"""
    
    config_checks = {
        "sheets_id_configured": bool(settings.sheet_id),
        "google_credentials_configured": bool(settings.google_sheets_credentials),
        "secret_key_configured": bool(settings.secret_key) and settings.secret_key != "default-secret-key-change-in-production",
        "debug_mode": settings.DEBUG_MODE,
        "is_render_environment": settings.is_render,
        "allowed_technicians": len(settings.tecnicos_disponibles) > 0,
        "allowed_sectors": len(settings.sectores_disponibles) > 0,
        "claim_types_defined": len(settings.tipos_reclamo) > 0,
        "metrics_module_available": METRICS_ENABLED
    }
    
    return {
        "status": "all_checks_passed" if all(config_checks.values()) else "some_checks_failed",
        "checks": config_checks,
        "details": {
            "technicians": settings.tecnicos_disponibles,
            "sectors": settings.sectores_disponibles,
            "claim_types": settings.tipos_reclamo,
            "priorities": settings.prioridades_reclamo,
            "metrics_enabled": METRICS_ENABLED
        }
    }

# Ruta para testing de rendimiento
@app.get("/perf/test")
async def performance_test():
    """Endpoint para testing básico de rendimiento"""
    start_time = time.time()
    
    # Operación simple de test
    test_data = {
        "test_string": "Hello World",
        "test_number": 42,
        "test_array": list(range(10)),
        "test_object": {"key": "value"}
    }
    
    process_time = time.time() - start_time
    return {
        "success": True,
        "process_time_ms": round(process_time * 1000, 2),
        "data": test_data,
        "timestamp": time.time()
    }

# Nuevo endpoint para probar las métricas del dashboard
@app.get("/api/v1/test/metrics")
async def test_metrics_endpoint():
    """Endpoint para probar el sistema de métricas"""
    try:
        from utils.metrics_utils import calcular_metricas_dashboard
        from utils.data_manager import cargar_reclamos_desde_sheets
        
        reclamos = await cargar_reclamos_desde_sheets()
        metricas = calcular_metricas_dashboard(reclamos, "week")
        
        return {
            "success": True,
            "metrics_available": True,
            "sample_data": {
                "total_reclamos": metricas.get("total_reclamos", 0),
                "reclamos_activos": metricas.get("reclamos_activos", 0),
                "reclamos_resueltos": metricas.get("reclamos_resueltos", 0)
            }
        }
    except Exception as e:
        return {
            "success": False,
            "metrics_available": False,
            "error": str(e)
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