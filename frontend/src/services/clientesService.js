// frontend/src/services/clientesService.js
import api from './api';

export const obtenerClientes = async (sector = null) => {
  try {
    const params = sector ? { sector } : {};
    const response = await api.get('/clientes', { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener clientes' 
    };
  }
};

export const obtenerTodosClientes = async () => {
  try {
    const response = await api.get('/clientes/todos');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo todos los clientes:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener todos los clientes' 
    };
  }
};

export const obtenerCliente = async (nroCliente) => {
  try {
    const response = await api.get(`/clientes/${nroCliente}`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'Cliente no encontrado' };
    }
    console.error('Error obteniendo cliente:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener cliente' 
    };
  }
};

export const crearCliente = async (clienteData) => {
  try {
    const response = await api.post('/clientes', clienteData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error creando cliente:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al crear cliente' 
    };
  }
};

export const actualizarCliente = async (nroCliente, clienteData) => {
  try {
    const response = await api.put(`/clientes/${nroCliente}`, clienteData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al actualizar cliente' 
    };
  }
};

export const obtenerReclamosCliente = async (nroCliente) => {
  try {
    const response = await api.get(`/clientes/${nroCliente}/reclamos`);
    return { success: true, data: response.data.reclamos };
  } catch (error) {
    console.error('Error obteniendo reclamos del cliente:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener reclamos del cliente' 
    };
  }
};

export const buscarCliente = async (termino) => {
  try {
    const response = await api.get('/clientes/buscar', { 
      params: { q: termino } 
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error buscando cliente:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al buscar cliente' 
    };
  }
};

export const buscarClientesAvanzado = async (criterios) => {
  try {
    const response = await api.get('/clientes/buscar-avanzado', { 
      params: criterios 
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error en búsqueda avanzada de clientes:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error en búsqueda avanzada de clientes' 
    };
  }
};

export const exportarClientes = async (filtros = {}) => {
  try {
    const response = await api.get('/clientes/exportar', {
      params: filtros,
      responseType: 'blob'
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error exportando clientes:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al exportar clientes' 
    };
  }
};

export const importarClientes = async (formData) => {
  try {
    const response = await api.post('/clientes/importar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error importando clientes:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al importar clientes' 
    };
  }
};

// Servicio principal para compatibilidad
const clientesService = {
  // Funciones existentes
  obtenerClientes,
  obtenerTodosClientes,
  obtenerCliente,
  buscarCliente,
  
  // Nuevas funciones agregadas
  crearCliente,
  actualizarCliente,
  obtenerReclamosCliente,
  buscarClientesAvanzado,
  exportarClientes,
  importarClientes
};

export default clientesService;