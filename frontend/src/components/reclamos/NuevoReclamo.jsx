// frontend/src/components/reclamos/NuevoReclamo.jsx
import React, { useState, useEffect } from 'react';
import { formatFecha, ahoraArgentina, parseFecha } from '../../utils/dateUtils';
import { showSuccess, showError, showWarning, showInfo, formatPhoneNumber } from '../../utils/helpers';
import { useNotification } from '../../contexts/NotificationContext';
import { crearReclamo, actualizarCliente, buscarCliente } from '../../services/reclamosService';

const NuevoReclamo = ({ reclamos, clientes, currentUser, onReclamoCreado }) => {
  const [nroCliente, setNroCliente] = useState('');
  const [clienteExistente, setClienteExistente] = useState(null);
  const [formularioBloqueado, setFormularioBloqueado] = useState(false);
  const [reclamoGuardado, setReclamoGuardado] = useState(false);
  const [clienteNuevo, setClienteNuevo] = useState(false);
  const [reclamosActivos, setReclamosActivos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { addNotification } = useNotification();

  // Configuración
  const SECTORES_DISPONIBLES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'];
  const TIPOS_RECLAMO = [
    "Sin servicio", 
    "Baja señal", 
    "Corte de fibra", 
    "Equipo dañado", 
    "Desconexion a pedido",
    "Facturación", 
    "Cambio de domicilio", 
    "Otro"
  ];

  // Efecto para buscar cliente cuando cambia el número
  useEffect(() => {
    const buscarClienteYReclamos = async () => {
      if (!nroCliente.trim()) {
        resetearEstado();
        return;
      }

      try {
        setLoading(true);
        
        // Buscar cliente
        const cliente = await buscarClienteEnLocal(nroCliente);
        
        if (cliente) {
          setClienteExistente(cliente);
          setClienteNuevo(false);
          
          // Verificar reclamos activos
          const activos = verificarReclamosActivos(nroCliente);
          setReclamosActivos(activos);
          
          if (activos.length > 0) {
            setFormularioBloqueado(true);
            addNotification({
              type: 'reclamo_repetido',
              message: `⚠️ Intento de reclamo duplicado para cliente ${nroCliente}`,
              userTarget: 'admin',
              claimId: nroCliente
            });
          }
        } else {
          setClienteNuevo(true);
          setClienteExistente(null);
          setReclamosActivos([]);
          setFormularioBloqueado(false);
        }
      } catch (error) {
        console.error('Error buscando cliente:', error);
        showError('Error al buscar cliente');
      } finally {
        setLoading(false);
      }
    };

    buscarClienteYReclamos();
  }, [nroCliente, addNotification]);

  const buscarClienteEnLocal = (nroClienteBuscado) => {
    const nroLimpio = nroClienteBuscado.trim();
    return clientes.find(cliente => 
      cliente['Nº Cliente']?.toString().trim() === nroLimpio
    );
  };

  const verificarReclamosActivos = (nroClienteBuscado) => {
    const nroLimpio = nroClienteBuscado.trim();
    const estadosActivos = ['pendiente', 'en curso'];
    
    return reclamos.filter(reclamo => 
      reclamo['Nº Cliente']?.toString().trim() === nroLimpio &&
      (estadosActivos.includes(reclamo.Estado?.toString().toLowerCase().trim()) ||
       reclamo['Tipo de reclamo']?.toString().toLowerCase().includes('desconexion a pedido'))
    );
  };

  const resetearEstado = () => {
    setClienteExistente(null);
    setFormularioBloqueado(false);
    setReclamoGuardado(false);
    setClienteNuevo(false);
    setReclamosActivos([]);
  };

  const validarSector = (sectorInput) => {
    if (!sectorInput) return { valor: null, error: '⚠️ El sector no puede estar vacío' };
    
    const sectorLimpio = sectorInput.toString().trim();
    
    try {
      const sectorNum = parseInt(sectorLimpio);
      if (sectorNum >= 1 && sectorNum <= 17) {
        return { valor: sectorNum.toString(), error: null };
      }
      return { valor: null, error: `⚠️ El sector debe estar entre 1 y 17. Se ingresó: ${sectorNum}` };
    } catch {
      if (SECTORES_DISPONIBLES.includes(sectorLimpio)) {
        return { valor: sectorLimpio, error: null };
      }
      return { valor: null, error: `⚠️ Sector no válido. Opciones: ${SECTORES_DISPONIBLES.slice(0, 5).join(', ')}...` };
    }
  };

  const generarIdUnico = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      
      // Validar sector
      const { valor: sectorValido, error: errorSector } = validarSector(formData.sector);
      if (errorSector) {
        showError(errorSector);
        return;
      }

      // Preparar datos del reclamo
      const reclamoData = {
        fechaHora: new Date().toISOString(),
        nroCliente: nroCliente.trim(),
        sector: sectorValido,
        nombre: formData.nombre.toUpperCase(),
        direccion: formData.direccion.toUpperCase(),
        telefono: formData.telefono ? formatPhoneNumber(formData.telefono) : '',
        tipoReclamo: formData.tipoReclamo,
        detalles: formData.detalles ? formData.detalles.toUpperCase() : '',
        precinto: formData.precinto || '',
        atendidoPor: formData.atendidoPor.toUpperCase(),
        estado: formData.tipoReclamo.toLowerCase().includes('desconexion a pedido') ? 'Desconexión' : 'Pendiente',
        idUnico: generarIdUnico()
      };

      // Enviar al backend
      const resultado = await crearReclamo(reclamoData);
      
      if (resultado.success) {
        setReclamoGuardado(true);
        setFormularioBloqueado(true);
        
        // Notificación
        addNotification({
          type: 'nuevo_reclamo',
          message: `📝 Nuevo reclamo ${reclamoData.idUnico} - ${formData.tipoReclamo} para cliente ${nroCliente}`,
          userTarget: 'all',
          claimId: reclamoData.idUnico
        });

        showSuccess('✅ Reclamo registrado correctamente');
        
        // Gestionar cliente
        await gestionarCliente(reclamoData);
        
        if (onReclamoCreado) {
          onReclamoCreado();
        }
      } else {
        showError(`❌ Error al guardar: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Error creando reclamo:', error);
      showError('❌ Error inesperado al crear el reclamo');
    } finally {
      setLoading(false);
    }
  };

  const gestionarCliente = async (reclamoData) => {
    try {
      const clienteExistente = buscarClienteEnLocal(reclamoData.nroCliente);
      
      if (!clienteExistente) {
        // Crear nuevo cliente
        const clienteData = {
          nroCliente: reclamoData.nroCliente,
          sector: reclamoData.sector,
          nombre: reclamoData.nombre,
          direccion: reclamoData.direccion,
          telefono: reclamoData.telefono,
          precinto: reclamoData.precinto,
          fechaCreacion: new Date().toISOString()
        };
        
        await actualizarCliente(clienteData);
        showInfo('ℹ️ Nuevo cliente registrado automáticamente');
        
        addNotification({
          type: 'cliente_nuevo',
          message: `🆕 Cliente N° ${reclamoData.nroCliente} - ${reclamoData.nombre} creado desde reclamo`,
          userTarget: 'admin',
          action: `clientes:${reclamoData.nroCliente}`
        });
      } else {
        // Verificar si necesita actualización
        const necesitaActualizacion = 
          clienteExistente.Sector !== reclamoData.sector ||
          clienteExistente.Nombre !== reclamoData.nombre ||
          clienteExistente.Dirección !== reclamoData.direccion ||
          clienteExistente.Teléfono !== reclamoData.telefono ||
          clienteExistente['N° de Precinto'] !== reclamoData.precinto;
        
        if (necesitaActualizacion) {
          const clienteData = {
            ...clienteExistente,
            sector: reclamoData.sector,
            nombre: reclamoData.nombre,
            direccion: reclamoData.direccion,
            telefono: reclamoData.telefono,
            precinto: reclamoData.precinto
          };
          
          await actualizarCliente(clienteData);
          showInfo('🔁 Datos del cliente actualizados automáticamente');
        }
      }
    } catch (error) {
      console.error('Error gestionando cliente:', error);
      // No mostrar error al usuario para no interrumpir el flujo
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="text-3xl bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
          📝
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Cargar Nuevo Reclamo</h2>
      </div>

      {/* Input número de cliente */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🔢 N° de Cliente *
        </label>
        <input
          type="text"
          value={nroCliente}
          onChange={(e) => setNroCliente(e.target.value)}
          placeholder="Ingresa el número de cliente"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={formularioBloqueado || reclamoGuardado}
        />
        <p className="text-sm text-gray-500 mt-1">Número único del cliente (obligatorio)</p>
      </div>

      {/* Mensajes de estado */}
      {clienteExistente && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-xl">✅</span>
            <span className="text-green-800">Cliente reconocido, datos auto-cargados</span>
          </div>
        </div>
      )}

      {clienteNuevo && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <span className="text-blue-800">Este cliente no existe en la base y se cargará como cliente nuevo</span>
          </div>
        </div>
      )}

      {/* Reclamos activos */}
      {reclamosActivos.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <span className="text-red-800 font-semibold">Este cliente ya tiene reclamos activos</span>
          </div>
          
          {reclamosActivos.map((reclamo, index) => (
            <div key={index} className="bg-white rounded-lg p-3 mb-2 border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <strong className="text-gray-700">
                    📅 {formatFecha(reclamo['Fecha y hora'], 'dd/MM/yyyy HH:mm') || 'Fecha no disponible'}
                  </strong>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-sm font-semibold">
                  {reclamo.Estado || 'Sin estado'}
                </span>
              </div>
              <div className="text-gray-600 mb-1">
                <strong>📌 Tipo:</strong> {reclamo['Tipo de reclamo'] || 'N/A'}
              </div>
              <div className="text-gray-600">
                <strong>📝 Detalles:</strong> {reclamo.Detalles ? `${reclamo.Detalles.substring(0, 150)}...` : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario */}
      {!formularioBloqueado && nroCliente && (
        <FormularioReclamo
          clienteExistente={clienteExistente}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          tiposReclamo={TIPOS_RECLAMO}
          onCancel={() => setNroCliente('')}
        />
      )}

      {/* Mensaje de éxito */}
      {reclamoGuardado && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-xl">✅</span>
            <span className="text-green-800 font-semibold">Reclamo registrado correctamente</span>
          </div>
          <button
            onClick={() => {
              setNroCliente('');
              setReclamoGuardado(false);
              setFormularioBloqueado(false);
            }}
            className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            📝 Crear Otro Reclamo
          </button>
        </div>
      )}
    </div>
  );
};

// Componente de formulario separado
const FormularioReclamo = ({ clienteExistente, currentUser, onSubmit, tiposReclamo, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: clienteExistente?.Nombre || '',
    direccion: clienteExistente?.Dirección || '',
    telefono: clienteExistente?.Teléfono || '',
    sector: clienteExistente?.Sector || '1',
    tipoReclamo: tiposReclamo[0],
    detalles: '',
    precinto: clienteExistente?.['N° de Precinto'] || '',
    atendidoPor: currentUser?.nombre || ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    const camposObligatorios = {
      'Nombre': formData.nombre.trim(),
      'Dirección': formData.direccion.trim(),
      'Sector': formData.sector.toString().trim(),
      'Tipo de reclamo': formData.tipoReclamo.trim(),
      'Atendido por': formData.atendidoPor.trim()
    };

    const camposVacios = Object.entries(camposObligatorios)
      .filter(([_, value]) => !value)
      .map(([campo]) => campo);

    if (camposVacios.length > 0) {
      showError(`❌ Campos obligatorios vacíos: ${camposVacios.join(', ')}`);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Datos del Reclamo</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Columna 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👤 Nombre del Cliente *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="JUAN PÉREZ"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📍 Dirección *
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              placeholder="CALLE PRINCIPAL 123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Columna 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📞 Teléfono
            </label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              placeholder="011-1234-5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔢 Sector (1-17) *
            </label>
            <select
              value={formData.sector}
              onChange={(e) => handleChange('sector', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 17 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num.toString()}>
                  Sector {num}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Campos adicionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📌 Tipo de Reclamo *
          </label>
          <select
            value={formData.tipoReclamo}
            onChange={(e) => handleChange('tipoReclamo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {tiposReclamo.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📝 Detalles del Reclamo
          </label>
          <textarea
            value={formData.detalles}
            onChange={(e) => handleChange('detalles', e.target.value)}
            placeholder="Describe el problema, síntomas, horarios, etc..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔒 N° de Precinto
            </label>
            <input
              type="text"
              value={formData.precinto}
              onChange={(e) => handleChange('precinto', e.target.value)}
              placeholder="Número de precinto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👤 Atendido por *
            </label>
            <input
              type="text"
              value={formData.atendidoPor}
              onChange={(e) => handleChange('atendidoPor', e.target.value)}
              placeholder="Nombre de quien atiende"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
          >
            ✅ Guardar Reclamo
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoReclamo;