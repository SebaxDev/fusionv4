# backend/utils/metrics_cache.py
import asyncio
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

class MetricsCache:
    """Sistema de cache para métricas del dashboard"""
    
    def __init__(self, ttl_seconds: int = 300):  # 5 minutos por defecto
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds
        self.lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Obtener métricas del cache si son válidas"""
        async with self.lock:
            if key in self.cache:
                cached_data = self.cache[key]
                # Verificar si el cache aún es válido
                if time.time() - cached_data['timestamp'] < self.ttl:
                    return cached_data['data']
            return None
    
    async def set(self, key: str, data: Dict[str, Any]) -> None:
        """Guardar métricas en el cache"""
        async with self.lock:
            self.cache[key] = {
                'data': data,
                'timestamp': time.time()
            }
    
    async def invalidate(self, key: str = None) -> None:
        """Invalidar cache completo o específico"""
        async with self.lock:
            if key:
                self.cache.pop(key, None)
            else:
                self.cache.clear()
    
    async def cleanup(self) -> None:
        """Limpiar cache expirado"""
        async with self.lock:
            current_time = time.time()
            self.cache = {
                k: v for k, v in self.cache.items() 
                if current_time - v['timestamp'] < self.ttl
            }
    
    async def get_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas del cache"""
        async with self.lock:
            return {
                'total_cached_items': len(self.cache),
                'cache_hits': sum(1 for item in self.cache.values() 
                                if time.time() - item['timestamp'] < self.ttl),
                'cache_misses': sum(1 for item in self.cache.values() 
                                  if time.time() - item['timestamp'] >= self.ttl),
                'memory_usage_mb': sum(len(str(v)) for v in self.cache.values()) / 1024 / 1024
            }