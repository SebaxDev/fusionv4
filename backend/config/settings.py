import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de Google Sheets
GOOGLE_SHEETS_CREDENTIALS = os.getenv("GOOGLE_SHEETS_CREDENTIALS")
SHEET_ID = os.getenv("SHEET_ID")

# Configuración de la aplicación
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30