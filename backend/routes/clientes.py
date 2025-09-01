# backend/routes/clientes.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import pandas as pd
import uuid
from datetime import datetime
from ..utils.auth_utils import get_current_user
from ..utils.google_sheets import get_google_sheets_service
from ..config.settings import (
    COLUMNAS_CLIENTES, 
    SECTORES_DISPONIBLES,
    DEBUG_MODE
)

router = APIRouter(prefix="/clientes", tags=["clientes"])

@router.get("/todos")
async def obtener_todos_clientes(current_user: dict = Depends(get_current_user)):
    """Obtiene todos los clientes con sus datos completos"""
    try:
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.getenv("SHEET_ID")
        
        # Obtener clientes
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range="Clientes!A:Z"
        ).execute()
        
        values = result.get('values', [])
        if not values:
            return {"clientes": []}
        
        # Convertir a lista de diccionarios
        headers = values[0]
        clientes = []
        
        for row in values[1:]:
            cliente = {}
            for i, header in enumerate(headers):
                if i < len(row):
                    cliente[header] = row[i]
                else:
                    cliente[header] = ""
            clientes.append(cliente)
        
        return {"clientes": clientes}
        
    except Exception as e:
        if DEBUG_MODE:
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail="Error al obtener clientes")

@router.get("/{nro_cliente}")
async def obtener_cliente_por_id(nro_cliente: str, current_user: dict = Depends(get_current_user)):
    """Obtiene un cliente específico por su número"""
    try:
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.getenv("SHEET_ID")
        
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range="Clientes!A:Z"
        ).execute()
        
        values = result.get('values', [])
        if not values:
            raise HTTPException(status_code=404, detail="No se encontraron clientes")
        
        headers = values[0]
        for row in values[1:]:
            if len(row) > 0 and row[0] == nro_cliente:
                cliente = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        cliente[header] = row[i]
                    else:
                        cliente[header] = ""
                return cliente
        
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    except Exception as e:
        if DEBUG_MODE:
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail="Error al obtener cliente")

@router.post("/")
async def crear_cliente(cliente_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Crea un nuevo cliente"""
    try:
        nro_cliente = cliente_data.get("nro_cliente")
        sector = cliente_data.get("sector")
        nombre = cliente_data.get("nombre")
        direccion = cliente_data.get("direccion")
        telefono = cliente_data.get("telefono", "")
        precinto = cliente_data.get("precinto", "")
        
        # Validaciones
        if not all([nro_cliente, sector, nombre, direccion]):
            raise HTTPException(status_code=400, detail="Datos incompletos")
        
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.getenv("SHEET_ID")
        
        # Verificar que el número de cliente no exista
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range="Clientes!A:A"
        ).execute()
        
        existing_numbers = [row[0] for row in result.get('values', [])[1:] if row]
        if nro_cliente in existing_numbers:
            raise HTTPException(status_code=400, detail="El número de cliente ya existe")
        
        # Crear nueva fila
        nuevo_id = str(uuid.uuid4())[:8].upper()
        fecha_actual = datetime.now().strftime('%d/%m/%Y %H:%M')
        
        nueva_fila = [
            nro_cliente,
            sector,
            nombre.upper(),
            direccion.upper(),
            telefono,
            precinto,
            nuevo_id,
            fecha_actual,
            "", "", ""  # Campos adicionales para email, observaciones, historial
        ]
        
        # Añadir fila
        body = {
            "values": [nueva_fila]
        }
        
        sheets_service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range="Clientes!A:K",
            valueInputOption="USER_ENTERED",
            body=body
        ).execute()
        
        return {"success": True, "message": "Cliente creado correctamente", "id_cliente": nuevo_id}
        
    except Exception as e:
        if DEBUG_MODE:
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail="Error al crear cliente")

@router.put("/{nro_cliente}")
async def actualizar_cliente(nro_cliente: str, cliente_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Actualiza los datos de un cliente existente"""
    try:
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.getenv("SHEET_ID")
        
        # Buscar el cliente
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range="Clientes!A:Z"
        ).execute()
        
        values = result.get('values', [])
        if not values:
            raise HTTPException(status_code=404, detail="No se encontraron clientes")
        
        headers = values[0]
        updates = []
        
        for i, row in enumerate(values[1:], start=2):
            if len(row) > 0 and row[0] == nro_cliente:
                # Preparar actualizaciones
                campos_actualizables = {
                    "Sector": cliente_data.get("sector"),
                    "Nombre": cliente_data.get("nombre"),
                    "Dirección": cliente_data.get("direccion"),
                    "Teléfono": cliente_data.get("telefono"),
                    "N° de Precinto": cliente_data.get("precinto"),
                    "Última Modificación": datetime.now().strftime('%d/%m/%Y %H:%M')
                }
                
                for campo, nuevo_valor in campos_actualizables.items():
                    if nuevo_valor is not None:
                        col_idx = headers.index(campo)
                        col_letter = chr(65 + col_idx)
                        updates.append({
                            "range": f"{col_letter}{i}",
                            "values": [[nuevo_valor]]
                        })
                
                break
        
        if not updates:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Ejecutar actualizaciones
        body = {
            "valueInputOption": "USER_ENTERED",
            "data": updates
        }
        
        sheets_service.spreadsheets().values().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=body
        ).execute()
        
        return {"success": True, "message": "Cliente actualizado correctamente"}
        
    except Exception as e:
        if DEBUG_MODE:
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail="Error al actualizar cliente")

@router.get("/{nro_cliente}/reclamos")
async def obtener_reclamos_cliente(nro_cliente: str, current_user: dict = Depends(get_current_user)):
    """Obtiene los reclamos de un cliente específico"""
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
        
        headers = values[0]
        reclamos_cliente = []
        
        for row in values[1:]:
            if len(row) > 1 and row[1] == nro_cliente:  # Columna B: Nº Cliente
                reclamo = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        reclamo[header] = row[i]
                    else:
                        reclamo[header] = ""
                reclamos_cliente.append(reclamo)
        
        # Ordenar por fecha más reciente
        reclamos_cliente.sort(
            key=lambda x: datetime.strptime(x.get('Fecha y hora', '01/01/2000'), '%d/%m/%Y %H:%M') 
            if x.get('Fecha y hora') else datetime.min,
            reverse=True
        )
        
        return {"reclamos": reclamos_cliente[:10]}  # Últimos 10 reclamos
        
    except Exception as e:
        if DEBUG_MODE:
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail="Error al obtener reclamos del cliente")