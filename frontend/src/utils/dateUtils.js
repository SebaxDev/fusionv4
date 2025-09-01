// dateUtils.js - Versión mejorada
export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const formatFecha = (fecha, formato = '%d/%m/%Y %H:%M', defaultText = 'Fecha no disponible') => {
  if (!fecha) return defaultText;
  
  try {
    const date = parseFecha(fecha);
    if (!date) return defaultText;
    
    // Implementar diferentes formatos según el parámetro
    const options = {};
    
    if (formato.includes('%d/%m/%Y %H:%M')) {
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
    } else if (formato.includes('%d/%m/%Y')) {
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
    } else if (formato.includes('%H:%M')) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('es-AR', options);
  } catch (error) {
    return defaultText;
  }
};

export const ahoraArgentina = () => {
  return new Date().toLocaleString('es-AR', { timeZone: ARGENTINA_TIMEZONE });
};

export const parseFecha = (fechaStr, dayfirst = true) => {
  if (!fechaStr || fechaStr === '' || fechaStr === 'NaT' || 
      fechaStr === 'nan' || fechaStr === 'NaN' || fechaStr === 'None') {
    return null;
  }

  // Si ya es una fecha válida
  if (fechaStr instanceof Date && !isNaN(fechaStr.getTime())) {
    return fechaStr;
  }

  // Intentar diferentes formatos (similar a la versión Python)
  const formatos = [
    { regex: /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, parts: [1, 2, 0, 3, 4, 5] }, // dd/mm/yyyy HH:MM:SS
    { regex: /(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/, parts: [1, 2, 0, 3, 4, 5] }, // dd-mm-yyyy HH:MM:SS
    { regex: /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, parts: [1, 2, 0, 3, 4] }, // dd/mm/yyyy HH:MM
    { regex: /(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/, parts: [1, 2, 0, 3, 4] }, // dd-mm-yyyy HH:MM
    { regex: /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/, parts: [2, 1, 0, 3, 4, 5] }, // yyyy-mm-dd HH:MM:SS
    { regex: /(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})/, parts: [2, 1, 0, 3, 4, 5] }, // yyyy/mm/dd HH:MM:SS
    { regex: /(\d{2})\/(\d{2})\/(\d{4})/, parts: [1, 2, 0] }, // dd/mm/yyyy
    { regex: /(\d{2})-(\d{2})-(\d{4})/, parts: [1, 2, 0] }, // dd-mm-yyyy
  ];

  const fechaString = String(fechaStr).trim();
  
  for (const formato of formatos) {
    const match = fechaString.match(formato.regex);
    if (match) {
      try {
        const parts = formato.parts.map(index => parseInt(match[index + 1], 10));
        
        if (formato.parts.length === 3) {
          // Solo fecha
          return new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (formato.parts.length >= 5) {
          // Fecha y hora
          return new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4], parts[5] || 0);
        }
      } catch (e) {
        continue;
      }
    }
  }

  // Último intento con el constructor Date nativo
  try {
    const date = new Date(fechaString);
    if (!isNaN(date.getTime())) return date;
  } catch (e) {
    // Continuar
  }

  return null;
};

export const esFechaValida = (fecha) => {
  return parseFecha(fecha) !== null;
};

export const diferenciaFechas = (fecha1, fecha2, unidad = 'horas') => {
  try {
    const dt1 = parseFecha(fecha1);
    const dt2 = parseFecha(fecha2);
    
    if (!dt1 || !dt2) return null;
    
    const diffMs = Math.abs(dt2 - dt1);
    const segundos = diffMs / 1000;
    
    const unidades = {
      'horas': segundos / 3600,
      'minutos': segundos / 60,
      'dias': segundos / 86400,
      'segundos': segundos
    };
    
    return unidades[unidad.toLowerCase()] || segundos / 3600;
  } catch (error) {
    return null;
  }
};

export const fechaParaCloud = (fecha) => {
  try {
    const dt = parseFecha(fecha);
    if (!dt) return null;
    return dt.toISOString();
  } catch (error) {
    return null;
  }
};

// Función adicional útil para el sistema de reclamos
export const esFechaReciente = (fecha, horas = 24) => {
  const fechaObj = parseFecha(fecha);
  if (!fechaObj) return false;
  
  const ahora = new Date();
  const diferenciaHoras = (ahora - fechaObj) / (1000 * 60 * 60);
  
  return diferenciaHoras <= horas;
};