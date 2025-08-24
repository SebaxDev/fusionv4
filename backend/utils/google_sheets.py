import gspread
from google.oauth2.service_account import Credentials
import json
import os
from config.settings import GOOGLE_SHEETS_CREDENTIALS, SHEET_ID

def get_google_sheets_client():
    """
    Conecta y autentica con Google Sheets API
    """
    try:
        # Parsear las credenciales desde variable de entorno
        creds_dict = json.loads(GOOGLE_SHEETS_CREDENTIALS)
        scopes = ["https://www.googleapis.com/auth/spreadsheets"]
        
        credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        client = gspread.authorize(credentials)
        
        return client
    except Exception as e:
        raise Exception(f"Error conectando a Google Sheets: {str(e)}")

def get_sheet(sheet_name):
    """
    Obtiene una hoja específica por nombre
    """
    try:
        client = get_google_sheets_client()
        spreadsheet = client.open_by_key(SHEET_ID)
        worksheet = spreadsheet.worksheet(sheet_name)
        return worksheet
    except Exception as e:
        raise Exception(f"Error accediendo a la hoja {sheet_name}: {str(e)}")

def get_all_records(sheet_name):
    """
    Obtiene todos los registros de una hoja
    """
    worksheet = get_sheet(sheet_name)
    return worksheet.get_all_records()

def append_record(sheet_name, data):
    """
    Agrega un nuevo registro a una hoja
    """
    worksheet = get_sheet(sheet_name)
    worksheet.append_row(data)
    return True

def update_record(sheet_name, row_index, data):
    """
    Actualiza un registro existente
    """
    worksheet = get_sheet(sheet_name)
    worksheet.update(f"A{row_index}", [data])
    return True