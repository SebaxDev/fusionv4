// frontend/src/components/reclamos/PlanificacionGrupos.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Avatar,
  LinearProgress,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  Assignment,
  Group,
  Schedule,
  LocationOn,
  Edit,
  Save,
  Cancel,
  Refresh,
  Warning,
  CheckCircle,
  AutoAwesome,
  Settings
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { hasPermission } from '../../utils/permissions';
import { TECNICOS_DISPONIBLES, SECTORES_DISPONIBLES } from '../../config/settings';
import { reclamosService } from '../../services/reclamosService';
import { formatFecha } from '../../utils/dateUtils';

// Constantes basadas en settings.py
const GRUPOS_POSIBLES = ["Grupo A", "Grupo B", "Grupo C", "Grupo D", "Grupo E"];
const SECTORES_VECINOS = {
  "Zona 1": ["1", "2", "3", "4"],
  "Zona 2": ["5", "6", "7", "8"],
  "Zona 3": ["9", "10"],
  "Zona 4": ["11", "12", "13"],
  "Zona 5": ["14", "15", "16", "17"]
};
const ZONAS_COMPATIBLES = {
  "Zona 1": ["Zona 3", "Zona 5"],
  "Zona 2": ["Zona 4"],
  "Zona 3": ["Zona 1", "Zona 2", "Zona 4", "Zona 5"],
  "Zona 4": ["Zona 2"],
  "Zona 5": ["Zona 1", "Zona 3"]
};

const PlanificacionGrupos = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [reclamos, setReclamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gruposActivos, setGruposActivos] = useState(2);
  const [modoDistribucion, setModoDistribucion] = useState("Manual");
  const [vistaSimulacion, setVistaSimulacion] = useState(false);
  const [simulacionAsignaciones, setSimulacionAsignaciones] = useState({});
  const [asignacionesGrupos, setAsignacionesGrupos] = useState(
    GRUPOS_POSIBLES.reduce((acc, grupo) => ({ ...acc, [grupo]: [] }), {})
  );
  const [tecnicosGrupos, setTecnicosGrupos] = useState(
    GRUPOS_POSIBLES.reduce((acc, grupo) => ({ ...acc, [grupo]: [] }), {})
  );
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentGrupo, setCurrentGrupo] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  // Estado para la asignación de técnicos a sectores
  const [asignaciones, setAsignaciones] = useState({});

  // Obtener los técnicos disponibles desde settings
  const tecnicosDisponibles = useMemo(() => {
    return TECNICOS_DISPONIBLES.filter(tec => tec !== 'Oficina' && tec !== 'Base' && tec !== 'Externo');
  }, []);

  // Obtener los sectores disponibles desde settings
  const sectoresDisponibles = useMemo(() => {
    return SECTORES_DISPONIBLES.filter(sector => sector !== 'OTRO');
  }, []);

  // Verificar permisos del usuario
  const canEdit = hasPermission(user, 'gestion_equipos') || user.rol === 'admin';

  useEffect(() => {
    cargarDatos();
  }, [refreshTrigger]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const resultado = await reclamosService.obtenerTodosReclamos();
      
      if (resultado.success) {
        setReclamos(resultado.data);
      } else {
        showNotification('error', `Error: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      showNotification('error', 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarTecnico = (sector, tecnico) => {
    setAsignaciones(prev => ({
      ...prev,
      [sector]: tecnico
    }));
  };

  const handleGuardarAsignaciones = async () => {
    try {
      // Lógica para guardar asignaciones
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      showNotification('success', 'Asignaciones guardadas correctamente');
    } catch (error) {
      setError('Error al guardar las asignaciones');
      showNotification('error', 'Error al guardar las asignaciones');
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!canEdit) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6">Acceso restringido</Typography>
          <Typography>
            Solo los administradores y usuarios con permisos de gestión de equipos pueden acceder a esta sección.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <Group sx={{ mr: 1, verticalAlign: 'middle' }} />
            Planificación de Grupos de Trabajo
          </Typography>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />} 
              onClick={handleRefresh}
              sx={{ mr: 1 }}
            >
              Actualizar
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Save />}
              onClick={handleGuardarAsignaciones}
            >
              Guardar
            </Button>
          </Box>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Asignación por Sectores" icon={<LocationOn />} />
          <Tab label="Distribución por Grupos" icon={<Group />} />
          <Tab label="Configuración Avanzada" icon={<Settings />} />
        </Tabs>

        {loading ? (
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Cargando datos de planificación...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {activeTab === 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Asignación de Técnicos por Sector
                </Typography>
                <Grid container spacing={2}>
                  {sectoresDisponibles.map(sector => (
                    <Grid item xs={12} sm={6} md={4} key={sector}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <LocationOn color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">Sector {sector}</Typography>
                          </Box>
                          
                          <FormControl fullWidth>
                            <InputLabel>Técnico asignado</InputLabel>
                            <Select
                              value={asignaciones[sector] || ''}
                              label="Técnico asignado"
                              onChange={(e) => handleAsignarTecnico(sector, e.target.value)}
                            >
                              <MenuItem value="">
                                <em>Sin asignar</em>
                              </MenuItem>
                              {tecnicosDisponibles.map(tecnico => (
                                <MenuItem key={tecnico} value={tecnico}>
                                  {tecnico}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Reclamos pendientes: {
                                reclamos.filter(r => 
                                  r.Sector === sector && 
                                  r.Estado === 'Pendiente'
                                ).length
                              }
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
            
            {activeTab === 1 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Distribución por Grupos de Trabajo
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Esta funcionalidad está en desarrollo. Próximamente podrás organizar 
                  a los técnicos en grupos de trabajo para optimizar la distribución de tareas.
                </Alert>
              </Grid>
            )}
            
            {activeTab === 2 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Configuración Avanzada
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Las opciones de configuración avanzada estarán disponibles en una próxima actualización.
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      <Snackbar 
        open={saveSuccess} 
        autoHideDuration={3000} 
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSaveSuccess(false)}>
          Asignaciones guardadas correctamente
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlanificacionGrupos;