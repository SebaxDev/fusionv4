# backend/config/settings.py (VERSIÓN MEJORADA)
import os
import json
from dotenv import load_dotenv
from typing import List, Dict, Any

load_dotenv()

# --------------------------
# DETECCIÓN DE ENTORNO MEJORADA
# --------------------------
def is_render_environment():
    """Detecta si estamos en Render de forma más robusta"""
    render_env_vars = ['RENDER', 'IS_RENDER', 'RENDER_EXTERNAL_HOSTNAME']
    return any(var in os.environ for var in render_env_vars)

IS_RENDER = is_render_environment()
IS_DEVELOPMENT = not IS_RENDER

# --------------------------
# CONFIGURACIÓN DE FASTAPI
# --------------------------
APP_NAME = "FusionV4 CRM"
APP_VERSION = "2.0.0"
API_V1_STR = "/api/v1"

# --------------------------
# SEGURIDAD JWT MEJORADA
# --------------------------
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if IS_RENDER:
        raise ValueError("SECRET_KEY must be set in production")
    SECRET_KEY = "dev-secret-key-change-in-production"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 horas

# --------------------------
# GOOGLE SHEETS CONFIGURACIÓN ÚNICA
# --------------------------
def get_google_credentials():
    """Obtiene credenciales de Google Sheets de forma unificada"""
    # 1. Intenta desde variable de entorno (Render)
    creds_json = os.getenv("GOOGLE_SHEETS_CREDENTIALS")
    if creds_json:
        try:
            return json.loads(creds_json)
        except json.JSONDecodeError:
            raise ValueError("GOOGLE_SHEETS_CREDENTIALS contiene JSON inválido")
    
    # 2. Intenta desde archivo (Desarrollo local)
    creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
    if os.path.exists(creds_path):
        try:
            with open(creds_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            raise ValueError(f"Error leyendo archivo de credenciales: {str(e)}")
    
    raise ValueError("No se encontraron credenciales de Google Sheets")

GOOGLE_SHEETS_CREDENTIALS = get_google_credentials()
SHEET_ID = os.getenv("SHEET_ID")

# --------------------------
# CORS CONFIGURACIÓN COMPLETA
# --------------------------
def get_cors_origins() -> List[str]:
    """Obtiene los orígenes permitidos para CORS"""
    default_origins = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Agregar orígenes de Render desde variable de entorno
    render_origins = os.getenv("CORS_ORIGINS", "")
    if render_origins:
        default_origins.extend(origin.strip() for origin in render_origins.split(","))
    
    # Agregar orígenes comunes de Render
    render_defaults = [
        "https://*.render.com",
        "https://*.onrender.com",
    ]
    default_origins.extend(render_defaults)
    
    return default_origins

CORS_ORIGINS = get_cors_origins()

# --------------------------
# CONFIGURACIÓN DE BASE DE DATOS (Para futura migración)
# --------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# --------------------------
# CONFIGURACIÓN DE RENDIMIENTO OPTIMIZADA
# --------------------------
class PerformanceConfig:
    """Configuración de rendimiento para diferentes entornos"""
    
    def __init__(self):
        if IS_RENDER:
            self.API_DELAY = 0.5
            self.BATCH_DELAY = 1.0
            self.CACHE_TTL = 60
            self.MAX_ROWS_PER_PAGE = 50
            self.REQUEST_TIMEOUT = 30
        else:
            self.API_DELAY = 0.1
            self.BATCH_DELAY = 0.5
            self.CACHE_TTL = 300
            self.MAX_ROWS_PER_PAGE = 100
            self.REQUEST_TIMEOUT = 60

PERF_CONFIG = PerformanceConfig()

# --------------------------
# ESTRUCTURAS DE DATOS (Mantener desde tu versión)
# --------------------------
# [TODAS TUS CONFIGURACIONES EXISTENTES SE MANTIENEN]
# COLUMNAS_RECLAMOS, COLUMNAS_CLIENTES, PERMISOS_POR_ROL, etc.

# --------------------------
# CONFIGURACIÓN DE LOGGING MEJORADA
# --------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG" if IS_DEVELOPMENT else "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

def get_logging_config():
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": LOG_FORMAT,
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "level": LOG_LEVEL,
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "stream": "ext://sys.stdout"
            },
            "file": {
                "level": "INFO",
                "class": "logging.handlers.RotatingFileHandler",
                "filename": "logs/fusionv4.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "formatter": "standard"
            } if not IS_RENDER else None
        },
        "root": {
            "handlers": ["console"] + (["file"] if not IS_RENDER else []),
            "level": LOG_LEVEL
        }
    }

# --------------------------
# CONFIGURACIÓN DE BACKUP (Solo para desarrollo)
# --------------------------
BACKUP_CONFIG = {
    "enabled": not IS_RENDER,
    "interval": 300,  # 5 minutos
    "keep_last": 10
}

# --------------------------
# VALIDACIÓNN DE CONFIGURACIÓN
# --------------------------
def validate_config():
    """Valida que la configuración sea correcta"""
    errors = []
    
    if not SHEET_ID:
        errors.append("SHEET_ID no está configurado")
    
    if not GOOGLE_SHEETS_CREDENTIALS:
        errors.append("GOOGLE_SHEETS_CREDENTIALS no está configurado correctamente")
    
    if errors:
        raise ValueError(f"Errores de configuración: {', '.join(errors)}")

# Validar configuración al importar
try:
    validate_config()
except ValueError as e:
    if IS_RENDER:
        raise
    print(f"Advertencia: {e}")

# --------------------------
# EXPORTAR CONFIGURACIÓN
# --------------------------
class Settings:
    """Clase contenedora de configuración para fácil acceso"""
    
    def __init__(self):
        self.is_render = IS_RENDER
        self.is_development = IS_DEVELOPMENT
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES
        self.sheet_id = SHEET_ID
        self.google_sheets_credentials = GOOGLE_SHEETS_CREDENTIALS
        self.cors_origins = CORS_ORIGINS
        self.database_url = DATABASE_URL
        self.app_name = APP_NAME
        self.app_version = APP_VERSION
        self.api_v1_str = API_V1_STR
        
        # Configuración de rendimiento
        self.api_delay = PERF_CONFIG.API_DELAY
        self.batch_delay = PERF_CONFIG.BATCH_DELAY
        self.cache_ttl = PERF_CONFIG.CACHE_TTL
        self.max_rows_per_page = PERF_CONFIG.MAX_ROWS_PER_PAGE
        
        # Mantener todas las configuraciones existentes
        self.notification_types = NOTIFICATION_TYPES
        self.columnas_reclamos = COLUMNAS_RECLAMOS
        self.columnas_clientes = COLUMNAS_CLIENTES
        self.permisos_por_rol = PERMISOS_POR_ROL
        self.sectores_disponibles = SECTORES_DISPONIBLES
        self.tecnicos_disponibles = TECNICOS_DISPONIBLES
        self.tipos_reclamo = TIPOS_RECLAMO
        self.prioridades_reclamo = PRIORIDADES_RECLAMO
        self.router_por_sector = ROUTER_POR_SECTOR
        self.materiales_por_reclamo = MATERIALES_POR_RECLAMO
        self.color_palette = COLOR_PALETTE
        self.theme_config = THEME_CONFIG
        self.default_values = DEFAULT_VALUES

# Instancia global de configuración
settings = Settings()