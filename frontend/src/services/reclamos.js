import api from './api';

export const getReclamos = async () => {
  try {
    const response = await api.get('/reclamos');
    return response.data;
  } catch (error) {
    console.error('Error fetching reclamos:', error);
    throw error;
  }
};

export const generarReporteDiario = async () => {
  try {
    const response = await api.get('/reclamos/reporte-diario');
    return response.data;
  } catch (error) {
    console.error('Error generating daily report:', error);
    throw error;
  }
};

// Agregar otras funciones relacionadas con reclamos...

export const reclamosService = {
  // Obtener todos los reclamos
  obtenerTodos: async () => {
    const response = await api.get('/reclamos');
    return response.data;
  },

  // Obtener un reclamo específico
  obtenerPorId: async (id) => {
    const response = await api.get(`/reclamos/${id}`);
    return response.data;
  },

  // Crear nuevo reclamo
  crear: async (reclamoData) => {
    const response = await api.post('/reclamos', reclamoData);
    return response.data;
  },

  // Obtener configuración para formularios
  obtenerConfiguracion: async () => {
    const response = await api.get('/configuracion/reclamos');
    return response.data;
  }
};