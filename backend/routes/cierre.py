# backend/routes/cierre.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd
from ..utils.auth_utils import get_current_user
from ..utils.google_sheets import get_google_sheets_service
from ..config.settings import (
    COLUMNAS_RECLAMOS, 
    COLUMNAS_CLIENTES,
    TECNICOS_DISPONIBLES,
    SECTORES_DISPONIBLES,
    DEBUG_MODE
)

router = APIRouter(prefix="/cierre", tags=["cierre"])

# Helper para mapear nombre de columna a letra de Excel
def _excel_col_letter(n: int) -> str:
    letters = ""
    while n:
        n, rem = divmod(n - 1, 26)
        letters = chr(65 + rem) + letters
    return letters

def _col_letter(col_name: str) -> str:
    try:
        idx = COLUMNAS_RECLAMOS.index(col_name) + 1
        return _excel_col_letter(idx)
    except ValueError:
        return ""

@router.get("/reclamos-en-curso")
async def obtener_reclamos_en_curso(current_user: dict = Depends(get_current_user)):
    """
    Obtiene reclamos en curso filtrados por sector/técnico
    """
    try:
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.getenv("SHEET_ID")
        
        # Obtener reclamos
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range="Reclamos!A:Z"
        ).execute()
        
        values = result.get('values', [])
        if not values:
            return {"reclamos": []}
        
        # Convertir a DataFrame
        df = pd.DataFrame(values[1:], columns=values[0])
        
        # Filtrar reclamos en curso
        en_curso = df[df["Estado"] == "En curso"].copy()
        
        # Procesar datos
        reclamos_procesados = []
        for _, row in en_curso.iterrows():
            reclamo = {
                "id_reclamo": row.get("ID Reclamo", ""),
                "nro_cliente": row.get("Nº Cliente", ""),
                "nombre": row.get("Nombre", ""),
                "sector": row.get("Sector", ""),
                "tipo_reclamo": row.get("Tipo de reclamo", ""),
                "tecnico": row.get("Técnico", ""),
                "fecha_ingreso": row.get("Fecha y hora", ""),
                "fecha_cierre": row.get("Fecha_formateada", ""),
                "precinto": row.get("N° de Precinto", "")
            }
            reclamos_procesados.append(reclamo)
        
        return {"reclamos": reclamos_procesados}
        
    except Exception as e:
        if DEBUG_MODE:
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail="Error al obtener reclamos en curso")

@router.post("/reasignar-tecnico")
async def reasignar_tecnico(
    reasignacion: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    Reasigna técnico a un reclamo
    """
    try:
        id_reclamo = reasignacion.get("id_reclamo")
        nuevo_tecnico = reasignacion.get("nuevo_tecnico")
        
        if not id_reclamo or not nuevo_tecnico:
            raise HTTPException(status_code=400, detail="Datos incompletos")
        
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.getenv("SHEET_ID")
        
        # Encontrar la fila del reclamo
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range="Reclamos!A:Z"
        ).execute()
        
        values = result.get('values', [])
        if not values:
            raise HTTPException(status_code=404, detail="No se encontraron reclamos")
        
        # Buscar el reclamo por ID
        for i, row in enumerate(values[1:], start=2):  # Empezar desde fila 2
            if len(row) > COLUMNAS_RECLAMOS.index("ID Reclamo") and row[COLUMNAS_RECLAMOS.index("ID Reclamo")] == id_reclamo:
                # Actualizar técnico
                col_tecnico = _col_letter("Técnico")
                range_tecnico = f"{col_tecnico}{i}"
                
                update_data = {
                    "range": range_tecnico,
                    "values": [[nuevo_tecnico]]
                }
                
                # Si está pendiente, cambiar a "En curso"
                estado_actual = row[COLUMNAS_RECLAMOS.index("Estado")] if len(row) > COLUMNAS_RECLAMOS.index("Estado") else ""
                if estado_actual == "Pendiente":
                    col_estado = _col_letter("Estado")
                    range_estado = f"{col_estado}{i}"
                    update_data = [
                        {"range": range_tecnico, "values": [[nuevo_tecnico]]},
                        {"range": range_estado, "values": [["En curso"]]}
                    ]
                
                # Ejecutar actualización
                body = {
                    "valueInputOption": "USER_ENTERED",
                    "data": update_data if isinstance(update_data, list) else [update_data]
                }
                
                sheets_service.spreadsheets().values().batchUpdate(
                    spreadsheetId=spreadsheet_id,
                    body=body
                ).execute()
                
                return {"success": True, "message": "Técnico reasignado correctamente"}
        
        raise HTTPException(status_code=404, detail="Reclamo no encontrado")
        
    except Exception as e:
        if DEBUG_MODE:
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail="Error al reasignar técnico")

@router.post("/cerrar-reclamo")
async def cerrar_reclamo(
    cierre_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    Cierra un reclamo y actualiza precinto si es necesario
    """
    try:
        id_reclamo = cierre_data.get("id_reclamo")
        nuevo_precinto = cierre_data.get("nuevo_precinto", "")
        
        if not id_reclamo:
            raise HTTPException(status_code=400, detail="ID de reclamo requerido")
        
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.getenv("SHEET_ID")
        
        # Obtener datos actuales
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range="Reclamos!A:Z"
        ).execute()
        
        values = result.get('values', [])
        if not values:
            raise HTTPException(status_code=404, detail="No se encontraron reclamos")
        
        # Buscar el reclamo
        for i, row in enumerate(values[1:], start=2):
            if len(row) > COLUMNAS_RECLAMOS.index("ID Reclamo") and row[COLUMNAS_RECLAMOS.index("ID Reclamo")] == id_reclamo:
                nro_cliente = row[COLUMNAS_RECLAMOS.index("Nº Cliente")] if len(row) > COLUMNAS_RECLAMOS.index("Nº Cliente") else ""
                
                # Preparar actualizaciones
                updates = []
                
                # Actualizar estado a "Resuelto"
                col_estado = _col_letter("Estado")
                updates.append({
                    "range": f"{col_estado}{i}",
                    "values": [["Resuelto"]]
                })
                
                # Actualizar fecha de cierre
                col_fecha_cierre = _col_letter("Fecha_formateada")
                fecha_cierre = datetime.now().strftime('%d/%m/%Y %H:%M')
                updates.append({
                    "range": f"{col_fecha_cierre}{i}",
                    "values": [[fecha_cierre]]
                })
                
                # Actualizar precinto si es necesario
                if nuevo_precinto.strip():
                    col_precinto = _col_letter("N° de Precinto")
                    updates.append({
                        "range": f"{col_precinto}{i}",
                        "values": [[nuevo_precinto.strip()]]
                    })
                    
                    # Actualizar también en la hoja de clientes
                    clientes_result = sheets_service.spreadsheets().values().get(
                        spreadsheetId=spreadsheet_id,
                        range="Clientes!A:Z"
                    ).execute()
                    
                    clientes_values = clientes_result.get('values', [])
                    if clientes_values:
                        for j, cliente_row in enumerate(clientes_values[1:], start=2):
                            if (len(cliente_row) > COLUMNAS_CLIENTES.index("Nº Cliente") and 
                                cliente_row[COLUMNAS_CLIENTES.index("Nº Cliente")] == nro_cliente):
                                
                                col_precinto_clientes = _col_letter_clientes("N° de Precinto")
                                updates.append({
                                    "range": f"Clientes!{col_precinto_clientes}{j}",
                                    "values": [[nuevo_precinto.strip()]]
                                })
                                break
                
                # Ejecutar actualizaciones
                body = {
                    "valueInputOption": "USER_ENTERED",
                    "data": updates
                }
                
                sheets_service.spreadsheets().values().batchUpdate(
                    spreadsheetId=spreadsheet_id,
                    body=body
                ).execute()
                
                return {"success": True, "message": "Reclamo cerrado correctamente"}
        
        raise HTTPException(status_code=404, detail="Reclamo no encontrado")
        
    except Exception as e:
        if DEBUG_MODE:
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail="Error al cerrar reclamo")

@router.post("/volver-a-pendiente")
async def volver_a_pendiente(
    reclamo_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    Vuelve un reclamo a estado Pendiente
    """
    try:
        id_reclamo = reclamo_data.get("id_reclamo")
        
        if not id_reclamo:
            raise HTTPException(status_code=400, detail="ID de reclamo requerido")
        
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.getenv("SHEET_ID")
        
        # Buscar el reclamo
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range="Reclamos!A:Z"
        ).execute()
        
        values = result.get('values', [])
        if not values:
            raise HTTPException(status_code=404, detail="No se encontraron reclamos")
        
        for i, row in enumerate(values[1:], start=2):
            if len(row) > COLUMNAS_RECLAMOS.index("ID Reclamo") and row[COLUMNAS_RECLAMOS.index("ID Reclamo")] == id_reclamo:
                # Preparar actualizaciones
                updates = [
                    {
                        "range": f"{_col_letter('Estado')}{i}",
                        "values": [["Pendiente"]]
                    },
                    {
                        "range": f"{_col_letter('Técnico')}{i}",
                        "values": [[""]]
                    },
                    {
                        "range": f"{_col_letter('Fecha_formateada')}{i}",
                        "values": [[""]]
                    }
                ]
                
                # Ejecutar actualizaciones
                body = {
                    "valueInputOption": "USER_ENTERED",
                    "data": updates
                }
                
                sheets_service.spreadsheets().values().batchUpdate(
                    spreadsheetId=spreadsheet_id,
                    body=body
                ).execute()
                
                return {"success": True, "message": "Reclamo vuelto a pendiente"}
        
        raise HTTPException(status_code=404, detail="Reclamo no encontrado")
        
    except Exception as e:
        if DEBUG_MODE:
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail="Error al cambiar estado del reclamo")

# Helper para hoja de clientes
def _col_letter_clientes(col_name: str) -> str:
    try:
        idx = COLUMNAS_CLIENTES.index(col_name) + 1
        return _excel_col_letter(idx)
    except ValueError:
        return ""

