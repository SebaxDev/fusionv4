// frontend/src/services/notificationsService.js
import api from './api';

export const notificationsService = {
  getUserNotifications: async (userId, unreadOnly = true) => {
    try {
      const response = await api.get('/notificaciones', {
        params: { user_id: userId, unread_only: unreadOnly }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al obtener notificaciones' 
      };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notificaciones/${notificationId}/leer`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al marcar como leída' 
      };
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notificaciones/marcar-todas-leidas');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al marcar todas como leídas' 
      };
    }
  },

  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/notificaciones', notificationData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creando notificación:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al crear notificación' 
      };
    }
  },

  clearAll: async () => {
    try {
      const response = await api.delete('/notificaciones/limpiar');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al limpiar notificaciones' 
      };
    }
  }
};

export default notificationsService;