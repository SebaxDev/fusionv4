// frontend/src/components/reclamos/ImpresionReclamos.jsx
import React, { useState, useEffect } from 'react';
import { formatFecha, ahoraArgentina } from '../../utils/date_utils';
import { showSuccess, showError, getStatusBadge } from '../../utils/helpers';
import { generarReporteDiarioImagen } from '../../services/reporteDiarioService';

const ImpresionReclamos = ({ reclamos, clientes, usuario }) => {
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [incluirUsuario, setIncluirUsuario] = useState(true);
  const [orden, setOrden] = useState('Tipo de reclamo');
  const [tiposSeleccionados, setTiposSeleccionados] = useState([]);
  const [reclamosSeleccionados, setReclamosSeleccionados] = useState([]);
  const [reporteDiario, setReporteDiario] = useState(null);

  // Preparar datos combinados
  const prepararDatos = () => {
    let dfMerged = [...reclamos];
    
    // Combinar con información de clientes
    dfMerged = dfMerged.map(reclamo => {
      const cliente = clientes.find(c => c['Nº Cliente'] === reclamo['Nº Cliente']);
      return {
        ...reclamo,
        'N° de Precinto': cliente ? cliente['N° de Precinto'] : 'N/A',
        Usuario_impresion: usuario?.nombre || 'Sistema'
      };
    });

    return dfMerged;
  };

  const datosCombinados = prepararDatos();

  // Estadísticas rápidas
  const estadisticas = {
    total: datosCombinados.length,
    pendientes: datosCombinados.filter(r => 
      r.Estado?.toString().trim().toLowerCase() === 'pendiente').length,
    enCurso: datosCombinados.filter(r => 
      r.Estado?.toString().trim().toLowerCase() === 'en curso').length,
    desconexiones: datosCombinados.filter(r => 
      r['Tipo de reclamo']?.toString().trim().toLowerCase() === 'desconexion a pedido' &&
      r.Estado?.toString().trim().toLowerCase() === 'desconexión').length
  };

  // Filtrar reclamos pendientes
  const reclamosPendientes = datosCombinados.filter(r => 
    r.Estado?.toString().trim().toLowerCase() === 'pendiente');

  // Generar PDF (simplificado - en una app real usarías una librería como jsPDF)
  const generarPDF = (datos, titulo) => {
    // Esta es una implementación simplificada
    // En una app real, usarías jsPDF o enviarías una solicitud al backend
    console.log('Generando PDF:', titulo, datos);
    showSuccess(`PDF generado con ${datos.length} reclamos`);
    
    // Simular descarga
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titulo.toLowerCase().replace(/ /g, '_')}_${ahoraArgentina()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generar reporte diario
  const handleGenerarReporteDiario = async () => {
    try {
      const imagenBuffer = await generarReporteDiarioImagen(reclamos);
      setReporteDiario(imagenBuffer);
      showSuccess('Reporte diario generado correctamente');
    } catch (error) {
      showError('Error al generar el reporte diario: ' + error.message);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-6">
        📨 Impresión de Reclamos
      </h2>
      <p className="text-gray-600 mb-6">
        Genera reportes en formato PDF para los técnicos de campo
      </p>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <span className="text-gray-700">📊 Total reclamos</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold ml-2">
            {estadisticas.total}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <span className="text-gray-700">⏳ Pendientes</span>
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-bold ml-2">
            {estadisticas.pendientes}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <span className="text-gray-700">🔧 En curso</span>
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-bold ml-2">
            {estadisticas.enCurso}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <span className="text-gray-700">🔌 Desconexiones</span>
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-bold ml-2">
            {estadisticas.desconexiones}
          </span>
        </div>
      </div>

      {/* Configuración */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ Configuración de impresión</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => setSoloPendientes(e.target.checked)}
              className="mr-2"
            />
            📜 Mostrar solo reclamos pendientes
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={incluirUsuario}
              onChange={(e) => setIncluirUsuario(e.target.checked)}
              className="mr-2"
            />
            👤 Incluir mi nombre en el PDF
          </label>
        </div>
      </div>

      {/* Tabs de impresión */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {['Todos', 'Por Tipo', 'Manual', 'Desconexiones', 'En Curso'].map((tab, index) => (
              <button
                key={index}
                className="py-4 px-6 text-center border-b-2 border-transparent hover:border-blue-500"
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Contenido de la pestaña Todos los Pendientes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">📋 Imprimir TODOS los reclamos pendientes</h3>
            <div className="mb-4">
              <label className="block mb-2">Ordenar reclamos por:</label>
              <div className="flex gap-4">
                <label>
                  <input
                    type="radio"
                    value="Tipo de reclamo"
                    checked={orden === 'Tipo de reclamo'}
                    onChange={(e) => setOrden(e.target.value)}
                    className="mr-2"
                  />
                  Tipo de reclamo
                </label>
                <label>
                  <input
                    type="radio"
                    value="Sector"
                    checked={orden === 'Sector'}
                    onChange={(e) => setOrden(e.target.value)}
                    className="mr-2"
                  />
                  Sector
                </label>
              </div>
            </div>

            {reclamosPendientes.length > 0 ? (
              <>
                <p className="text-green-600 mb-4">
                  📋 Se encontraron {reclamosPendientes.length} reclamos pendientes.
                </p>
                <button
                  onClick={() => generarPDF(reclamosPendientes, 'TODOS LOS RECLAMOS PENDIENTES')}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  📄 Generar PDF con TODOS los pendientes
                </button>
              </>
            ) : (
              <p className="text-blue-500">✅ No hay reclamos pendientes para imprimir.</p>
            )}
          </div>
        </div>
      </div>

      {/* Reporte Diario */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">📄 Reporte Diario (PNG)</h3>
        <p className="text-gray-600 mb-4">
          Genera una imagen resumen de los reclamos del día en formato PNG
        </p>

        <button
          onClick={handleGenerarReporteDiario}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
        >
          🖼️ Generar imagen del día
        </button>

        {reporteDiario && (
          <div>
            <img
              src={reporteDiario}
              alt="Reporte Diario"
              className="max-w-full mb-4"
            />
            <a
              href={reporteDiario}
              download={`reporte_diario_${ahoraArgentina()}.png`}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              ⬇️ Descargar Reporte Diario (PNG)
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpresionReclamos;