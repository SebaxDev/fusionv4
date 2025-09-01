// frontend/src/services/reclamosService.js
import api from './api';

// Métricos del dashboard
export const obtenerMetricasDashboard = async (rangoTiempo = 'week') => {
  try {
    const response = await api.get('/reclamos/metricas-dashboard', {
      params: { rango_tiempo: rangoTiempo }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo métricas del dashboard:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener métricas del dashboard' 
    };
  }
};

// Estadísticas avanzadas
export const obtenerEstadisticasAvanzadas = async (filtros = {}) => {
  try {
    const response = await api.get('/reclamos/estadisticas-avanzadas', {
      params: filtros
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo estadísticas avanzadas:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener estadísticas avanzadas' 
    };
  }
};

// Tendencias temporales
export const obtenerTendenciasTemporales = async (periodo = 'month') => {
  try {
    const response = await api.get('/reclamos/tendencias-temporales', {
      params: { periodo }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo tendencias temporales:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener tendencias temporales' 
    };
  }
};

// KPI principales
export const obtenerKPIs = async () => {
  try {
    const response = await api.get('/reclamos/kpis');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo KPIs:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener KPIs' 
    };
  }
};

// RECLAMOS
export const obtenerReclamos = async (filtros = {}) => {
  try {
    const response = await api.get('/reclamos', { params: filtros });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo reclamos:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener reclamos' 
    };
  }
};

export const obtenerTodosReclamos = async () => {
  try {
    const response = await api.get('/reclamos');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo todos los reclamos:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener todos los reclamos' 
    };
  }
};

export const obtenerReclamoPorId = async (id) => {
  try {
    const response = await api.get(`/reclamos/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo reclamo:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener reclamo' 
    };
  }
};

export const crearReclamo = async (reclamoData) => {
  try {
    const response = await api.post('/reclamos', reclamoData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error creando reclamo:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al crear reclamo' 
    };
  }
};

export const actualizarReclamo = async (id, reclamoData) => {
  try {
    const response = await api.put(`/reclamos/${id}`, reclamoData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error actualizando reclamo:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al actualizar reclamo' 
    };
  }
};

export const eliminarReclamo = async (id) => {
  try {
    const response = await api.delete(`/reclamos/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error eliminando reclamo:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al eliminar reclamo' 
    };
  }
};

export const obtenerReclamosActivos = async (nroCliente = null) => {
  try {
    const url = nroCliente 
      ? `/reclamos/activos/${nroCliente}`
      : '/reclamos/activos';
    const response = await api.get(url);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo reclamos activos:', error);
    return { success: false, data: [], error: error.response?.data?.detail };
  }
};

export const cambiarEstadoReclamo = async (id, nuevoEstado) => {
  try {
    const response = await api.patch(`/reclamos/${id}/estado`, { 
      estado: nuevoEstado 
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error cambiando estado:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al cambiar estado' 
    };
  }
};

export const obtenerReclamosPorEstado = async (estado) => {
  try {
    const response = await api.get(`/reclamos?estado=${estado}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo reclamos por estado:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener reclamos por estado' 
    };
  }
};

export const obtenerReclamosPorTipo = async (tipo) => {
  try {
    const response = await api.get(`/reclamos?tipo=${tipo}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo reclamos por tipo:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener reclamos por tipo' 
    };
  }
};

export const obtenerReclamosPorSector = async (sector) => {
  try {
    const response = await api.get(`/reclamos?sector=${sector}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo reclamos por sector:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener reclamos por sector' 
    };
  }
};

// CLIENTES
export const obtenerClientes = async () => {
  try {
    const response = await api.get('/clientes');
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

export const buscarCliente = async (nroCliente) => {
  try {
    const response = await api.get(`/clientes/${nroCliente}`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'Cliente no encontrado' };
    }
    console.error('Error buscando cliente:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al buscar cliente' 
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

// TÉCNICOS
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

export const asignarTecnico = async (reclamoId, tecnicoId) => {
  try {
    const response = await api.patch(`/reclamos/${reclamoId}/asignar-tecnico`, {
      tecnico_id: tecnicoId
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error asignando técnico:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al asignar técnico' 
    };
  }
};

// ESTADÍSTICAS
export const obtenerEstadisticas = async () => {
  try {
    const response = await api.get('/reclamos/estadisticas');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener estadísticas' 
    };
  }
};

export const obtenerEstadisticasPorFecha = async (fechaInicio, fechaFin) => {
  try {
    const response = await api.get('/reclamos/estadisticas/por-fecha', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo estadísticas por fecha:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener estadísticas por fecha' 
    };
  }
};

export const obtenerEstadisticasPorSector = async () => {
  try {
    const response = await api.get('/reclamos/estadisticas/por-sector');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo estadísticas por sector:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener estadísticas por sector' 
    };
  }
};

export const obtenerEstadisticasPorTipo = async () => {
  try {
    const response = await api.get('/reclamos/estadisticas/por-tipo');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo estadísticas por tipo:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al obtener estadísticas por tipo' 
    };
  }
};

// BUSQUEDAS
export const buscarReclamos = async (termino) => {
  try {
    const response = await api.get('/reclamos/buscar', { 
      params: { q: termino } 
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error buscando reclamos:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al buscar reclamos' 
    };
  }
};

export const buscarReclamosAvanzado = async (criterios) => {
  try {
    const response = await api.get('/reclamos/buscar-avanzado', { 
      params: criterios 
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error en búsqueda avanzada de reclamos:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error en búsqueda avanzada de reclamos' 
    };
  }
};

// REPORTES
export const generarReporteDiario = async (fecha) => {
  try {
    const response = await api.get('/reportes/diario', {
      params: { fecha }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error generando reporte diario:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al generar reporte diario' 
    };
  }
};

export const generarReporteMensual = async (mes, año) => {
  try {
    const response = await api.get('/reportes/mensual', {
      params: { mes, año }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error generando reporte mensual:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al generar reporte mensual' 
    };
  }
};

// IMPORTACIÓN/EXPORTACIÓN
export const exportarReclamos = async (filtros = {}) => {
  try {
    const response = await api.get('/reclamos/exportar', {
      params: filtros,
      responseType: 'blob'
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error exportando reclamos:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al exportar reclamos' 
    };
  }
};

export const importarReclamos = async (formData) => {
  try {
    const response = await api.post('/reclamos/importar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error importando reclamos:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Error al importar reclamos' 
    };
  }
};

// Servicio principal para compatibilidad
const reclamosService = {
  // Reclamos
  obtenerReclamos,
  obtenerTodosReclamos,
  obtenerReclamoPorId,
  crearReclamo,
  actualizarReclamo,
  eliminarReclamo,
  obtenerReclamosActivos,
  cambiarEstadoReclamo,
  obtenerReclamosPorEstado,
  obtenerReclamosPorTipo,
  obtenerReclamosPorSector,
  
  // Clientes
  obtenerClientes,
  obtenerTodosClientes,
  buscarCliente,
  crearCliente,
  actualizarCliente,
  
  // Técnicos
  obtenerTecnicos,
  obtenerTecnicosActivos,
  asignarTecnico,
  
  // Estadísticas
  obtenerEstadisticas,
  obtenerEstadisticasPorFecha,
  obtenerEstadisticasPorSector,
  obtenerEstadisticasPorTipo,
  
  // Búsquedas
  buscarReclamos,
  buscarReclamosAvanzado,
  
  // Reportes
  generarReporteDiario,
  generarReporteMensual,
  
  // Importación/Exportación
  exportarReclamos,
  importarReclamos
};

export default reclamosService;