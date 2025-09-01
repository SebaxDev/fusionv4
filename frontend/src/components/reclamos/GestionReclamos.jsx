import { useState, useEffect } from 'react';
import { reclamosService } from '../../services/reclamosService';
import { clientesService } from '../../services/clientesService';
import { useNotification } from '../../contexts/NotificationContext';
import { formatFecha, parseFecha } from '../../utils/dateUtils';
import { Badge, showSuccess, showError, showWarning, showInfo } from '../../utils/helpers';

const GestionReclamos = () => {
  const [reclamos, setReclamos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: 'Todos',
    sector: 'Todos',
    tipo: 'Todos',
    busqueda: ''
  });
  
  const [reclamoEditando, setReclamoEditando] = useState(null);
  const [formData, setFormData] = useState({});
  const [mostrarFormEdicion, setMostrarFormEdicion] = useState(false);
  const [soloCambiarEstado, setSoloCambiarEstado] = useState(false);
  
  const { showNotification } = useNotification();

  // Datos para filtros (deberían venir de configuraciones)
  const sectoresDisponibles = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const tiposReclamo = ['Desconexión a pedido', 'Falta de suministro', 'Medidor defectuoso', 'Facturación', 'Otros'];
  const estados = ['Pendiente', 'En curso', 'Resuelto'];

  useEffect(() => {
    cargarDatos();
  }, []);

const cargarDatos = async () => {
  try {
    setLoading(true);
    
    // Cargar reclamos y clientes en paralelo para mejor rendimiento
    const [resultadoReclamos, resultadoClientes] = await Promise.all([
      reclamosService.obtenerTodosReclamos(),
      clientesService.obtenerTodosClientes()
    ]);
    
    if (resultadoReclamos.success) {
      // Procesar fechas y preparar datos de reclamos
      const reclamosProcesados = resultadoReclamos.data.map(reclamo => ({
        ...reclamo,
        fechaFormateada: formatFecha(parseFecha(reclamo['Fecha y hora'])),
        selector: `${reclamo['Nº Cliente']} - ${reclamo.Nombre} - ${reclamo['Tipo de reclamo']} (${reclamo.Estado})`
      }));
      
      setReclamos(reclamosProcesados);
    } else {
      showNotification('error', `Error cargando reclamos: ${resultadoReclamos.error}`);
    }
    
    if (resultadoClientes.success) {
      setClientes(resultadoClientes.data);
    } else {
      showNotification('error', `Error cargando clientes: ${resultadoClientes.error}`);
    }
    
  } catch (error) {
    console.error('Error cargando datos:', error);
    showNotification('error', 'Error al cargar los datos');
  } finally {
    setLoading(false);
  }
};

  const cargarReclamos = async () => {
    try {
      const resultado = await reclamosService.obtenerTodos();
      
      if (resultado.success) {
        // Procesar fechas y preparar datos
        const reclamosProcesados = resultado.data.map(reclamo => ({
          ...reclamo,
          fechaFormateada: formatFecha(parseFecha(reclamo['Fecha y hora'])),
          selector: `${reclamo['Nº Cliente']} - ${reclamo.Nombre} - ${reclamo['Tipo de reclamo']} (${reclamo.Estado})`
        }));
        
        setReclamos(reclamosProcesados);
      } else {
        showNotification('error', `Error: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Error cargando reclamos:', error);
      showNotification('error', 'Error al cargar los reclamos');
    }
  };

  const cargarClientes = async () => {
    try {
      const resultado = await clientesService.obtenerTodos();
      
      if (resultado.success) {
        setClientes(resultado.data);
      } else {
        showNotification('error', `Error al cargar clientes: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSeleccionarReclamo = (reclamo) => {
    setReclamoEditando(reclamo);
    setFormData({
      direccion: reclamo.Dirección || '',
      telefono: reclamo.Teléfono || '',
      tipoReclamo: reclamo['Tipo de reclamo'] || '',
      detalles: reclamo.Detalles || '',
      precinto: reclamo['N° de Precinto'] || '',
      sector: reclamo.Sector || '',
      estado: reclamo.Estado || 'Pendiente'
    });
    setMostrarFormEdicion(true);
    setSoloCambiarEstado(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuardarCambios = async (soloEstado = false) => {
  try {
    if (!soloEstado && (!formData.direccion || !formData.detalles)) {
      showWarning('Dirección y detalles son campos obligatorios');
      return;
    }

    const updates = soloEstado ? 
      { estado: formData.estado } : 
      { 
        direccion: formData.direccion,
        telefono: formData.telefono,
        tipoReclamo: formData.tipoReclamo,
        detalles: formData.detalles,
        precinto: formData.precinto,
        sector: formData.sector,
        estado: formData.estado
      };

    // ✅ Usar el servicio de reclamos para actualizar
    const resultado = await reclamosService.actualizarReclamo(
      reclamoEditando['ID Único'], // ✅ Usar ID Único en lugar de ID Reclamo
      updates
    );
    
    if (resultado.success) {
      showSuccess(soloEstado ? 'Estado actualizado correctamente' : 'Reclamo actualizado correctamente');
      
      // Notificación de cambio de estado
      if (formData.estado !== reclamoEditando.Estado) {
        showNotification('info', 
          `El reclamo ${reclamoEditando['ID Único']} cambió de estado: 
          ${reclamoEditando.Estado} → ${formData.estado}`
        );
      }
      
      setMostrarFormEdicion(false);
      setReclamoEditando(null);
      cargarDatos(); // ✅ Recargar todos los datos
    } else {
      showNotification('error', `Error: ${resultado.error}`);
    }
  } catch (error) {
    showNotification('error', 'Error al actualizar reclamo');
  }
  };

  const handleMarcarDesconexionResuelta = async (reclamo) => {
  try {
    // ✅ Usar el servicio de reclamos para cambiar estado
    const resultado = await reclamosService.actualizarReclamo(
      reclamo['ID Único'], // ✅ Usar ID Único
      { estado: 'Resuelto' }
    );
    
    if (resultado.success) {
      showSuccess(`Desconexión de ${reclamo.Nombre} marcada como resuelta`);
      
      // Notificación
      showNotification('success', 
        `Desconexión resuelta: ${reclamo['Nº Cliente']} - ${reclamo.Nombre}`
      );
      
      cargarDatos(); // ✅ Recargar todos los datos
    } else {
      showNotification('error', `Error: ${resultado.error}`);
    }
  } catch (error) {
    showNotification('error', 'Error al marcar desconexión como resuelta');
  }
  };

  const aplicarFiltros = () => {
  let filtrados = reclamos;

  if (filtros.estado !== 'Todos') {
    filtrados = filtrados.filter(reclamo => reclamo.Estado === filtros.estado);
  }
  
  if (filtros.sector !== 'Todos') {
    filtrados = filtrados.filter(reclamo => reclamo.Sector === filtros.sector);
  }
  
  if (filtros.tipo !== 'Todos') {
    filtrados = filtrados.filter(reclamo => reclamo['Tipo de reclamo'] === filtros.tipo);
  }
  
  if (filtros.busqueda) {
    const busquedaLower = filtros.busqueda.toLowerCase();
    filtrados = filtrados.filter(reclamo => 
      reclamo['Nº Cliente'].toLowerCase().includes(busquedaLower) ||
      reclamo.Nombre.toLowerCase().includes(busquedaLower) ||
      reclamo['Tipo de reclamo'].toLowerCase().includes(busquedaLower)
    );
  }

  return filtrados;
  };

  const reclamosFiltrados = aplicarFiltros();
  const reclamosActivos = reclamos.filter(r => ['Pendiente', 'En curso'].includes(r.Estado));
  const desconexionesPendientes = reclamos.filter(r => 
    r['Tipo de reclamo'] === 'Desconexión a pedido' && 
    r.Estado === 'Desconexión'
  );

  // Estadísticas
  const stats = {
    totalActivos: reclamosActivos.length,
    clientesUnicos: new Set(reclamosActivos.map(r => r['Nº Cliente'])).size,
    clientesMultiples: reclamosActivos.length - new Set(reclamosActivos.map(r => r['Nº Cliente'])).size
  };

  // Distribución por tipo
  const distribucionPorTipo = reclamosActivos.reduce((acc, reclamo) => {
    const tipo = reclamo['Tipo de reclamo'];
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando reclamos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="text-3xl">📊</div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Reclamos</h1>
        </div>

        {/* Estadísticas */}
        {reclamosActivos.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">📊 Estadísticas de Reclamos Activos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center transition-all hover:shadow-md hover:border-blue-500">
                <div className="text-3xl font-bold text-blue-600">{stats.totalActivos}</div>
                <div className="text-sm font-semibold text-gray-600">Total Activos</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center transition-all hover:shadow-md hover:border-green-500">
                <div className="text-3xl font-bold text-green-600">{stats.clientesUnicos}</div>
                <div className="text-sm font-semibold text-gray-600">Clientes Únicos</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center transition-all hover:shadow-md hover:border-orange-500">
                <div className="text-3xl font-bold text-orange-600">{stats.clientesMultiples}</div>
                <div className="text-sm font-semibold text-gray-600">Clientes Múltiples</div>
              </div>
            </div>

            {/* Distribución por tipo */}
            <h2 className="text-xl font-semibold text-gray-700 mb-4">📋 Distribución por Tipo de Reclamo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Object.entries(distribucionPorTipo).map(([tipo, cantidad]) => (
                <div key={tipo} className="bg-white border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md hover:border-blue-500">
                  <div className="text-sm font-semibold text-gray-600 mb-2">{tipo}</div>
                  <div className="text-2xl font-bold text-blue-600">{cantidad}</div>
                  <div className="mt-2">
                    <Badge 
                      type={cantidad > 10 ? 'warning' : 'success'} 
                      text={cantidad > 10 ? 'Alerta' : 'Normal'} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Filtros */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">🔍 Filtros de Búsqueda</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
              >
                <option value="Todos">Todos</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filtros.sector}
                onChange={(e) => handleFiltroChange('sector', e.target.value)}
              >
                <option value="Todos">Todos</option>
                {sectoresDisponibles.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              >
                <option value="Todos">Todos</option>
                {tiposReclamo.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar por cliente, nombre..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
              />
            </div>
          </div>
          
          <p className="text-gray-600">
            📈 Mostrando {reclamosFiltrados.length} de {reclamos.length} reclamos
          </p>
        </div>

        {/* Tabla de reclamos */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reclamosFiltrados.map((reclamo) => (
                <tr key={reclamo['ID Reclamo']} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">{reclamo.fechaFormateada}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{reclamo['Nº Cliente']}</td>
                  <td className="px-4 py-3">{reclamo.Nombre}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{reclamo.Sector}</td>
                  <td className="px-4 py-3">{reclamo['Tipo de reclamo']}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{reclamo.Teléfono}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge 
                      type={
                        reclamo.Estado === 'Pendiente' ? 'warning' : 
                        reclamo.Estado === 'En curso' ? 'info' : 'success'
                      } 
                      text={reclamo.Estado} 
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleSeleccionarReclamo(reclamo)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm mr-2"
                    >
                      Editar
                    </button>
                    <select
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                      value={reclamo.Estado}
                      onChange={(e) => {
                        setReclamoEditando(reclamo);
                        setFormData({...formData, estado: e.target.value});
                        setSoloCambiarEstado(true);
                        handleGuardarCambios(true);
                      }}
                    >
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {reclamosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-b-lg">
              No se encontraron reclamos con los filtros aplicados
            </div>
          )}
        </div>
      </div>

      {/* Gestión de Desconexiones */}
      {desconexionesPendientes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">🔌 Gestión de Desconexiones a Pedido</h2>
          <div className="mb-4">
            <Badge type="info" text={`${desconexionesPendientes.length} desconexiones pendientes`} />
          </div>
          
          <div className="space-y-4">
            {desconexionesPendientes.map((reclamo) => (
              <div key={reclamo['ID Reclamo']} className="bg-gray-50 rounded-lg p-4 border border-gray-200 transition-all hover:border-blue-300">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{reclamo['Nº Cliente']} - {reclamo.Nombre}</div>
                    <div className="text-sm text-gray-600">
                      📅 {reclamo.fechaFormateada} - Sector {reclamo.Sector}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarcarDesconexionResuelta(reclamo)}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                  >
                    ✅ Marcar como Resuelto
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {mostrarFormEdicion && reclamoEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">✏️ Edición de Reclamo</h2>
                <button
                  onClick={() => setMostrarFormEdicion(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Información del reclamo */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-3">📄 Información del Reclamo Seleccionado</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-blue-700">📅 Fecha</div>
                    <div>{reclamoEditando.fechaFormateada}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-700">👤 Cliente</div>
                    <div>{reclamoEditando.Nombre}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-700">📍 Sector</div>
                    <div>{reclamoEditando.Sector}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-700">📌 Tipo</div>
                    <div>{reclamoEditando['Tipo de reclamo']}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-700">⚙️ Estado Actual</div>
                    <div>
                      <Badge 
                        type={
                          reclamoEditando.Estado === 'Pendiente' ? 'warning' : 
                          reclamoEditando.Estado === 'En curso' ? 'info' : 'success'
                        } 
                        text={reclamoEditando.Estado} 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-700">👷 Técnico</div>
                    <div>{reclamoEditando.Técnico || 'No asignado'}</div>
                  </div>
                </div>
              </div>

              {/* Formulario de edición */}
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📍 Dirección *
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!soloCambiarEstado}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📞 Teléfono
                    </label>
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📌 Tipo de reclamo *
                    </label>
                    <select
                      name="tipoReclamo"
                      value={formData.tipoReclamo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!soloCambiarEstado}
                    >
                      {tiposReclamo.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔢 Sector *
                    </label>
                    <select
                      name="sector"
                      value={formData.sector}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!soloCambiarEstado}
                    >
                      {sectoresDisponibles.map(sector => (
                        <option key={sector} value={sector}>{sector}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Detalles *
                  </label>
                  <textarea
                    name="detalles"
                    value={formData.detalles}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!soloCambiarEstado}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔒 N° de Precinto
                    </label>
                    <input
                      type="text"
                      name="precinto"
                      value={formData.precinto}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔄 Nuevo estado
                    </label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => handleGuardarCambios(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    💾 Guardar Todos los Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGuardarCambios(true)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    🔄 Cambiar Solo Estado
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormEdicion(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionReclamos;