# backend/config/constants.py

"""
Centralized constants for the CRM application.
This file eliminates circular dependencies and provides a single source of truth for shared data structures.
"""

# --- Google Sheets Configuration ---
SHEET_RECLAMOS = "RECLAMOS"
SHEET_CLIENTES = "Clientes"
SHEET_HISTORIAL = "HISTORIAL"

# --- Column Definitions ---
# These should match the headers in your Google Sheets file
COLUMNAS_RECLAMOS = [
    "Fecha y hora",
    "Nº Cliente",
    "Sector",
    "Nombre",
    "Dirección",
    "Teléfono",
    "Tipo de reclamo",
    "Detalles",
    "Estado",
    "Técnico",
    "N° de Precinto",
    "Atendido por",
    "Fecha_formateada",  # Assuming this is Fecha de Cierre
    "Observaciones de Cierre",
    "ID Reclamo" # Assuming this is the same as ID Único
]

COLUMNAS_CLIENTES = [
    "Nº Cliente",
    "Nombre",
    "Dirección",
    "Localidad",
    "Teléfono",
    "Sector",
    "Estado",
    "Plan",
    "Observaciones",
    "N° de Precinto"
]

# --- Claim (Reclamo) Statuses ---
ESTADO_PENDIENTE = "PENDIENTE"
ESTADO_EN_CURSO = "EN CURSO"
ESTADO_RESUELTO = "RESUELTO"
ESTADO_CERRADO = "CERRADO"
ESTADO_DESCONEXION = "DESCONEXIÓN"

ESTADOS_ACTIVOS = [ESTADO_PENDIENTE, ESTADO_EN_CURSO, ESTADO_DESCONEXION]
ESTADOS_FINALIZADOS = [ESTADO_RESUELTO, ESTADO_CERRADO]

# --- User Roles and Permissions ---
ROL_ADMIN = "admin"
ROL_TECNICO = "tecnico"
ROL_OPERADOR = "operador"
ROL_VISOR = "visor"

PERMISOS_POR_ROL = {
    ROL_ADMIN: ["*"],
    ROL_OPERADOR: [
        "reclamos:leer", "reclamos:crear", "reclamos:actualizar",
        "clientes:leer", "clientes:crear", "clientes:actualizar",
        "reportes:crear"
    ],
    ROL_TECNICO: [
        "reclamos:leer", "reclamos:actualizar:estado", "reclamos:actualizar:tecnico"
    ],
    ROL_VISOR: ["reclamos:leer", "clientes:leer"]
}

# --- Business Logic Data ---
SECTORES_DISPONIBLES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"]
TECNICOS_DISPONIBLES = ["MARCOS", "ARIEL", "FACUNDO", "CRISTIAN", "JONATHAN", "MAURO"]
TIPOS_RECLAMO = [
    "SIN SEÑAL",
    "CAMBIO DE DOMICILIO",
    "BAJA DEL SERVICIO",
    "CAMBIO DE EQUIPO",
    "PROBLEMAS DE IMAGEN",
    "OTROS"
]
PRIORIDADES_RECLAMO = ["ALTA", "MEDIA", "BAJA"]

# This seems to be for routing logic, defining it here.
ROUTER_POR_SECTOR = {
    "1": "192.168.1.1",
    "2": "192.168.2.1"
    # ... etc
}

# --- Notifications ---
NOTIFICATION_TYPES = {
    "NUEVO_RECLAMO": {"channel": "email", "template": "new_claim.html"},
    "RECLAMO_ASIGNADO": {"channel": "sms", "template": "claim_assigned.txt"},
    "RECLAMO_CERRADO": {"channel": "email", "template": "claim_closed.html"}
}

# --- Frontend/Theme Configuration ---
# These were mentioned in settings.py, providing default values.
MATERIALES_POR_RECLAMO = {
    "SIN SEÑAL": ["Conector RG6", "Cable Coaxial"],
    "CAMBIO DE EQUIPO": ["Decodificador HD", "Control Remoto"]
}

COLOR_PALETTE = {
    "primary": "#3498db",
    "secondary": "#2ecc71",
    "error": "#e74c3c",
    "warning": "#f39c12",
    "info": "#3498db",
    "success": "#2ecc71"
}

THEME_CONFIG = {
    "darkMode": False,
    "toolbar": {
        "visible": True,
        "color": "primary"
    }
}

DEFAULT_VALUES = {
    "localidad": "CORONEL PRINGLES",
    "plan_default": "Básico"
}
