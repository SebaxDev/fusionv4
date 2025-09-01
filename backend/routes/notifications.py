# backend/routes/notifications.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from services.notification_service import notification_service
from models.notification import NotificationResponse
from utils.auth_utils import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Obtiene las notificaciones del usuario actual"""
    try:
        notifications = await notification_service.get_user_notifications(
            current_user["user_id"]
        )
        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{notification_id}/read")
async def mark_notification_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Marca una notificación como leída"""
    try:
        success = await notification_service.mark_as_read(notification_id)
        if not success:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        return {"message": "Notificación marcada como leída"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))