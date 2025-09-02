# backend/routes/cierre.py
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any
from datetime import datetime
from ..utils.auth_utils import get_current_user
from ..utils.data_manager import DataManager
from ..config import constants
from ..config.settings import settings


router = APIRouter(prefix="/cierre", tags=["cierre"])

def _get_data_manager(request: Request) -> DataManager:
    """Safely retrieves the DataManager instance from the request state."""
    dm = getattr(request.app.state, 'data_manager', None)
    if not dm:
        raise HTTPException(status_code=503, detail="DataManager is not available.")
    return dm

@router.get("/reclamos-en-curso")
async def obtener_reclamos_en_curso(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Gets claims that are currently 'En curso' from the cache.
    """
    dm = _get_data_manager(request)
    all_claims = dm.get_claims()

    # Filter for claims with status "EN CURSO"
    claims_en_curso = [
        claim for claim in all_claims
        if claim.get("Estado", "").upper() == constants.ESTADO_EN_CURSO
    ]

    return {"reclamos": claims_en_curso}

@router.post("/reasignar-tecnico")
async def reasignar_tecnico(
    request: Request,
    reasignacion: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Reassigns a technician to a claim and sets its status to 'En curso'."""
    dm = _get_data_manager(request)
    id_reclamo = reasignacion.get("id_reclamo")
    nuevo_tecnico = reasignacion.get("nuevo_tecnico")

    if not id_reclamo or not nuevo_tecnico:
        raise HTTPException(status_code=400, detail="Incomplete data for reassignment.")

    updates = {
        "Técnico": nuevo_tecnico,
        "Estado": constants.ESTADO_EN_CURSO
    }
    success, error = await dm.update_claim_fields(id_reclamo, updates)

    if not success:
        raise HTTPException(status_code=404 if "not found" in (error or "") else 500, detail=error)

    return {"success": True, "message": "Technician reassigned successfully."}

@router.post("/cerrar-reclamo")
async def cerrar_reclamo(
    request: Request,
    cierre_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Closes a claim and updates the seal number if provided."""
    dm = _get_data_manager(request)
    id_reclamo = cierre_data.get("id_reclamo")
    nuevo_precinto = cierre_data.get("nuevo_precinto", "")

    if not id_reclamo:
        raise HTTPException(status_code=400, detail="Claim ID is required.")

    updates = {
        "Estado": constants.ESTADO_RESUELTO,
        "Fecha_formateada": datetime.now().strftime('%d/%m/%Y %H:%M')
    }
    if nuevo_precinto.strip():
        updates["N° de Precinto"] = nuevo_precinto.strip()

    success, error = await dm.update_claim_fields(id_reclamo, updates)

    if not success:
        raise HTTPException(status_code=404 if "not found" in (error or "") else 500, detail=error)

    # Note: Logic for updating the client's sheet is missing and should be added to DataManager
    return {"success": True, "message": "Claim closed successfully."}


@router.post("/volver-a-pendiente")
async def volver_a_pendiente(
    request: Request,
    reclamo_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Reverts a claim back to 'Pendiente' status."""
    dm = _get_data_manager(request)
    id_reclamo = reclamo_data.get("id_reclamo")

    if not id_reclamo:
        raise HTTPException(status_code=400, detail="Claim ID is required.")

    updates = {
        "Estado": constants.ESTADO_PENDIENTE,
        "Técnico": "",
        "Fecha_formateada": ""
    }
    success, error = await dm.update_claim_fields(id_reclamo, updates)

    if not success:
        raise HTTPException(status_code=404 if "not found" in (error or "") else 500, detail=error)

    return {"success": True, "message": "Claim reverted to pending."}

