# backend/services/notification_service.py
import logging
from typing import List, Dict, Any
from datetime import datetime
from utils.data_manager import get_data_manager
from config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    """Servicio para gestionar notificaciones del sistema"""
    
    def __init__(self):
        self.dm = get_data_manager()
    
    async def create_notification(self, user_id: str, title: str, message: str, 
                                notification_type: str = "info", priority: str = "medium") -> bool:
        """Crea una nueva notificación"""
        try:
            notification_data = [
                str(datetime.now()),
                user_id,
                title,
                message,
                notification_type,
                priority,
                "unread"
            ]
            
            success, error = await self.dm.append_row(
                settings.SHEET_ID,
                "NOTIFICACIONES!A:G",
                notification_data
            )
            
            if success:
                logger.info(f"Notificación creada para usuario {user_id}")
            else:
                logger.error(f"Error creando notificación: {error}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error en create_notification: {str(e)}")
            return False
    
    async def get_user_notifications(self, user_id: str, unread_only: bool = True) -> List[Dict[str, Any]]:
        """Obtiene notificaciones de un usuario"""
        try:
            df = await self.dm.get_sheet_data(
                settings.SHEET_ID, 
                "NOTIFICACIONES!A:G",
                ["timestamp", "user_id", "title", "message", "type", "priority", "status"]
            )
            
            # Filtrar por usuario
            user_notifications = df[df["user_id"] == user_id]
            
            # Filtrar por estado si es necesario
            if unread_only:
                user_notifications = user_notifications[user_notifications["status"] == "unread"]
            
            return user_notifications.to_dict('records')
            
        except Exception as e:
            logger.error(f"Error obteniendo notificaciones: {str(e)}")
            return []
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Marca una notificación como leída"""
        # Implementación usando update_cell de data_manager
        pass

# Instancia global
notification_service = NotificationService()