// frontend/src/config/settings.js
// Configuración frontend basada en backend/config/settings.py

// Técnicos disponibles (coincide con backend)
export const TECNICOS_DISPONIBLES = [
  "Braian", "Conejo", "Juan", "Junior", "Maxi", 
  "Ramon", "Roque", "Viki", "Oficina", "Base", "Externo"
];

// Sectores disponibles (coincide con backend)
export const SECTORES_DISPONIBLES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", 
                                   "11", "12", "13", "14", "15", "16", "17", "OTRO"];

// Roles y permisos (coincide con backend)
export const PERMISOS_POR_ROL = {
  'admin': {
    'descripcion': 'Administrador del sistema - Acceso completo',
    'permisos': ['*'],
    'color': '#FF5733',
    'icon': '👑'
  },
  'supervisor': {
    'descripcion': 'Supervisor técnico - Gestión de equipos',
    'permisos': [
      'inicio', 'reclamos_cargados', 'seguimiento_tecnico', 
      'cierre_reclamos', 'dashboard', 'reportes', 'gestion_equipos'
    ],
    'color': '#338AFF',
    'icon': '👔'
  },
  'tecnico': {
    'descripcion': 'Técnico de campo - Ejecución de trabajos',
    'permisos': [
      'inicio', 'reclamos_cargados', 'seguimiento_tecnico', 
      'cierre_reclamos', 'mi_agenda'
    ],
    'color': '#33D1FF',
    'icon': '🔧'
  },
  'oficina': {
    'descripcion': 'Personal administrativo - Atención al cliente',
    'permisos': [
      'inicio', 'reclamos_cargados', 'gestion_clientes',
      'imprimir_reclamos', 'dashboard'
    ],
    'color': '#9D33FF',
    'icon': '💼'
  },
  'consulta': {
    'descripcion': 'Usuario de solo consulta - Visualización',
    'permisos': [
      'inicio', 'reclamos_cargados', 'dashboard'
    ],
    'color': '#FF33A8',
    'icon': '👀'
  }
};

// Mapeo de opciones de navegación a permisos
export const OPCIONES_PERMISOS = {
  "Inicio": "inicio",
  "Dashboard": "dashboard",
  "Reclamos cargados": "reclamos_cargados",
  "Gestión de clientes": "gestion_clientes",
  "Imprimir reclamos": "imprimir_reclamos",
  "Seguimiento técnico": "seguimiento_tecnico",
  "Cierre de Reclamos": "cierre_reclamos",
  "Reportes": "reportes",
  "Mi Agenda": "mi_agenda",
  "Gestión de Equipos": "gestion_equipos",
  "Configuración": "configuracion"
};

// Tipos de reclamo (coincide con backend)
export const TIPOS_RECLAMO = [
  "Conexion C+I", "Conexion Cable", "Conexion Internet", "Suma Internet",
  "Suma Cable", "Reconexion", "Reconexion C+I", "Reconexion Internet", "Reconexion Cable", 
  "Sin Señal Ambos", "Sin Señal Cable", "Sin Señal Internet", "Sintonia", "Interferencia", 
  "Traslado", "Extension", "Extension x2", "Extension x3", "Extension x4", 
  "Cambio de Ficha", "Cambio de Equipo", "Reclamo", "Cambio de Plan", 
  "Desconexion a Pedido", "Mantenimiento Preventivo", "Instalación Especial", "Consulta Técnica"
];

// Prioridades para reclamos
export const PRIORIDADES_RECLAMO = [
  "Baja", "Normal", "Alta", "Urgente", "Crítica"
];

// Configuración de la aplicación
export const APP_CONFIG = {
  APP_NAME: "FusionV4 CRM",
  APP_VERSION: "2.0.0",
  MAX_ROWS_PER_PAGE: 50,
  SESSION_TIMEOUT: 2700, // 45 minutos
  AUTO_SAVE_INTERVAL: 180 // 3 minutos
};

// Paleta de colores
export const COLOR_PALETTE = {
  primary: '#2563EB',
  secondary: '#8B5CF6',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0891B2',
  dark: '#1E293B',
  light: '#F8FAFC'
};

// Configuración de temas
export const THEME_CONFIG = {
  light: {
    bg_primary: '#FFFFFF',
    bg_secondary: '#F8FAFC',
    text_primary: '#1E293B',
    text_secondary: '#475569'
  },
  dark: {
    bg_primary: '#272822',
    bg_secondary: '#2D2E27',
    text_primary: '#F8F8F2',
    text_secondary: '#CFCFC2'
  }
};

export default {
  TECNICOS_DISPONIBLES,
  SECTORES_DISPONIBLES,
  PERMISOS_POR_ROL,
  OPCIONES_PERMISOS,
  TIPOS_RECLAMO,
  PRIORIDADES_RECLAMO,
  APP_CONFIG,
  COLOR_PALETTE,
  THEME_CONFIG
};