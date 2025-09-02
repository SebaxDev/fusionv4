// frontend/src/services/reclamosService.js
import api from './api';

const handleRequest = async (request) => {
  try {
    const response = await request();
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.detail || 'An unexpected error occurred.';
    console.error(`API Error: ${errorMessage}`, error);
    return { success: false, error: errorMessage };
  }
};

export const obtenerReclamos = (filtros = {}) => {
  return handleRequest(() => api.get('/api/v1/reclamos', { params: filtros }));
};

export const crearReclamo = (reclamoData) => {
  return handleRequest(() => api.post('/api/v1/reclamos', reclamoData));
};

export const actualizarReclamo = (id, reclamoData) => {
  return handleRequest(() => api.put(`/api/v1/reclamos/${id}`, reclamoData));
};

export const cambiarEstadoReclamo = (id, nuevoEstado) => {
  return handleRequest(() => api.patch(`/api/v1/reclamos/${id}/estado`, { estado: nuevoEstado }));
};

export const obtenerReclamosActivos = () => {
  return handleRequest(() => api.get('/api/v1/reclamos/activos'));
};

const reclamosService = {
  obtenerReclamos,
  crearReclamo,
  actualizarReclamo,
  cambiarEstadoReclamo,
  obtenerReclamosActivos,
};

export default reclamosService;