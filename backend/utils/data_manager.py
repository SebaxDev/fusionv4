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
from ..config import settings

# Configurar logging
logger = logging.getLogger(__name__)

from ..config import constants

class DataManager:
    """
    Manages data operations with Google Sheets, including a simple in-memory cache.
    """
    
    def __init__(self, sheet_id: str, creds_info: Dict[str, Any]):
        self.sheet_id = sheet_id
        self.service = self._initialize_service(creds_info)
        self.claims_df = pd.DataFrame()
        self.clients_df = pd.DataFrame()
        self.users_df = pd.DataFrame()

    def _initialize_service(self, creds_info: Dict[str, Any]):
        """Initializes the Google Sheets service."""
        try:
            if not creds_info:
                logger.warning("Google Sheets credentials not configured. DataManager will not connect.")
                return None
            
            creds = service_account.Credentials.from_service_account_info(
                creds_info, scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
            service = build('sheets', 'v4', credentials=creds, cache_discovery=False)
            logger.info("✅ Google Sheets service initialized successfully.")
            return service
        except Exception as e:
            logger.error(f"❌ Failed to initialize Google Sheets service: {e}")
            return None

    async def _safe_sheet_operation(self, operation, *args, **kwargs):
        """Executes a sheet operation with retries for transient errors."""
        for attempt in range(3):
            try:
                # The execute method is not async, so we run it in a thread pool
                loop = asyncio.get_running_loop()
                return await loop.run_in_executor(None, lambda: operation(*args, **kwargs).execute())
            except HttpError as e:
                if e.resp.status in [429, 500, 503] and attempt < 2:
                    await asyncio.sleep(2 ** attempt)
                else:
                    logger.error(f"Google Sheets API error after retries: {e}")
                    raise
        raise Exception("Failed to execute sheet operation after multiple retries.")

    async def load_all_data(self):
        """Loads all data from the primary sheets into memory."""
        if not self.service:
            logger.warning("Cannot load data: Google Sheets service is not available.")
            return

        logger.info("🔄 Loading all data from Google Sheets...")
        try:
            claims_range = f"{constants.SHEET_RECLAMOS}!A:Z"
            clients_range = f"{constants.SHEET_CLIENTES}!A:Z"
            users_range = "usuarios!A:Z" # Assuming a sheet named 'usuarios'

            # Load sequentially for simplicity
            self.claims_df = await self._fetch_sheet_data(claims_range, constants.COLUMNAS_RECLAMOS)
            self.clients_df = await self._fetch_sheet_data(clients_range, constants.COLUMNAS_CLIENTES)
            # This will fail if 'usuarios' sheet or columns are not defined, which is fine for now
            # as it highlights a configuration need.
            self.users_df = await self._fetch_sheet_data(users_range, ["username", "password", "nombre", "rol", "activo"])


            logger.info(f"✅ Loaded {len(self.claims_df)} claims, {len(self.clients_df)} clients, and {len(self.users_df)} users.")
        except Exception as e:
            logger.error(f"❌ Failed to load all data from sheets: {e}")

    async def _fetch_sheet_data(self, range_name: str, columns: List[str]) -> pd.DataFrame:
        """Fetches and processes data for a single sheet."""
        result = await self._safe_sheet_operation(
            self.service.spreadsheets().values().get,
            spreadsheetId=self.sheet_id,
            range=range_name
        )
        values = result.get('values', [])
        
        if not values or len(values) < 1:
            return pd.DataFrame(columns=columns)

        header = values[0]
        data = values[1:]
        # Pad rows with empty strings to match header length
        max_len = len(header)
        for row in data:
            row.extend([''] * (max_len - len(row)))

        df = pd.DataFrame(data, columns=header)
        
        # Ensure all required columns exist
        for col in columns:
            if col not in df.columns:
                df[col] = ''
        return df[columns]

    def get_claims(self) -> List[Dict[str, Any]]:
        """Retrieves all claims from the in-memory cache."""
        return self.claims_df.to_dict('records')

    def get_clients(self) -> List[Dict[str, Any]]:
        """Retrieves all clients from the in-memory cache."""
        return self.clients_df.to_dict('records')

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single user by username from the cache."""
        if self.users_df.empty:
            return None
        
        user = self.users_df[self.users_df['username'].str.lower() == username.lower()]
        if not user.empty:
            return user.to_dict('records')[0]
        return None

    def get_client_by_id(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single client by their ID from the cache."""
        if self.clients_df.empty:
            return None

        # Ensure the client ID column is string type for comparison
        self.clients_df['Nº Cliente'] = self.clients_df['Nº Cliente'].astype(str)
        client = self.clients_df[self.clients_df['Nº Cliente'] == str(client_id)]
        
        if not client.empty:
            return client.to_dict('records')[0]
        return None

    def _get_col_letter(self, col_name: str, sheet_columns: List[str]) -> Optional[str]:
        """Converts a column name to its A1 notation letter."""
        try:
            idx = sheet_columns.index(col_name) + 1
            letter = ""
            while idx > 0:
                idx, remainder = divmod(idx - 1, 26)
                letter = chr(65 + remainder) + letter
            return letter
        except ValueError:
            logger.error(f"Column '{col_name}' not found in the defined columns.")
            return None

    async def create_claim(self, claim_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Appends a new claim to the sheet and refreshes the cache."""
        if not self.service:
            return False, "Google Sheets service not available."
        try:
            new_row = [claim_data.get(col, '') for col in constants.COLUMNAS_RECLAMOS]
            await self._safe_sheet_operation(
                self.service.spreadsheets().values().append,
                spreadsheetId=self.sheet_id,
                range=f"{constants.SHEET_RECLAMOS}!A1",
                valueInputOption='USER_ENTERED',
                insertDataOption='INSERT_ROWS',
                body={'values': [new_row]}
            )
            asyncio.create_task(self.load_all_data())
            return True, None
        except Exception as e:
            return False, str(e)

    async def update_claim_fields(self, claim_id: str, updates: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Updates specific fields for a given claim ID."""
        if not self.service:
            return False, "Google Sheets service not available."
            
        # Find the row index for the given claim_id
        try:
            # Ensure 'ID Reclamo' column is treated as string for comparison
            self.claims_df['ID Reclamo'] = self.claims_df['ID Reclamo'].astype(str)
            match = self.claims_df[self.claims_df['ID Reclamo'] == str(claim_id)]
            if match.empty:
                return False, "Claim ID not found"
            
            row_index = match.index[0] + 2  # +1 for header, +1 for 1-based index
            
            batch_updates = []
            for field, value in updates.items():
                col_letter = self._get_col_letter(field, constants.COLUMNAS_RECLAMOS)
                if not col_letter:
                    continue # Skip if column not found

                batch_updates.append({
                    'range': f"{constants.SHEET_RECLAMOS}!{col_letter}{row_index}",
                    'values': [[value]]
                })
            
            if not batch_updates:
                return False, "No valid fields to update."
            
            await self._safe_sheet_operation(
                self.service.spreadsheets().values().batchUpdate,
                spreadsheetId=self.sheet_id,
                body={'valueInputOption': 'USER_ENTERED', 'data': batch_updates}
            )
            
            asyncio.create_task(self.load_all_data())
            return True, None
            
        except Exception as e:
            logger.error(f"Error updating claim {claim_id}: {e}")
            return False, str(e)

    async def cleanup(self):
        """Cleans up resources. Currently a placeholder."""
        logger.info("🧹 DataManager cleanup.")

def initialize_data_manager():
    """Initializes a DataManager instance for the application state."""
    if not settings.sheet_id or not settings.google_sheets_credentials:
        logger.error("FATAL: Cannot initialize DataManager. SHEET_ID or GOOGLE_SHEETS_CREDENTIALS are not set.")
        # In a real scenario, you might want the app to fail hard here.
        # For now, we return None and let the startup event handle it.
        return None

    return DataManager(
        sheet_id=settings.sheet_id,
        creds_info=settings.google_sheets_credentials
    )