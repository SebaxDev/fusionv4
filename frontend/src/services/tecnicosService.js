// frontend/src/services/tecnicosService.js
import api from './api';

export const obtenerTecnicos = async () => {
  try {
    const response = await api.get('/tecnicos');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo técnicos:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener técnicos' 
    };
  }
};

export const obtenerTecnicosActivos = async () => {
  try {
    const response = await api.get('/tecnicos/activos');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo técnicos activos:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener técnicos activos' 
    };
  }
};

const tecnicosService = {
  obtenerTecnicos,
  obtenerTecnicosActivos
};

export default tecnicosService;