# backend/utils/metrics_utils.py
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np
from collections import defaultdict

def parse_fecha(fecha_str: str) -> datetime:
    """
    Convierte una cadena de fecha a objeto datetime
    """
    if not fecha_str:
        return None
    
    try:
        # Intentar diferentes formatos de fecha
        formatos = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d %H:%M',
            '%d/%m/%Y %H:%M:%S',
            '%d/%m/%Y %H:%M',
            '%d/%m/%Y',
            '%Y-%m-%d'
        ]
        
        for formato in formatos:
            try:
                return datetime.strptime(str(fecha_str), formato)
            except ValueError:
                continue
        
        # Si ninguno funciona, devolver None
        return None
        
    except (ValueError, TypeError):
        return None

def calcular_fecha_limite(rango_tiempo: str) -> datetime:
    """
    Calcula la fecha límite según el rango de tiempo
    """
    hoy = datetime.now()
    
    if rango_tiempo == "today":
        return hoy.replace(hour=0, minute=0, second=0, microsecond=0)
    elif rango_tiempo == "week":
        return hoy - timedelta(days=hoy.weekday())
    elif rango_tiempo == "month":
        return hoy.replace(day=1)
    else:
        return datetime.min

def calcular_metricas_dashboard(reclamos: List[Dict[str, Any]], rango_tiempo: str = "all") -> Dict[str, Any]:
    """
    Calcula métricas completas para el dashboard
    """
    if not reclamos:
        return _metricas_vacias()
    
    # Filtrar por rango de tiempo si es necesario
    if rango_tiempo != "all":
        fecha_limite = calcular_fecha_limite(rango_tiempo)
        reclamos = [r for r in reclamos 
                   if parse_fecha(r.get('Fecha y hora')) and 
                   parse_fecha(r.get('Fecha y hora')) >= fecha_limite]
    
    df = pd.DataFrame(reclamos)
    
    # Métricas básicas
    total_reclamos = len(df)
    reclamos_activos = len(df[df['Estado'].str.strip().str.upper().isin(['PENDIENTE', 'EN CURSO', 'DESCONEXIÓN'])])
    reclamos_resueltos = len(df[df['Estado'].str.strip().str.upper().isin(['RESUELTO', 'CERRADO', 'COMPLETADO'])])
    porcentaje_resueltos = (reclamos_resueltos / total_reclamos * 100) if total_reclamos > 0 else 0
    
    # Reclamos por período
    ahora = datetime.now()
    reclamos_24h = len([r for r in reclamos 
                       if parse_fecha(r.get('Fecha y hora')) and 
                       (ahora - parse_fecha(r.get('Fecha y hora'))) <= timedelta(hours=24)])
    
    reclamos_semana = len([r for r in reclamos 
                          if parse_fecha(r.get('Fecha y hora')) and 
                          (ahora - parse_fecha(r.get('Fecha y hora'))) <= timedelta(days=7)])
    
    reclamos_mes = len([r for r in reclamos 
                       if parse_fecha(r.get('Fecha y hora')) and 
                       (ahora - parse_fecha(r.get('Fecha y hora'))) <= timedelta(days=30)])
    
    # Distribución por estado
    estado_counts = df['Estado'].value_counts().to_dict()
    pendientes = estado_counts.get('Pendiente', 0)
    en_proceso = estado_counts.get('En Proceso', 0) + estado_counts.get('En Curso', 0)
    cancelados = estado_counts.get('Cancelado', 0)
    
    # Tiempo promedio de resolución
    tiempo_promedio = _calcular_tiempo_promedio_resolucion(reclamos)
    
    # Distribución por tipo
    distribucion_tipo = df['Tipo de reclamo'].value_counts().head(10).to_dict()
    
    # Distribución por sector
    distribucion_sector = df['Sector'].value_counts().to_dict()
    
    # Reclamos recientes (últimos 5)
    reclamos_recientes = sorted(
        [r for r in reclamos if parse_fecha(r.get('Fecha y hora'))],
        key=lambda x: parse_fecha(x.get('Fecha y hora')),
        reverse=True
    )[:5]
    
    # Tendencias (comparación con período anterior)
    tendencias = _calcular_tendencias(reclamos, rango_tiempo)
    
    return {
        "total_reclamos": total_reclamos,
        "reclamos_activos": reclamos_activos,
        "reclamos_resueltos": reclamos_resueltos,
        "porcentaje_resueltos": round(porcentaje_resueltos, 1),
        "reclamos_24h": reclamos_24h,
        "reclamos_semana": reclamos_semana,
        "reclamos_mes": reclamos_mes,
        "pendientes": pendientes,
        "en_proceso": en_proceso,
        "cancelados": cancelados,
        "tiempo_promedio_resolucion": round(tiempo_promedio, 1),
        "distribucion_tipo": distribucion_tipo,
        "distribucion_sector": distribucion_sector,
        "reclamos_recientes": reclamos_recientes,
        "tendencias": tendencias
    }

def _calcular_tiempo_promedio_resolucion(reclamos: List[Dict[str, Any]]) -> float:
    """
    Calcula el tiempo promedio de resolución en días
    """
    tiempos = []
    
    for reclamo in reclamos:
        if (reclamo.get('Estado') in ['Resuelto', 'Cerrado', 'Completado'] and
            reclamo.get('Fecha y hora') and reclamo.get('Fecha resolución')):
            
            try:
                fecha_creacion = parse_fecha(reclamo['Fecha y hora'])
                fecha_resolucion = parse_fecha(reclamo['Fecha resolución'])
                
                if fecha_creacion and fecha_resolucion and fecha_resolucion > fecha_creacion:
                    diff_dias = (fecha_resolucion - fecha_creacion).total_seconds() / (24 * 3600)
                    tiempos.append(diff_dias)
            except:
                continue
    
    return sum(tiempos) / len(tiempos) if tiempos else 0

def _calcular_tendencias(reclamos: List[Dict[str, Any]], rango_tiempo: str) -> Dict[str, float]:
    """
    Calcula tendencias comparando con el período anterior
    """
    if not reclamos or rango_tiempo == "all":
        return {}
    
    # Definir períodos actual y anterior
    ahora = datetime.now()
    
    if rango_tiempo == "today":
        periodo_actual = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
        periodo_anterior = periodo_actual - timedelta(days=1)
        duracion_periodo = timedelta(days=1)
    elif rango_tiempo == "week":
        periodo_actual = ahora - timedelta(days=ahora.weekday())
        periodo_anterior = periodo_actual - timedelta(days=7)
        duracion_periodo = timedelta(days=7)
    elif rango_tiempo == "month":
        periodo_actual = ahora.replace(day=1)
        periodo_anterior = (periodo_actual - timedelta(days=1)).replace(day=1)
        duracion_periodo = timedelta(days=30)  # Aproximado
    
    # Contar reclamos por período
    count_actual = len([r for r in reclamos 
                       if parse_fecha(r.get('Fecha y hora')) and 
                       periodo_actual <= parse_fecha(r.get('Fecha y hora')) <= periodo_actual + duracion_periodo])
    
    count_anterior = len([r for r in reclamos 
                         if parse_fecha(r.get('Fecha y hora')) and 
                         periodo_anterior <= parse_fecha(r.get('Fecha y hora')) <= periodo_anterior + duracion_periodo])
    
    # Calcular tendencias
    tendencias = {}
    if count_anterior > 0:
        tendencias['total'] = round(((count_actual - count_anterior) / count_anterior) * 100, 1)
    else:
        tendencias['total'] = 100.0 if count_actual > 0 else 0.0
    
    return tendencias

def calcular_tendencias_temporales(reclamos: List[Dict[str, Any]], periodo: str = "month") -> Dict[str, Any]:
    """
    Calcula tendencias temporales detalladas
    """
    if not reclamos:
        return {}
    
    df = pd.DataFrame(reclamos)
    df['Fecha'] = pd.to_datetime(df['Fecha y hora'], errors='coerce')
    df = df.dropna(subset=['Fecha'])
    
    # Agrupar por período
    if periodo == "week":
        df['Periodo'] = df['Fecha'].dt.to_period('W')
    elif periodo == "month":
        df['Periodo'] = df['Fecha'].dt.to_period('M')
    elif periodo == "quarter":
        df['Periodo'] = df['Fecha'].dt.to_period('Q')
    else:  # year
        df['Periodo'] = df['Fecha'].dt.to_period('Y')
    
    # Estadísticas por período
    stats = df.groupby('Periodo').agg({
        'Estado': 'count',
        'Tipo de reclamo': lambda x: x.mode()[0] if not x.mode().empty else 'N/A',
        'Sector': lambda x: x.mode()[0] if not x.mode().empty else 'N/A'
    }).rename(columns={'Estado': 'total_reclamos'})
    
    return stats.to_dict(orient='index')

def calcular_kpis_avanzados(reclamos: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcula KPIs avanzados para el sistema
    """
    if not reclamos:
        return {}
    
    df = pd.DataFrame(reclamos)
    
    # KPIs de eficiencia
    tiempo_resolucion = _calcular_tiempo_promedio_resolucion(reclamos)
    tasa_resolucion = (len(df[df['Estado'].str.strip().str.upper().isin(['RESUELTO', 'CERRADO'])]) / len(df)) * 100
    
    # KPIs de calidad
    reclamos_reincidentes = _calcular_reclamos_reincidentes(reclamos)
    satisfaccion_promedio = _calcular_satisfaccion_promedio(reclamos)
    
    # KPIs operativos
    carga_tecnicos = _calcular_carga_tecnicos(reclamos)
    tiempos_respuesta = _calcular_tiempos_respuesta(reclamos)
    
    return {
        "tiempo_promedio_resolucion": round(tiempo_resolucion, 1),
        "tasa_resolucion": round(tasa_resolucion, 1),
        "reclamos_reincidentes": reclamos_reincidentes,
        "satisfaccion_promedio": round(satisfaccion_promedio, 1),
        "carga_tecnicos": carga_tecnicos,
        "tiempo_respuesta_promedio": round(tiempos_respuesta.get('promedio', 0), 1),
        "tiempo_respuesta_mediano": round(tiempos_respuesta.get('mediano', 0), 1)
    }

def _calcular_reclamos_reincidentes(reclamos: List[Dict[str, Any]]) -> int:
    """
    Calcula número de clientes con reclamos reincidentes
    """
    clientes_reclamos = defaultdict(int)
    
    for reclamo in reclamos:
        nro_cliente = reclamo.get('Nº Cliente')
        if nro_cliente:
            clientes_reclamos[nro_cliente] += 1
    
    return sum(1 for count in clientes_reclamos.values() if count > 1)

def _calcular_satisfaccion_promedio(reclamos: List[Dict[str, Any]]) -> float:
    """
    Calcula la satisfacción promedio (placeholder para integración futura)
    """
    # Esto sería reemplazado con datos reales de satisfacción
    return 4.2  # Escala de 1-5

def _calcular_carga_tecnicos(reclamos: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Calcula la carga de trabajo por técnico
    """
    carga = defaultdict(int)
    
    for reclamo in reclamos:
        tecnico = reclamo.get('Técnico')
        if tecnico and reclamo.get('Estado') in ['Pendiente', 'En Proceso']:
            carga[tecnico] += 1
    
    return dict(carga)

def _calcular_tiempos_respuesta(reclamos: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Calcula tiempos de respuesta (placeholder para implementación real)
    """
    # Esto sería implementado con datos reales de tiempos de respuesta
    return {
        'promedio': 2.5,  # horas
        'mediano': 1.8    # horas
    }

def generar_reporte_estadistico(reclamos: List[Dict[str, Any]], formato: str = "json") -> pd.DataFrame:
    """
    Genera un reporte estadístico completo
    """
    if not reclamos:
        return pd.DataFrame()
    
    df = pd.DataFrame(reclamos)
    
    # Estadísticas detalladas
    reporte_data = []
    
    # Por tipo de reclamo
    tipo_stats = df['Tipo de reclamo'].value_counts().reset_index()
    tipo_stats.columns = ['Tipo', 'Cantidad']
    tipo_stats['Porcentaje'] = (tipo_stats['Cantidad'] / len(df)) * 100
    reporte_data.extend(tipo_stats.to_dict('records'))
    
    # Por sector
    sector_stats = df['Sector'].value_counts().reset_index()
    sector_stats.columns = ['Sector', 'Cantidad']
    sector_stats['Porcentaje'] = (sector_stats['Cantidad'] / len(df)) * 100
    reporte_data.extend(sector_stats.to_dict('records'))
    
    # Por estado
    estado_stats = df['Estado'].value_counts().reset_index()
    estado_stats.columns = ['Estado', 'Cantidad']
    estado_stats['Porcentaje'] = (estado_stats['Cantidad'] / len(df)) * 100
    reporte_data.extend(estado_stats.to_dict('records'))
    
    return pd.DataFrame(reporte_data)

def _metricas_vacias() -> Dict[str, Any]:
    """
    Retorna métricas vacías para cuando no hay datos
    """
    return {
        "total_reclamos": 0,
        "reclamos_activos": 0,
        "reclamos_resueltos": 0,
        "porcentaje_resueltos": 0,
        "reclamos_24h": 0,
        "reclamos_semana": 0,
        "reclamos_mes": 0,
        "pendientes": 0,
        "en_proceso": 0,
        "cancelados": 0,
        "tiempo_promedio_resolucion": 0,
        "distribucion_tipo": {},
        "distribucion_sector": {},
        "reclamos_recientes": [],
        "tendencias": {}
    }