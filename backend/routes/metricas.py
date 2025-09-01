# backend/routes/metricas.py
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np

from auth import get_current_user
from utils.data_manager import cargar_reclamos_desde_sheets
from utils.date_utils import parse_fecha
from utils.metrics_utils import (
    calcular_metricas_dashboard,
    calcular_tendencias_temporales,
    calcular_kpis_avanzados,
    generar_reporte_estadistico
)

router = APIRouter(prefix="/reclamos", tags=["métricas"])

@router.get("/metricas-dashboard")
async def obtener_metricas_dashboard(
    rango_tiempo: str = Query("week", description="Rango de tiempo: today, week, month, all"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene métricas completas para el dashboard
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        metricas = calcular_metricas_dashboard(reclamos, rango_tiempo)
        return metricas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo métricas del dashboard: {str(e)}")

@router.get("/estadisticas-avanzadas")
async def obtener_estadisticas_avanzadas(
    sector: Optional[str] = Query(None),
    tipo_reclamo: Optional[str] = Query(None),
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene estadísticas avanzadas con filtros
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        
        # Aplicar filtros
        if fecha_inicio:
            fecha_ini = parse_fecha(fecha_inicio)
            reclamos = [r for r in reclamos if parse_fecha(r.get('Fecha y hora')) >= fecha_ini]
        
        if fecha_fin:
            fecha_fin_dt = parse_fecha(fecha_fin)
            reclamos = [r for r in reclamos if parse_fecha(r.get('Fecha y hora')) <= fecha_fin_dt]
        
        if sector and sector != 'Todos':
            reclamos = [r for r in reclamos if str(r.get('Sector', '')).strip() == sector]
        
        if tipo_reclamo and tipo_reclamo != 'Todos':
            reclamos = [r for r in reclamos if tipo_reclamo.lower() in str(r.get('Tipo de reclamo', '')).lower()]
        
        metricas = calcular_metricas_dashboard(reclamos, 'all')
        return metricas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas avanzadas: {str(e)}")

@router.get("/tendencias-temporales")
async def obtener_tendencias_temporales(
    periodo: str = Query("month", description="Periodo: week, month, quarter, year"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene tendencias temporales de reclamos
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        tendencias = calcular_tendencias_temporales(reclamos, periodo)
        return tendencias
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo tendencias temporales: {str(e)}")

@router.get("/kpis")
async def obtener_kpis_principales(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene los KPI principales del sistema
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        kpis = calcular_kpis_avanzados(reclamos)
        return kpis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo KPIs: {str(e)}")

@router.get("/reporte-estadistico")
async def generar_reporte_estadistico_completo(
    formato: str = Query("json", description="Formato: json, csv"),
    current_user: dict = Depends(get_current_user)
):
    """
    Genera un reporte estadístico completo
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        reporte = generar_reporte_estadistico(reclamos, formato)
        
        if formato == "csv":
            # Devolver como archivo CSV
            from fastapi.responses import StreamingResponse
            import io
            
            output = io.StringIO()
            reporte.to_csv(output, index=False)
            output.seek(0)
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=reporte_estadistico.csv"}
            )
        else:
            return reporte.to_dict(orient='records')
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte estadístico: {str(e)}")