# backend/utils/google_sheets.py (NUEVA VERSIÓN)
"""
Servicio optimizado de Google Sheets usando DataManager
"""
from .data_manager import get_data_manager
from config import settings

async def get_all_records(sheet_name: str) -> list:
    """Obtiene todos los registros de una hoja"""
    dm = get_data_manager()
    df = await dm.get_sheet_data(settings.SHEET_ID, f"{sheet_name}!A:Z")
    return df.to_dict('records')

async def append_record(sheet_name: str, data: list) -> bool:
    """Agrega un nuevo registro a una hoja"""
    dm = get_data_manager()
    success, error = await dm.append_row(settings.SHEET_ID, f"{sheet_name}!A:Z", data)
    return success

async def update_record(sheet_name: str, row_index: int, data: list) -> bool:
    """Actualiza un registro existente"""
    dm = get_data_manager()
    range_name = f"{sheet_name}!A{row_index}:Z{row_index}"
    success, error = await dm.update_row(settings.SHEET_ID, range_name, data)
    return success