"""
Gestor de datos optimizado para operaciones con Google Sheets en FastAPI
Versión mejorada para entornos cloud como Render
"""
import pandas as pd
import time
import logging
import asyncio
from typing import List, Dict, Any, Tuple, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Importar configuración
from config import settings

# Configurar logging
logger = logging.getLogger(__name__)

class DataManager:
    """Gestor de datos para operaciones con Google Sheets optimizado para FastAPI"""
    
    def __init__(self):
        self.service = None
        self.connected = False
        self._initialize_service()
    
    def _initialize_service(self):
        """Inicializa el servicio de Google Sheets"""
        try:
            credentials = service_account.Credentials.from_service_account_info(
                settings.google_sheets_credentials,
                scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
            
            self.service = build('sheets', 'v4', credentials=credentials, cache_discovery=False)
            self.connected = True
            logger.info("✅ Servicio de Google Sheets inicializado correctamente")
            
        except Exception as e:
            logger.error(f"❌ Error inicializando servicio Google Sheets: {str(e)}")
            self.connected = False
            raise
    
    async def test_connection(self) -> bool:
        """Testea la conexión con Google Sheets"""
        try:
            if not self.service:
                return False
            
            # Intentar una operación simple
            result = self.service.spreadsheets().values().get(
                spreadsheetId=settings.sheet_id,
                range="A1:A1"
            ).execute()
            
            self.connected = True
            return True
        except Exception as e:
            logger.warning(f"⚠️  Error probando conexión: {str(e)}")
            self.connected = False
            return False
    
    def is_connected(self) -> bool:
        """Verifica si está conectado a Google Sheets"""
        return self.connected
    
    async def safe_sheet_operation(self, operation, *args, **kwargs):
        """
        Ejecuta una operación de Sheets de forma segura con manejo de errores
        y reintentos automáticos.
        """
        max_retries = 3
        retry_delay = 1  # segundos
        
        for attempt in range(max_retries):
            try:
                result = operation(*args, **kwargs).execute()
                return result, None
                
            except HttpError as e:
                if e.resp.status in [429, 500, 503]:  # Rate limit o errores temporales
                    if attempt < max_retries - 1:
                        sleep_time = retry_delay * (2 ** attempt)  # Backoff exponencial
                        logger.warning(f"⏰ Rate limit detectado. Reintento {attempt + 1} en {sleep_time}s")
                        await asyncio.sleep(sleep_time)
                        continue
                
                error_msg = f"❌ Error de Google Sheets: {str(e)}"
                logger.error(error_msg)
                return None, error_msg
                
            except Exception as e:
                error_msg = f"❌ Error inesperado: {str(e)}"
                logger.error(error_msg)
                return None, error_msg
        
        return None, "Máximo número de reintentos alcanzado"
    
    async def get_sheet_data(self, range_name: str, columns: List[str] = None) -> pd.DataFrame:
        """
        Obtiene datos de una hoja de cálculo de forma segura y optimizada
        """
        cache_key = f"{settings.sheet_id}_{range_name}"
        
        # Verificar cache primero
        from .cache_manager import get_cached_data, set_cached_data
        cached_data = get_cached_data(cache_key)
        if cached_data is not None:
            logger.info(f"📦 Usando datos cacheados para {range_name}")
            return cached_data.copy()
        
        try:
            # Pequeña pausa para evitar rate limiting
            await asyncio.sleep(settings.api_delay)
            
            result, error = await self.safe_sheet_operation(
                self.service.spreadsheets().values().get,
                spreadsheetId=settings.sheet_id,
                range=range_name
            )
            
            if error:
                logger.error(f"❌ Error obteniendo datos: {error}")
                return pd.DataFrame(columns=columns or [])
            
            values = result.get('values', [])
            
            if not values:
                logger.warning(f"⚠️  No se encontraron datos en {range_name}")
                return pd.DataFrame(columns=columns or [])
            
            # Crear DataFrame
            headers = values[0]
            rows = values[1:] if len(values) > 1 else []
            
            df = pd.DataFrame(rows, columns=headers)
            
            # Asegurar que todas las columnas requeridas existan
            if columns:
                for col in columns:
                    if col not in df.columns:
                        df[col] = None
                df = df[columns]
            
            # Actualizar cache
            set_cached_data(cache_key, df.copy())
            
            logger.info(f"✅ Datos cargados exitosamente de {range_name} ({len(df)} registros)")
            return df
            
        except Exception as e:
            logger.error(f"❌ Error al obtener datos de {range_name}: {str(e)}")
            return pd.DataFrame(columns=columns or [])
    
    async def append_row(self, range_name: str, row_data: List[Any]) -> Tuple[bool, Optional[str]]:
        """
        Agrega una nueva fila a la hoja de cálculo
        """
        try:
            await asyncio.sleep(settings.batch_delay)
            
            result, error = await self.safe_sheet_operation(
                self.service.spreadsheets().values().append,
                spreadsheetId=settings.sheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                insertDataOption='INSERT_ROWS',
                body={'values': [row_data]}
            )
            
            if error:
                return False, error
            
            # Invalidar cache
            from .cache_manager import invalidate_cache
            invalidate_cache(settings.sheet_id, range_name)
            
            logger.info(f"✅ Fila agregada exitosamente a {range_name}")
            return True, None
            
        except Exception as e:
            error_msg = f"❌ Error al agregar fila: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    async def batch_update(self, updates: List[Dict[str, Any]]) -> Tuple[bool, Optional[str]]:
        """
        Realiza múltiples actualizaciones en batch
        """
        try:
            await asyncio.sleep(settings.batch_delay)
            
            result, error = await self.safe_sheet_operation(
                self.service.spreadsheets().values().batchUpdate,
                spreadsheetId=settings.sheet_id,
                body={
                    'valueInputOption': 'USER_ENTERED',
                    'data': updates
                }
            )
            
            if error:
                return False, error
            
            # Invalidar cache para todas las ranges afectadas
            from .cache_manager import invalidate_cache
            for update in updates:
                if 'range' in update:
                    invalidate_cache(settings.sheet_id, update['range'])
            
            logger.info(f"✅ Batch update ejecutado exitosamente ({len(updates)} actualizaciones)")
            return True, None
            
        except Exception as e:
            error_msg = f"❌ Error en batch update: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    async def update_cell(self, range_name: str, value: Any) -> Tuple[bool, Optional[str]]:
        """
        Actualiza una celda específica
        """
        try:
            await asyncio.sleep(settings.api_delay)
            
            result, error = await self.safe_sheet_operation(
                self.service.spreadsheets().values().update,
                spreadsheetId=settings.sheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                body={'values': [[value]]}
            )
            
            if error:
                return False, error
            
            # Invalidar cache
            from .cache_manager import invalidate_cache
            invalidate_cache(settings.sheet_id, range_name)
            
            logger.info(f"✅ Celda {range_name} actualizada exitosamente")
            return True, None
            
        except Exception as e:
            error_msg = f"❌ Error al actualizar celda: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    async def update_row(self, range_name: str, row_data: List[Any]) -> Tuple[bool, Optional[str]]:
        """Actualiza una fila completa"""
        try:
            await asyncio.sleep(settings.api_delay)
            
            result, error = await self.safe_sheet_operation(
                self.service.spreadsheets().values().update,
                spreadsheetId=settings.sheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                body={'values': [row_data]}
            )
            
            if error:
                return False, error
            
            # Invalidar cache
            from .cache_manager import invalidate_cache
            invalidate_cache(settings.sheet_id, range_name)
            
            logger.info(f"✅ Fila {range_name} actualizada exitosamente")
            return True, None
            
        except Exception as e:
            error_msg = f"❌ Error al actualizar fila: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    async def clear_range(self, range_name: str) -> Tuple[bool, Optional[str]]:
        """
        Limpia un rango específico de la hoja
        """
        try:
            result, error = await self.safe_sheet_operation(
                self.service.spreadsheets().values().clear,
                spreadsheetId=settings.sheet_id,
                range=range_name,
                body={}
            )
            
            if error:
                return False, error
            
            # Invalidar cache
            from .cache_manager import invalidate_cache
            invalidate_cache(settings.sheet_id, range_name)
            
            logger.info(f"✅ Rango {range_name} limpiado exitosamente")
            return True, None
            
        except Exception as e:
            error_msg = f"❌ Error al limpiar rango: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    async def cleanup(self):
        """Limpia recursos y cache"""
        from .cache_manager import clear_all_cache
        clear_all_cache()
        logger.info("🧹 Cache limpiado correctamente")

# Funciones de utilidad para operaciones específicas
async def cargar_reclamos_desde_sheets() -> List[Dict[str, Any]]:
    """Carga todos los reclamos desde Google Sheets"""
    try:
        dm = DataManager()
        df = await dm.get_sheet_data("RECLAMOS!A:Q", settings.columnas_reclamos)
        
        if df.empty:
            return []
        
        # Convertir DataFrame a lista de diccionarios
        reclamos = df.replace({pd.NaT: None, pd.NA: None}).to_dict('records')
        
        # Asegurar que todos los campos estén presentes
        for reclamo in reclamos:
            for col in settings.columnas_reclamos:
                if col not in reclamo:
                    reclamo[col] = None
        
        logger.info(f"✅ Se cargaron {len(reclamos)} reclamos desde Sheets")
        return reclamos
        
    except Exception as e:
        logger.error(f"❌ Error cargando reclamos: {str(e)}")
        return []

async def cargar_clientes_desde_sheets() -> List[Dict[str, Any]]:
    """Carga todos los clientes desde Google Sheets"""
    try:
        dm = DataManager()
        df = await dm.get_sheet_data("CLIENTES!A:K", settings.columnas_clientes)
        
        clientes = df.replace({pd.NaT: None, pd.NA: None}).to_dict('records')
        
        for cliente in clientes:
            for col in settings.columnas_clientes:
                if col not in cliente:
                    cliente[col] = None
        
        logger.info(f"✅ Se cargaron {len(clientes)} clientes desde Sheets")
        return clientes
        
    except Exception as e:
        logger.error(f"❌ Error cargando clientes: {str(e)}")
        return []

async def guardar_reclamo(reclamo_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Guarda un nuevo reclamo en Google Sheets"""
    try:
        dm = DataManager()
        
        # Preparar fila en el orden correcto
        fila = [reclamo_data.get(col, '') for col in settings.columnas_reclamos]
        
        success, error = await dm.append_row("RECLAMOS!A:Q", fila)
        return success, error
        
    except Exception as e:
        error_msg = f"❌ Error guardando reclamo: {str(e)}"
        logger.error(error_msg)
        return False, error_msg

# Instancia global del DataManager
_data_manager_instance = None

def initialize_data_manager():
    """Inicializa el DataManager global"""
    global _data_manager_instance
    if _data_manager_instance is None:
        _data_manager_instance = DataManager()
    return _data_manager_instance

def get_data_manager():
    """Obtiene la instancia del DataManager"""
    if _data_manager_instance is None:
        raise RuntimeError("❌ DataManager no ha sido inicializado")
    return _data_manager_instance