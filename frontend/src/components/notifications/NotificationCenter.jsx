// frontend/src/components/notifications/NotificationCenter.jsx - VERSIÓN MEJORADA
import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, List, Divider, IconButton, Badge,
  Drawer, Tooltip, Chip, Avatar, ListItem, ListItemAvatar,
  ListItemText, ListItemSecondaryAction, Button
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckAll as MarkAllReadIcon,
  Circle as UnreadIcon,
  CircleOutlined as ReadIcon,
  Assignment as AssignmentIcon,
  Update as UpdateIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  MarkEmailRead as MarkAllReadIcon
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { notificationsService } from '../../services/notificationsService';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { showSuccess, showError } = useNotification();

  const getNotificationIcon = (type) => {
    const icons = {
      'assignment': <AssignmentIcon color="primary" />,
      'status_change': <UpdateIcon color="info" />,
      'warning': <WarningIcon color="warning" />,
      'system': <InfoIcon color="action" />,
      'nuevo_reclamo': <AssignmentIcon color="success" />,
      'reclamo_asignado': <AssignmentIcon color="info" />,
      'cierre_exitoso': <CheckIcon color="success" />,
      'alerta_urgente': <WarningIcon color="error" />
    };
    return icons[type] || <InfoIcon color="action" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'alta': 'error',
      'media': 'warning',
      'baja': 'info',
      'critica': 'error'
    };
    return colors[priority] || 'default';
  };

  const formatTime = (timestamp) => {
    // Implementar lógica de formato de fecha similar a Python
    return new Date(timestamp).toLocaleString('es-ES');
  };

  const handleMarkAsRead = async () => {
    try {
      await onMarkAsRead(notification.id);
      showSuccess('Notificación marcada como leída');
    } catch (error) {
      showError('Error al marcar como leída');
    }
  };

  return (
    <ListItem
      sx={{
        bgcolor: notification.read ? 'transparent' : 'action.hover',
        borderLeft: `4px solid`,
        borderLeftColor: notification.read ? 'transparent' : 
          notification.priority === 'alta' ? 'error.main' :
          notification.priority === 'media' ? 'warning.main' : 'info.main',
        mb: 1,
        borderRadius: 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: notification.read ? 'action.hover' : 'action.selected',
          transform: 'translateX(2px)'
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'transparent' }}>
          {getNotificationIcon(notification.type)}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" component="span" fontWeight="bold">
              {notification.title}
            </Typography>
            <Chip
              label={notification.priority}
              size="small"
              color={getPriorityColor(notification.priority)}
              variant="outlined"
            />
          </Box>
        }
        secondary={
          <>
            <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(notification.timestamp)}
            </Typography>
          </>
        }
      />
      
      <ListItemSecondaryAction>
        {isHovered && !notification.read && (
          <Tooltip title="Marcar como leída">
            <IconButton
              size="small"
              onClick={handleMarkAsRead}
              color="primary"
            >
              <ReadIcon />
            </IconButton>
          </Tooltip>
        )}
        {!notification.read && !isHovered && (
          <UnreadIcon color="primary" sx={{ fontSize: 16 }} />
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useNotification();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (open && user) {
      loadNotifications();
    }
  }, [open, user]);

  const loadNotifications = async () => {
    try {
      const result = await notificationsService.getUserNotifications(user.id);
      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      showError('Error cargando notificaciones');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await notificationsService.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      throw new Error('Error al marcar como leída');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationsService.markAllAsRead();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        showSuccess('Todas las notificaciones marcadas como leídas');
      }
    } catch (error) {
      showError('Error al marcar todas como leídas');
    }
  };

  const handleClearAll = async () => {
    try {
      const result = await notificationsService.clearAll();
      if (result.success) {
        setNotifications([]);
        showSuccess('Notificaciones limpiadas');
      }
    } catch (error) {
      showError('Error al limpiar notificaciones');
    }
  };

  return (
    <>
      <Tooltip title="Centro de notificaciones">
        <IconButton color="inherit" onClick={() => setOpen(true)} sx={{ position: 'relative' }}>
          <Badge badgeContent={unreadCount} color="error" max={9}>
            <NotificationsIcon />
          </Badge>
          {unreadCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                bgcolor: 'error.main',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite'
              }}
            />
          )}
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 450,
            maxWidth: '95vw',
            bgcolor: 'background.paper'
          }
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              📋 Centro de Notificaciones
            </Typography>
            <IconButton color="inherit" onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              label={`${unreadCount} sin leer`}
              size="small"
              color="secondary"
              variant={unreadCount > 0 ? "filled" : "outlined"}
            />
            <Chip
              label={`${notifications.length} total`}
              size="small"
              variant="outlined"
              sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.3)' }}
            />
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          {notifications.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Tooltip title="Marcar todas como leídas">
                <Button
                  startIcon={<MarkAllReadIcon />}
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  size="small"
                  variant="outlined"
                >
                  Marcar todas
                </Button>
              </Tooltip>
              
              <Tooltip title="Limpiar todas">
                <Button
                  startIcon={<CloseIcon />}
                  onClick={handleClearAll}
                  color="error"
                  size="small"
                  variant="outlined"
                >
                  Limpiar
                </Button>
              </Tooltip>
            </Box>
          )}

          <List sx={{ mt: 1 }}>
            {notifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <NotificationsIcon sx={{ fontSize: 48, opacity: 0.5, mb: 1 }} />
                <Typography variant="body2">
                  No hay notificaciones
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Las nuevas notificaciones aparecerán aquí
                </Typography>
              </Box>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default NotificationCenter;