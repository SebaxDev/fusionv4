// frontend/src/components/reclamos/CierreReclamos.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Pending,
  LocationOn,
  Person,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { hasPermission } from '../../utils/permissions';
import { cierreService } from '../../services/cierreService';
import { reclamosService } from '../../services/reclamosService';

const CierreReclamos = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [reclamos, setReclamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroSector, setFiltroSector] = useState('Todos');
  const [filtroTecnico, setFiltroTecnico] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState(null);
  const [nuevoPrecinto, setNuevoPrecinto] = useState('');
  const [dialogAbierto, setDialogAbierto] = useState(false);

  // Verificar permisos
  const puedeCerrar = hasPermission(user, 'cierre_reclamos') || user.rol === 'admin';

  useEffect(() => {
    cargarReclamosEnCurso();
  }, []);

  const cargarReclamosEnCurso = async () => {
    try {
      setLoading(true);
      const resultado = await cierreService.obtenerReclamosEnCurso();
      
      if (resultado.success) {
        setReclamos(resultado.data);
      } else {
        showError('Error al cargar reclamos: ' + resultado.error);
      }
    } catch (error) {
      showError('Error al cargar reclamos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarReclamos = () => {
    let filtrados = reclamos;

    if (filtroSector !== 'Todos') {
      filtrados = filtrados.filter(r => r.sector === filtroSector);
    }

    if (filtroTecnico.length > 0) {
      filtrados = filtrados.filter(r => 
        filtroTecnico.some(t => r.tecnico.includes(t))
      );
    }

    return filtrados;
  };

  const handleReasignarTecnico = async (idReclamo, nuevoTecnico) => {
    try {
      const resultado = await cierreService.reasignarTecnico(idReclamo, nuevoTecnico);
      
      if (resultado.success) {
        showSuccess('Técnico reasignado correctamente');
        cargarReclamosEnCurso();
      } else {
        showError('Error al reasignar técnico: ' + resultado.error);
      }
    } catch (error) {
      showError('Error al reasignar técnico');
      console.error(error);
    }
  };

  const handleCerrarReclamo = async (reclamo) => {
    try {
      const resultado = await cierreService.cerrarReclamo(
        reclamo.id_reclamo,
        nuevoPrecinto
      );
      
      if (resultado.success) {
        showSuccess('Reclamo cerrado correctamente');
        setDialogAbierto(false);
        setNuevoPrecinto('');
        cargarReclamosEnCurso();
      } else {
        showError('Error al cerrar reclamo: ' + resultado.error);
      }
    } catch (error) {
      showError('Error al cerrar reclamo');
      console.error(error);
    }
  };

  const handleVolverAPendiente = async (idReclamo) => {
    try {
      const resultado = await cierreService.volverAPendiente(idReclamo);
      
      if (resultado.success) {
        showSuccess('Reclamo vuelto a pendiente');
        cargarReclamosEnCurso();
      } else {
        showError('Error al cambiar estado: ' + resultado.error);
      }
    } catch (error) {
      showError('Error al cambiar estado');
      console.error(error);
    }
  };

  if (!puedeCerrar) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <Typography variant="h6">Acceso restringido</Typography>
          <Typography>
            Solo usuarios con permisos de cierre de reclamos pueden acceder a esta sección.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const reclamosFiltrados = filtrarReclamos();

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <CheckCircle sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Cierre de Reclamos
        </Typography>

        {/* Filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sector</InputLabel>
              <Select
                value={filtroSector}
                label="Sector"
                onChange={(e) => setFiltroSector(e.target.value)}
              >
                <MenuItem value="Todos">Todos los sectores</MenuItem>
                {SECTORES_DISPONIBLES.map(sector => (
                  <MenuItem key={sector} value={sector}>
                    Sector {sector}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Técnico</InputLabel>
              <Select
                multiple
                value={filtroTecnico}
                label="Técnico"
                onChange={(e) => setFiltroTecnico(e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {TECNICOS_DISPONIBLES.map(tecnico => (
                  <MenuItem key={tecnico} value={tecnico}>
                    {tecnico}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar por número de cliente"
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
            />
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Reclamos en curso: {reclamosFiltrados.length}
            </Typography>

            {reclamosFiltrados.length === 0 ? (
              <Alert severity="info">
                No hay reclamos en curso con los filtros aplicados.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {reclamosFiltrados.map((reclamo) => (
                  <Grid item xs={12} key={reclamo.id_reclamo}>
                    <Card>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6">
                              #{reclamo.nro_cliente} - {reclamo.nombre}
                            </Typography>
                            <Typography color="textSecondary">
                              {reclamo.tipo_reclamo}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                icon={<LocationOn />}
                                label={`Sector ${reclamo.sector}`}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                icon={<Person />}
                                label={reclamo.tecnico || 'Sin asignar'}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                icon={<Schedule />}
                                label={reclamo.fecha_ingreso}
                                size="small"
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => {
                                  setReclamoSeleccionado(reclamo);
                                  setNuevoPrecinto(reclamo.precinto || '');
                                  setDialogAbierto(true);
                                }}
                              >
                                Cerrar
                              </Button>
                              <Button
                                variant="outlined"
                                color="warning"
                                startIcon={<Pending />}
                                onClick={() => handleVolverAPendiente(reclamo.id_reclamo)}
                              >
                                Volver a Pendiente
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Paper>

      {/* Dialog para cerrar reclamo */}
      <Dialog open={dialogAbierto} onClose={() => setDialogAbierto(false)}>
        <DialogTitle>Cerrar Reclamo</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Número de Precinto"
            value={nuevoPrecinto}
            onChange={(e) => setNuevoPrecinto(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAbierto(false)}>Cancelar</Button>
          <Button
            onClick={() => handleCerrarReclamo(reclamoSeleccionado)}
            variant="contained"
            color="success"
          >
            Confirmar Cierre
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CierreReclamos;