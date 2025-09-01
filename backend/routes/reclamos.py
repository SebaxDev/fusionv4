# backend/routes/reclamos.py - Importaciones relativas CORRECTAS
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from datetime import datetime
import io
import pandas as pd
from typing import List, Dict, Any, Optional
import matplotlib.pyplot as plt
from io import BytesIO

# IMPORTACIONES RELATIVAS ✅ (desde la carpeta backend)
from models.reclamo import ReclamoCreate, ReclamoUpdate, ReclamoResponse
from auth import get_current_user
from utils.google_sheets import get_worksheet
from utils.data_manager import cargar_reclamos_desde_sheets, cargar_clientes_desde_sheets
from utils.date_utils import parse_fecha, ahora_argentina
from config.settings import COLUMNAS_RECLAMOS

router = APIRouter(prefix="/reclamos", tags=["reclamos"])

# --- FUNCIONES AUXILIARES ---
def _normalizar_datos_reclamo(reclamo: Dict[str, Any]) -> Dict[str, Any]:
    """Normaliza los datos de un reclamo para consistencia"""
    normalized = reclamo.copy()
    
    # Normalizar campos de texto
    text_fields = ['Nombre', 'Dirección', 'Teléfono', 'Tipo de reclamo', 'Detalles', 'Estado', 'Técnico', 'Atendido por']
    for field in text_fields:
        if field in normalized and normalized[field]:
            normalized[field] = str(normalized[field]).strip().upper()
    
    # Normalizar número de cliente
    if 'Nº Cliente' in normalized:
        normalized['Nº Cliente'] = str(normalized['Nº Cliente']).strip()
    
    # Normalizar sector
    if 'Sector' in normalized and normalized['Sector']:
        try:
            normalized['Sector'] = str(int(float(normalized['Sector'])))
        except (ValueError, TypeError):
            normalized['Sector'] = str(normalized['Sector']).strip()
    
    return normalized

def _filtrar_reclamos_activos(reclamos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filtra reclamos con estado activo"""
    estados_activos = ["pendiente", "en curso", "desconexión"]
    return [
        reclamo for reclamo in reclamos
        if str(reclamo.get('Estado', '')).lower().strip() in estados_activos
    ]

def _agrupar_por_tecnico(reclamos: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Agrupa reclamos por técnico asignado"""
    grupos = {}
    for reclamo in reclamos:
        tecnico = reclamo.get('Técnico', 'SIN TÉCNICO').strip().upper()
        if tecnico not in grupos:
            grupos[tecnico] = []
        grupos[tecnico].append(reclamo)
    return grupos

# --- ENDPOINTS PRINCIPALES ---
@router.get("")
async def obtener_reclamos(
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    sector: Optional[str] = Query(None, description="Filtrar por sector"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de reclamo"),
    tecnico: Optional[str] = Query(None, description="Filtrar por técnico"),
    desde: Optional[str] = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    hasta: Optional[str] = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene todos los reclamos con filtros opcionales
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        
        # Aplicar filtros
        filtered_reclamos = reclamos.copy()
        
        if estado and estado.lower() != 'todos':
            filtered_reclamos = [r for r in filtered_reclamos 
                               if str(r.get('Estado', '')).lower() == estado.lower()]
        
        if sector and sector.lower() != 'todos':
            filtered_reclamos = [r for r in filtered_reclamos 
                               if str(r.get('Sector', '')).strip().lower() == sector.lower()]
        
        if tipo and tipo.lower() != 'todos':
            filtered_reclamos = [r for r in filtered_reclamos 
                               if tipo.lower() in str(r.get('Tipo de reclamo', '')).lower()]
        
        if tecnico and tecnico.lower() != 'todos':
            filtered_reclamos = [r for r in filtered_reclamos 
                               if tecnico.lower() in str(r.get('Técnico', '')).lower()]
        
        if desde:
            fecha_desde = parse_fecha(desde)
            if fecha_desde:
                filtered_reclamos = [r for r in filtered_reclamos 
                                   if parse_fecha(r.get('Fecha y hora')) and 
                                   parse_fecha(r.get('Fecha y hora')) >= fecha_desde]
        
        if hasta:
            fecha_hasta = parse_fecha(hasta)
            if fecha_hasta:
                filtered_reclamos = [r for r in filtered_reclamos 
                                   if parse_fecha(r.get('Fecha y hora')) and 
                                   parse_fecha(r.get('Fecha y hora')) <= fecha_hasta]
        
        return filtered_reclamos
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo reclamos: {str(e)}")

@router.get("/{nro_cliente}")
async def obtener_reclamos_cliente(
    nro_cliente: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene todos los reclamos de un cliente específico
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        reclamos_cliente = [
            r for r in reclamos 
            if str(r.get('Nº Cliente', '')).strip() == nro_cliente.strip()
        ]
        
        return reclamos_cliente
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo reclamos del cliente: {str(e)}")

@router.get("/activos/{nro_cliente}")
async def obtener_reclamos_activos_cliente(
    nro_cliente: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene reclamos activos de un cliente específico
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        
        # Filtrar reclamos del cliente y activos
        estados_activos = ["pendiente", "en curso", "desconexión"]
        reclamos_activos = [
            r for r in reclamos 
            if str(r.get('Nº Cliente', '')).strip() == nro_cliente.strip() and
            str(r.get('Estado', '')).lower().strip() in estados_activos
        ]
        
        return reclamos_activos
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo reclamos activos: {str(e)}")

@router.get("/activos")
async def obtener_todos_reclamos_activos(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene todos los reclamos activos
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        reclamos_activos = _filtrar_reclamos_activos(reclamos)
        return reclamos_activos
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo reclamos activos: {str(e)}")

@router.post("")
async def crear_reclamo(
    reclamo_data: ReclamoCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crea un nuevo reclamo en Google Sheets
    """
    try:
        sheet = await get_worksheet("RECLAMOS")

        # Convertir a dict para procesamiento
        reclamo_dict = reclamo_data.dict()
        
        # Validar campos obligatorios
        campos_obligatorios = ['nroCliente', 'sector', 'nombre', 'direccion', 'tipoReclamo', 'atendidoPor']
        campos_faltantes = [campo for campo in campos_obligatorios if campo not in reclamo_data or not reclamo_data[campo]]
        
        if campos_faltantes:
            raise HTTPException(status_code=400, detail=f"Campos obligatorios faltantes: {', '.join(campos_faltantes)}")
        
        # Preparar fila para Google Sheets
        fecha_hora = reclamo_data.get('fechaHora', ahora_argentina().isoformat())
        estado = "DESCONEXIÓN" if "desconexion a pedido" in reclamo_data.get('tipoReclamo', '').lower() else "PENDIENTE"
        
        fila_reclamo = [
            fecha_hora,
            reclamo_data['nroCliente'],
            reclamo_data['sector'],
            reclamo_data['nombre'],
            reclamo_data['direccion'],
            reclamo_data.get('telefono', ''),
            reclamo_data['tipoReclamo'],
            reclamo_data.get('detalles', ''),
            estado,
            '',  # Técnico (vacío inicialmente)
            reclamo_data.get('precinto', ''),
            reclamo_data['atendidoPor'],
            '', '', '',  # Campos adicionales
            reclamo_data.get('idUnico', '')  # ID único
        ]
        
        # Insertar en Google Sheets
        sheet.append_row(fila_reclamo)
        
        return {"message": "Reclamo creado exitosamente", "id": reclamo_data.get('idUnico', '')}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando reclamo: {str(e)}")

@router.put("/{id_reclamo}")
async def actualizar_reclamo(
    id_reclamo: str,
    updates: ReclamoUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualiza un reclamo existente
    """
    try:
        # Convertir a dict para procesamiento
        updates_dict = updates.dict(exclude_unset=True)
        
        # Encontrar el reclamo por ID único (asumiendo que está en la columna O)
        reclamo_idx = None
        for i, reclamo in enumerate(reclamos):
            if reclamo.get('ID Único') == id_reclamo:
                reclamo_idx = i + 2  # +2 porque la primera fila es encabezado y sheets empieza en 1
                break
        
        if reclamo_idx is None:
            raise HTTPException(status_code=404, detail="Reclamo no encontrado")
        
        # Preparar actualizaciones
        column_mapping = {
            'estado': 'J',
            'tecnico': 'K',
            'detalles': 'H',
            'tipoReclamo': 'G',
            'sector': 'C'
        }
        
        batch_updates = []
        for field, column in column_mapping.items():
            if field in updates:
                batch_updates.append({
                    'range': f"{column}{reclamo_idx}",
                    'values': [[updates[field]]]
                })
        
        if batch_updates:
            sheet.batch_update(batch_updates)
        
        return {"message": "Reclamo actualizado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando reclamo: {str(e)}")

@router.patch("/{id_reclamo}/estado")
async def cambiar_estado_reclamo(
    id_reclamo: str,
    estado_data: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """
    Cambia el estado de un reclamo específico
    """
    try:
        sheet = await get_worksheet("RECLAMOS")
        reclamos = await cargar_reclamos_desde_sheets()
        
        # Encontrar el reclamo por ID único
        reclamo_idx = None
        for i, reclamo in enumerate(reclamos):
            if reclamo.get('ID Único') == id_reclamo:
                reclamo_idx = i + 2
                break
        
        if reclamo_idx is None:
            raise HTTPException(status_code=404, detail="Reclamo no encontrado")
        
        nuevo_estado = estado_data.get('estado')
        if not nuevo_estado:
            raise HTTPException(status_code=400, detail="Campo 'estado' es requerido")
        
        # Actualizar estado en la columna J
        sheet.update(f'J{reclamo_idx}', [[nuevo_estado]])
        
        return {"message": "Estado actualizado exitosamente", "nuevo_estado": nuevo_estado}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cambiando estado: {str(e)}")

@router.get("/estadisticas/resumen")
async def obtener_estadisticas_reclamos(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene estadísticas resumidas de los reclamos
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        
        if not reclamos:
            return {
                "total": 0,
                "pendientes": 0,
                "en_curso": 0,
                "resueltos": 0,
                "por_tipo": {},
                "por_sector": {}
            }
        
        df = pd.DataFrame(reclamos)
        
        # Estadísticas básicas
        total = len(df)
        pendientes = len(df[df['Estado'].str.strip().str.upper() == 'PENDIENTE'])
        en_curso = len(df[df['Estado'].str.strip().str.upper() == 'EN CURSO'])
        resueltos = len(df[df['Estado'].str.strip().str.upper().isin(['RESUELTO', 'CERRADO', 'COMPLETADO'])])
        
        # Por tipo de reclamo
        por_tipo = df['Tipo de reclamo'].value_counts().to_dict()
        
        # Por sector
        por_sector = df['Sector'].value_counts().to_dict()
        
        return {
            "total": total,
            "pendientes": pendientes,
            "en_curso": en_curso,
            "resueltos": resueltos,
            "por_tipo": por_tipo,
            "por_sector": por_sector
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")

@router.post("/generar-pdf")
async def generar_pdf_reclamos(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    Genera un PDF con los reclamos proporcionados
    """
    try:
        reclamos = data.get("reclamos", [])
        titulo = data.get("titulo", "RECLAMOS")
        usuario = data.get("usuario")
        
        if not reclamos:
            raise HTTPException(status_code=400, detail="No hay reclamos para generar PDF")
        
        # Crear PDF
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        y = height - 40
        hoy = datetime.now().strftime('%d/%m/%Y %H:%M')
        
        # Encabezado
        c.setFont("Helvetica-Bold", 16)
        c.drawString(40, y, titulo)
        y -= 20
        
        c.setFont("Helvetica", 12)
        c.drawString(40, y, f"Generado el: {hoy}")
        if usuario:
            c.drawString(width - 200, y, f"Por: {usuario.get('nombre', 'Sistema')}")
        y -= 30
        
        for reclamo in reclamos:
            if y < 120:
                # Agregar pie de página y nueva página
                c.drawString(40, 30, f"Página {c.getPageNumber()}")
                c.showPage()
                y = height - 40
                c.setFont("Helvetica-Bold", 16)
                c.drawString(40, y, titulo + " (cont.)")
                y -= 30
            
            c.setFont("Helvetica-Bold", 14)
            cliente_info = f"{reclamo.get('Nº Cliente', 'N/A')} - {reclamo.get('Nombre', 'N/A')}"
            if len(cliente_info) > 60:
                cliente_info = cliente_info[:57] + "..."
            c.drawString(40, y, cliente_info)
            y -= 15
            
            c.setFont("Helvetica", 11)
            fecha_str = parse_fecha(reclamo.get('Fecha y hora')).strftime('%d/%m/%Y %H:%M') if reclamo.get('Fecha y hora') else 'Sin fecha'
            
            lineas = [
                f"Fecha: {fecha_str}",
                f"Dirección: {reclamo.get('Dirección', 'N/A')}",
                f"Tel: {reclamo.get('Teléfono', 'N/A')}",
                f"Sector: {reclamo.get('Sector', 'N/A')} - Precinto: {reclamo.get('N° de Precinto', 'N/A')}",
                f"Tipo: {reclamo.get('Tipo de reclamo', 'N/A')}",
                f"Estado: {reclamo.get('Estado', 'N/A')}",
                f"Atendido por: {reclamo.get('Atendido por', 'N/A')}"
            ]
            
            # Detalles (con manejo de texto largo)
            detalles = reclamo.get('Detalles', '')
            if detalles:
                if len(detalles) > 100:
                    lineas.append(f"Detalles: {detalles[:100]}...")
                else:
                    lineas.append(f"Detalles: {detalles}")
            
            for linea in lineas:
                if y < 50:  # Espacio mínimo en la página
                    c.drawString(40, 30, f"Página {c.getPageNumber()}")
                    c.showPage()
                    y = height - 40
                    c.setFont("Helvetica", 11)
                
                c.drawString(40, y, linea)
                y -= 12
            
            y -= 8
            c.line(40, y, width - 40, y)
            y -= 15
        
        # Pie de página final
        c.drawString(40, 30, f"Página {c.getPageNumber()}")
        c.save()
        buffer.seek(0)
        
        # Devolver el PDF como respuesta
        filename = f"reclamos_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar PDF: {str(e)}")

@router.get("/reporte-diario/imagen")
async def generar_reporte_diario_imagen(
    current_user: dict = Depends(get_current_user)
):
    """
    Genera una imagen PNG del reporte diario de reclamos
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        
        if not reclamos:
            raise HTTPException(status_code=404, detail="No hay reclamos para generar reporte")
        
        # Filtrar reclamos del día actual
        hoy = datetime.now().date()
        reclamos_hoy = [
            r for r in reclamos 
            if parse_fecha(r.get('Fecha y hora')) and 
            parse_fecha(r.get('Fecha y hora')).date() == hoy
        ]
        
        if not reclamos_hoy:
            raise HTTPException(status_code=404, detail="No hay reclamos para el día de hoy")
        
        # Crear figura
        plt.figure(figsize=(12, 8))
        
        # Datos para el gráfico
        df = pd.DataFrame(reclamos_hoy)
        
        # Gráfico 1: Reclamos por tipo
        plt.subplot(2, 2, 1)
        tipo_counts = df['Tipo de reclamo'].value_counts()
        tipo_counts.plot(kind='bar', color='skyblue')
        plt.title('Reclamos por Tipo')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        # Gráfico 2: Reclamos por estado
        plt.subplot(2, 2, 2)
        estado_counts = df['Estado'].value_counts()
        estado_counts.plot(kind='bar', color='lightcoral')
        plt.title('Reclamos por Estado')
        plt.xticks(rotation=45, ha='right')
        
        # Gráfico 3: Reclamos por sector
        plt.subplot(2, 2, 3)
        sector_counts = df['Sector'].value_counts().sort_index()
        sector_counts.plot(kind='bar', color='lightgreen')
        plt.title('Reclamos por Sector')
        plt.xlabel('Sector')
        
        # Gráfico 4: Reclamos por hora
        plt.subplot(2, 2, 4)
        df['Hora'] = pd.to_datetime(df['Fecha y hora']).dt.hour
        hora_counts = df['Hora'].value_counts().sort_index()
        hora_counts.plot(kind='line', marker='o', color='orange')
        plt.title('Reclamos por Hora del Día')
        plt.xlabel('Hora')
        plt.ylabel('Cantidad')
        
        plt.tight_layout()
        
        # Guardar imagen en buffer
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        plt.close()
        
        return StreamingResponse(
            img_buffer,
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=reporte_diario_{hoy.strftime('%Y%m%d')}.png"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte diario: {str(e)}")

@router.get("/tecnicos/{tecnico}/reclamos")
async def obtener_reclamos_tecnico(
    tecnico: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene todos los reclamos asignados a un técnico específico
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        
        reclamos_tecnico = [
            r for r in reclamos 
            if str(r.get('Técnico', '')).strip().upper() == tecnico.strip().upper()
        ]
        
        return reclamos_tecnico
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo reclamos del técnico: {str(e)}")

@router.get("/sectores/{sector}/reclamos")
async def obtener_reclamos_sector(
    sector: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene todos los reclamos de un sector específico
    """
    try:
        reclamos = await cargar_reclamos_desde_sheets()
        
        reclamos_sector = [
            r for r in reclamos 
            if str(r.get('Sector', '')).strip() == sector.strip()
        ]
        
        return reclamos_sector
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo reclamos del sector: {str(e)}")