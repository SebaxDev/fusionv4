// frontend/src/utils/permissions.js
import { PERMISOS_POR_ROL } from '../config/settings';

export const hasPermission = (user, permisoRequerido) => {
  if (!user || !user.rol) return false;
  
  // Los administradores tienen todos los permisos
  if (user.rol === 'admin') return true;
  
  const permisos = PERMISOS_POR_ROL[user.rol]?.permisos || [];
  
  // Si tiene permiso de wildcard o el permiso específico
  return permisos.includes('*') || permisos.includes(permisoRequerido);
};

export const getRoleConfig = (rol) => {
  return PERMISOS_POR_ROL[rol] || {
    descripcion: 'Rol no definido',
    permisos: [],
    color: '#64748B',
    icon: '❓'
  };
};

export const canAccess = (user, permisoRequerido) => {
  return hasPermission(user, permisoRequerido);
};