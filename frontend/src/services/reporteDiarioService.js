// frontend/src/services/reporteDiarioService.js
export const generarReporteDiarioImagen = async (reclamos) => {
  try {
    // En una implementación real, esto se haría en el backend
    // ya que generar imágenes en el frontend es complejo
    const response = await fetch('/api/reportes/diario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reclamos }),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar reporte');
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generando reporte diario:', error);
    throw error;
  }
};