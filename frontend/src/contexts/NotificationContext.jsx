// frontend/src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((type, message, duration = 5000) => {
    const newNotification = {
      id: Date.now(),
      type: type,  // 'success', 'error', 'warning', 'info'
      message: message,
      duration: duration,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove after specified duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Métodos helper para tipos específicos
  const showSuccess = useCallback((message, duration = 5000) => {
    showNotification('success', message, duration);
  }, [showNotification]);

  const showError = useCallback((message, duration = 5000) => {
    showNotification('error', message, duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration = 5000) => {
    showNotification('warning', message, duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration = 5000) => {
    showNotification('info', message, duration);
  }, [showNotification]);

  const value = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;