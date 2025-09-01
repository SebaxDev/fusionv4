// helpers.js - Versión mejorada para React
export const showNotification = (message, type = 'info') => {
  // En React, usarías un sistema de notificaciones como react-toastify
  // Esta es una implementación básica para consola
  const icons = {
    warning: '⚠️',
    error: '❌',
    success: '✅',
    info: 'ℹ️'
  };
  
  console.log(`${icons[type] || ''} ${message}`);
};

export const formatPhoneNumber = (phone) => {
  if (!phone || phone === '') return '';
  
  const phoneStr = String(phone).replace(/\D/g, '');
  
  if (phoneStr.startsWith('54')) {
    return `+${phoneStr}`;
  }
  
  if (phoneStr.length === 10) {
    return `+54 ${phoneStr.substring(0, 3)} ${phoneStr.substring(3, 7)} ${phoneStr.substring(7)}`;
  }
  
  return phoneStr;
};

export const formatDni = (dni) => {
  if (!dni || dni === '') return '';
  
  const dniStr = String(dni).replace(/\D/g, '');
  
  if (dniStr.length <= 3) return dniStr;
  
  // Formato: XX.XXX.XXX
  return dniStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const getStatusBadge = (status) => {
  const statusColors = {
    'Pendiente': 'warning',
    'En Proceso': 'info', 
    'Resuelto': 'success',
    'Cerrado': 'success',
    'Cancelado': 'danger',
    'Derivado': 'primary',
    'Asignado': 'info',
    'En Curso': 'info',
    'Completado': 'success',
    'Desconexión': 'secondary'
  };
  
  return {
    text: status || 'Desconocido',
    color: statusColors[status] || 'secondary'
  };
};

export const safeFloatConversion = (value, defaultValue = 0.0) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

export const safeIntConversion = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  const textStr = String(text);
  return textStr.length > maxLength 
    ? textStr.substring(0, maxLength) + '...' 
    : textStr;
};

export const isCloudEnvironment = () => {
  // Detectar si está en un entorno cloud como Render
  return typeof process !== 'undefined' && 
         (process.env.REACT_APP_IS_RENDER || 
          process.env.NODE_ENV === 'production');
};

// Función para generar IDs únicos (útil para keys en React)
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Función para capitalizar texto
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const Badge = ({ type, text }) => {
  const typeClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    primary: 'bg-purple-100 text-purple-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeClasses[type] || typeClasses.primary}`}>
      {text}
    </span>
  );
};

// Funciones de notificación (simuladas - deben integrarse con tu sistema de notificaciones)
export const showSuccess = (message) => {
  console.log('SUCCESS:', message);
  // Aquí integrar con tu sistema de notificaciones
};

export const showError = (message) => {
  console.log('ERROR:', message);
  // Aquí integrar con tu sistema de notificaciones
};

export const showWarning = (message) => {
  console.log('WARNING:', message);
  // Aquí integrar con tu sistema de notificaciones
};

export const showInfo = (message) => {
  console.log('INFO:', message);
  // Aquí integrar con tu sistema de notificaciones
};