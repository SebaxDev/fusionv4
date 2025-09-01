// frontend/src/services/cierreService.js
import api from './api';

export const cierreService = {
  // Obtener reclamos en curso
  obtenerReclamosEnCurso: async () => {
    try {
      const response = await api.get('/cierre/reclamos-en-curso');
      return { success: true, data: response.data.reclamos };
    } catch (error) {
      console.error('Error obteniendo reclamos en curso:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al obtener reclamos en curso' 
      };
    }
  },

  // Reasignar técnico
  reasignarTecnico: async (idReclamo, nuevoTecnico) => {
    try {
      const response = await api.post('/cierre/reasignar-tecnico', {
        id_reclamo: idReclamo,
        nuevo_tecnico: nuevoTecnico
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error reasignando técnico:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al reasignar técnico' 
      };
    }
  },

  // Cerrar reclamo
  cerrarReclamo: async (idReclamo, nuevoPrecinto = '') => {
    try {
      const response = await api.post('/cierre/cerrar-reclamo', {
        id_reclamo: idReclamo,
        nuevo_precinto: nuevoPrecinto
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error cerrando reclamo:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al cerrar reclamo' 
      };
    }
  },

  // Volver a pendiente
  volverAPendiente: async (idReclamo) => {
    try {
      const response = await api.post('/cierre/volver-a-pendiente', {
        id_reclamo: idReclamo
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error volviendo a pendiente:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al cambiar estado' 
      };
    }
  }
};

export default cierreService;