# backend/config/settings.py
import os
import json
from dotenv import load_dotenv
from typing import List, Dict, Any

# Import constants from the new central file
from . import constants

load_dotenv()

# --------------------------
# ENVIRONMENT DETECTION
# --------------------------
def is_render_environment():
    """Detects if the application is running in a Render environment."""
    render_env_vars = ['RENDER', 'IS_RENDER', 'RENDER_EXTERNAL_HOSTNAME']
    return any(var in os.environ for var in render_env_vars)

IS_RENDER = is_render_environment()
IS_DEVELOPMENT = not IS_RENDER

# --------------------------
# FASTAPI CONFIGURATION
# --------------------------
APP_NAME = "FusionV4 CRM"
APP_VERSION = "2.0.0"
API_V1_STR = "/api/v1"

# --------------------------
# JWT SECURITY
# --------------------------
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if IS_RENDER:
        raise ValueError("SECRET_KEY must be set in production environment")
    SECRET_KEY = "a-secure-development-secret-key"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# --------------------------
# GOOGLE SHEETS CONFIGURATION
# --------------------------
def get_google_credentials():
    """
    Retrieves Google Sheets credentials from environment variables (for production)
    or a local file (for development).
    """
    creds_json_str = os.getenv("GOOGLE_SHEETS_CREDENTIALS")
    if creds_json_str:
        try:
            return json.loads(creds_json_str)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON in GOOGLE_SHEETS_CREDENTIALS env var")
    
    creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
    if os.path.exists(creds_path):
        try:
            with open(creds_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            raise ValueError(f"Error reading credentials file at {creds_path}: {e}")

    if IS_RENDER:
        raise ValueError("Google Sheets credentials not found for production environment.")
    
    return None # Allow to run without credentials in local dev if not provided

GOOGLE_SHEETS_CREDENTIALS = get_google_credentials()
SHEET_ID = os.getenv("SHEET_ID")

# --------------------------
# CORS CONFIGURATION
# --------------------------
def get_cors_origins() -> List[str]:
    """Builds the list of allowed CORS origins."""
    origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    render_origins = os.getenv("CORS_ORIGINS")
    if render_origins:
        origins.extend(origin.strip() for origin in render_origins.split(","))

    return origins

CORS_ORIGINS = get_cors_origins()

# --------------------------
# DATABASE CONFIGURATION (for future use)
# --------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# --------------------------
# PERFORMANCE CONFIGURATION
# --------------------------
class PerformanceConfig:
    """Performance settings for different environments."""
    def __init__(self, is_prod: bool):
        if is_prod:
            self.CACHE_TTL = 60  # 1 minute
            self.MAX_ROWS_PER_PAGE = 50
            self.REQUEST_TIMEOUT = 30
        else:
            self.CACHE_TTL = 5 # 5 seconds for local dev
            self.MAX_ROWS_PER_PAGE = 100
            self.REQUEST_TIMEOUT = 60

PERF_CONFIG = PerformanceConfig(is_prod=IS_RENDER)

# --------------------------
# LOGGING CONFIGURATION
# --------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO" if IS_RENDER else "DEBUG")

# --------------------------
# CONFIGURATION VALIDATION
# --------------------------
def validate_config():
    """Validates that essential configuration is set."""
    if IS_RENDER:
        errors = []
        if not SHEET_ID:
            errors.append("SHEET_ID is not configured")
        if not GOOGLE_SHEETS_CREDENTIALS:
            errors.append("GOOGLE_SHEETS_CREDENTIALS are not configured")
        if not SECRET_KEY:
            errors.append("SECRET_KEY is not configured")
        if errors:
            raise ValueError(f"Configuration errors for production: {', '.join(errors)}")

validate_config()

# --------------------------
# SETTINGS EXPORT CLASS
# --------------------------
class Settings:
    """Main settings class to be used throughout the application."""
    
    # Environment
    is_render: bool = IS_RENDER
    is_development: bool = IS_DEVELOPMENT
    
    # FastAPI
    app_name: str = APP_NAME
    app_version: str = APP_VERSION
    api_v1_str: str = API_V1_STR
    
    # Security
    secret_key: str = SECRET_KEY
    algorithm: str = ALGORITHM
    access_token_expire_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES
    
    # Google Sheets
    sheet_id: str = SHEET_ID
    google_sheets_credentials: Dict[str, Any] = GOOGLE_SHEETS_CREDENTIALS

    # CORS
    cors_origins: List[str] = CORS_ORIGINS

    # Database
    database_url: str = DATABASE_URL

    # Performance
    cache_ttl: int = PERF_CONFIG.CACHE_TTL
    max_rows_per_page: int = PERF_CONFIG.MAX_ROWS_PER_PAGE

    # Logging
    log_level: str = LOG_LEVEL

    # --- Imported Constants ---
    notification_types: Dict = constants.NOTIFICATION_TYPES
    columnas_reclamos: List[str] = constants.COLUMNAS_RECLAMOS
    columnas_clientes: List[str] = constants.COLUMNAS_CLIENTES
    permisos_por_rol: Dict = constants.PERMISOS_POR_ROL
    sectores_disponibles: List[str] = constants.SECTORES_DISPONIBLES
    tecnicos_disponibles: List[str] = constants.TECNICOS_DISPONIBLES
    tipos_reclamo: List[str] = constants.TIPOS_RECLAMO
    prioridades_reclamo: List[str] = constants.PRIORIDADES_RECLAMO
    router_por_sector: Dict = constants.ROUTER_POR_SECTOR
    materiales_por_reclamo: Dict = constants.MATERIALES_POR_RECLAMO
    color_palette: Dict = constants.COLOR_PALETTE
    theme_config: Dict = constants.THEME_CONFIG
    default_values: Dict = constants.DEFAULT_VALUES

# Global settings instance
settings = Settings()