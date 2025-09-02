# backend/routes/clientes.py
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any

from ..dependencies import get_data_manager
from ..utils.auth_utils import get_current_user
from ..utils.data_manager import DataManager

router = APIRouter(prefix="/clientes", tags=["clientes"])

@router.get("/")
async def obtener_todos_clientes(dm: DataManager = Depends(get_data_manager), current_user: dict = Depends(get_current_user)):
    """Retrieves all clients from the in-memory cache."""
    return dm.get_clients()

@router.get("/{nro_cliente}")
async def obtener_cliente_por_id(nro_cliente: str, dm: DataManager = Depends(get_data_manager), current_user: dict = Depends(get_current_user)):
    """Retrieves a specific client by their ID from the cache."""
    cliente = dm.get_client_by_id(nro_cliente)
    if not cliente:
        raise HTTPException(status_code=404, detail="Client not found.")
    return cliente

@router.post("/")
async def crear_cliente(cliente_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Creates a new client."""
    # This functionality will be fully implemented in the DataManager in a future step.
    raise HTTPException(status_code=501, detail="Client creation is being refactored.")

@router.put("/{nro_cliente}")
async def actualizar_cliente(nro_cliente: str, cliente_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Updates an existing client's data."""
    # This functionality will be fully implemented in the DataManager in a future step.
    raise HTTPException(status_code=501, detail="Client update is being refactored.")