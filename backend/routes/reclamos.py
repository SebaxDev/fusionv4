# backend/routes/reclamos.py
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from datetime import datetime
import pandas as pd
from typing import List, Dict, Any, Optional

# Local application imports
from ..models.reclamo import ReclamoCreate, ReclamoUpdate
from ..utils.auth_utils import get_current_user
from ..utils.data_manager import DataManager
from ..utils.date_utils import parse_fecha, ahora_argentina
from ..config import constants

router = APIRouter()

# --- HELPER FUNCTIONS ---
def _get_data_manager(request: Request) -> DataManager:
    """Safely retrieves the DataManager instance from the request state."""
    dm = getattr(request.app.state, 'data_manager', None)
    if not dm:
        raise HTTPException(status_code=503, detail="DataManager is not available.")
    return dm

# --- MAIN ENDPOINTS ---
@router.get("")
async def obtener_reclamos(
    request: Request,
    estado: Optional[str] = Query(None, description="Filter by status"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    # ... other filters can be added here and passed to a dedicated DataManager method
    current_user: dict = Depends(get_current_user)
):
    """Retrieves all claims, served from in-memory cache."""
    dm = _get_data_manager(request)
    # The filtering logic will be moved to the DataManager in a future step.
    # For now, we get all claims and filter here.
    reclamos = dm.get_claims()

    if estado and estado.lower() != 'todos':
        reclamos = [r for r in reclamos if str(r.get('Estado', '')).lower() == estado.lower()]
    if sector and sector.lower() != 'todos':
        reclamos = [r for r in reclamos if str(r.get('Sector', '')).strip().lower() == sector.lower()]
        
    return reclamos

@router.get("/{nro_cliente}")
async def obtener_reclamos_cliente(request: Request, nro_cliente: str, current_user: dict = Depends(get_current_user)):
    """Retrieves all claims for a specific client from cache."""
    dm = _get_data_manager(request)
    reclamos = dm.get_claims()
    return [r for r in reclamos if str(r.get('Nº Cliente', '')).strip() == nro_cliente.strip()]

@router.get("/activos")
async def obtener_todos_reclamos_activos(request: Request, current_user: dict = Depends(get_current_user)):
    """Retrieves all active claims from cache."""
    dm = _get_data_manager(request)
    reclamos = dm.get_claims()
    active_statuses = {status.lower() for status in constants.ESTADOS_ACTIVOS}
    return [r for r in reclamos if str(r.get('Estado', '')).lower().strip() in active_statuses]

@router.post("")
async def crear_reclamo(request: Request, reclamo_data: ReclamoCreate, current_user: dict = Depends(get_current_user)):
    """Creates a new claim and triggers a data refresh."""
    dm = _get_data_manager(request)

    new_claim_dict = reclamo_data.dict()
    new_claim_dict['Fecha y hora'] = ahora_argentina().isoformat()
    new_claim_dict['Estado'] = constants.ESTADO_DESCONEXION if "desconexion a pedido" in reclamo_data.tipoReclamo.lower() else constants.ESTADO_PENDIENTE

    success, error = await dm.create_claim(new_claim_dict)

    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to create claim: {error}")
        
    return {"message": "Claim created successfully, data refresh triggered.", "id": reclamo_data.idUnico}

@router.put("/{id_reclamo}")
async def actualizar_reclamo(request: Request, id_reclamo: str, updates: ReclamoUpdate, current_user: dict = Depends(get_current_user)):
    """Updates a claim using its ID."""
    dm = _get_data_manager(request)
    update_data = updates.dict(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided.")

    success, error = await dm.update_claim_fields(id_reclamo, update_data)

    if not success:
        status_code = 404 if "not found" in (error or "").lower() else 500
        raise HTTPException(status_code=status_code, detail=f"Failed to update claim: {error}")

    return {"message": f"Claim {id_reclamo} updated successfully."}

@router.patch("/{id_reclamo}/estado")
async def cambiar_estado_reclamo(request: Request, id_reclamo: str, estado_data: Dict[str, str], current_user: dict = Depends(get_current_user)):
    """Changes the status of a specific claim."""
    dm = _get_data_manager(request)
    nuevo_estado = estado_data.get('estado')

    if not nuevo_estado:
        raise HTTPException(status_code=400, detail="Field 'estado' is required.")

    success, error = await dm.update_claim_fields(id_reclamo, {"Estado": nuevo_estado})

    if not success:
        status_code = 404 if "not found" in (error or "").lower() else 500
        raise HTTPException(status_code=status_code, detail=f"Failed to update claim status: {error}")

    return {"message": f"Claim {id_reclamo} status updated to {nuevo_estado}."}

@router.get("/estadisticas/resumen")
async def obtener_estadisticas_reclamos(request: Request, current_user: dict = Depends(get_current_user)):
    """Retrieves summary statistics for claims from cache."""
    dm = _get_data_manager(request)
    reclamos = dm.get_claims()

    if not reclamos:
        return {"total": 0, "pendientes": 0, "en_curso": 0, "resueltos": 0, "por_tipo": {}, "por_sector": {}}

    df = pd.DataFrame(reclamos)
    df['Estado'] = df['Estado'].str.strip().str.upper()

    total = len(df)
    pendientes = len(df[df['Estado'] == constants.ESTADO_PENDIENTE])
    en_curso = len(df[df['Estado'] == constants.ESTADO_EN_CURSO])
    resueltos = len(df[df['Estado'].isin(constants.ESTADOS_FINALIZADOS)])

    por_tipo = df['Tipo de reclamo'].value_counts().to_dict()
    por_sector = df['Sector'].value_counts().to_dict()

    return {
        "total": total, "pendientes": pendientes, "en_curso": en_curso,
        "resueltos": resueltos, "por_tipo": por_tipo, "por_sector": por_sector
    }

# PDF and Image generation endpoints have been removed as they were not fully implemented
# and depended on heavy libraries not essential for the core CRM functionality.
# They can be re-added as a future feature if needed.