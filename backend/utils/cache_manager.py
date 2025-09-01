# backend/utils/cache_manager.py
"""
Sistema de cache optimizado para DataManager
"""
import time
from typing import Any, Optional
from config import settings

# Cache para almacenar datos temporalmente
_data_cache = {}

def get_cached_data(cache_key: str) -> Optional[Any]:
    """Obtiene datos del cache si son válidos"""
    if cache_key in _data_cache:
        cached_data, timestamp = _data_cache[cache_key]
        if time.time() - timestamp < settings.cache_ttl:
            return cached_data
    return None

def set_cached_data(cache_key: str, data: Any):
    """Guarda datos en el cache"""
    _data_cache[cache_key] = (data, time.time())

def invalidate_cache(spreadsheet_id: str, range_name: str):
    """Invalidar datos en cache"""
    cache_key = f"{spreadsheet_id}_{range_name}"
    if cache_key in _data_cache:
        del _data_cache[cache_key]

def clear_all_cache():
    """Limpia todo el cache"""
    _data_cache.clear()