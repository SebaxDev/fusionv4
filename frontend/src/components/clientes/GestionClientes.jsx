// frontend/src/components/clientes/GestionClientes.jsx
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
  DialogActions,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Person,
  LocationOn,
  Phone,
  Security,
  Business,
  Edit,
  Add,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { hasPermission } from '../../utils/permissions';
import { clientesService } from '../../services/clientesService';
import { reclamosService } from '../../services/reclamosService';

const GestionClientes = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const [clientes, setClientes] = useState([]);
  const [reclamos, setReclamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [clienteEditando, setClienteEditando] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState(false);
  const [formData, setFormData] = useState({
    nro_cliente: '',
    sector: '',
    nombre: '',
    direccion: '',
    telefono: '',
    precinto: ''
  });
  const [reclamosExpandidos, setReclamosExpandidos] = useState({});

  const puedeGestionar = hasPermission(user, 'gestion_clientes') || user.rol === 'admin';

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [clientesResult, reclamosResult] = await Promise.all([
        clientesService.obtenerTodosClientes(),
        reclamosService.obtenerTodosReclamos()
      ]);

      if (clientesResult.success) {
        setClientes(clientesResult.data);
      } else {
        showError('Error al cargar clientes: ' + clientesResult.error);
      }

      if (reclamosResult.success) {
        setReclamos(reclamosResult.data);
      }
    } catch (error) {
      showError('Error al cargar datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarCliente = (nroCliente) => {
    setClienteSeleccionado(nroCliente);
    const cliente = clientes.find(c => c['Nº Cliente'] === nroCliente);
    setClienteEditando(cliente);
    setFormData({
      nro_cliente: cliente['Nº Cliente'] || '',
      sector: cliente['Sector'] || '',
      nombre: cliente['Nombre'] || '',
      direccion: cliente['Dirección'] || '',
      telefono: cliente['Teléfono'] || '',
      precinto: cliente['N° de Precinto'] || ''
    });
  };

  const handleNuevoCliente = () => {
    setNuevoCliente(true);
    setClienteEditando(null);
    setFormData({
      nro_cliente: '',
      sector: '',
      nombre: '',
      direccion: '',
      telefono: '',
      precinto: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validarFormulario = () => {
    if (!formData.nro_cliente.trim()) {
      showError('El número de cliente es obligatorio');
      return false;
    }
    if (!formData.nombre.trim()) {
      showError('El nombre del cliente es obligatorio');
      return false;
    }
    if (!formData.direccion.trim()) {
      showError('La dirección del cliente es obligatoria');
      return false;
    }
    if (!formData.sector) {
      showError('El sector del cliente es obligatorio');
      return false;
    }
    return true;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      let resultado;
      if (nuevoCliente) {
        resultado = await clientesService.crearCliente(formData);
      } else {
        resultado = await clientesService.actualizarCliente(formData.nro_cliente, formData);
      }

      if (resultado.success) {
        showSuccess(resultado.message);
        setNuevoCliente(false);
        setClienteEditando(null);
        cargarDatos();
      } else {
        showError('Error al guardar: ' + resultado.error);
      }
    } catch (error) {
      showError('Error al guardar cliente');
      console.error(error);
    }
  };

  const toggleReclamos = (nroCliente) => {
    setReclamosExpandidos(prev => ({
      ...prev,
      [nroCliente]: !prev[nroCliente]
    }));
  };

  const getReclamosCliente = (nroCliente) => {
    return reclamos.filter(r => r['Nº Cliente'] === nroCliente)
      .sort((a, b) => new Date(b['Fecha y hora']) - new Date(a['Fecha y hora']))
      .slice(0, 3);
  };

  if (!puedeGestionar) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <Typography variant="h6">Acceso restringido</Typography>
          <Typography>
            Solo usuarios con permisos de gestión de clientes pueden acceder a esta sección.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            <Person sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Gestión de Clientes
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNuevoCliente}
          >
            Nuevo Cliente
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Lista de clientes */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Lista de Clientes ({clientes.length})
              </Typography>
              <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
                {clientes.map((cliente) => (
                  <Card key={cliente['Nº Cliente']} sx={{ mb: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Typography variant="subtitle1">
                            #{cliente['Nº Cliente']} - {cliente['Nombre']}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            <Business sx={{ fontSize: 14, mr: 0.5 }} />
                            Sector {cliente['Sector']}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                            {cliente['Dirección']}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleSeleccionarCliente(cliente['Nº Cliente'])}
                        >
                          <Edit />
                        </IconButton>
                      </Box>

                      {/* Reclamos del cliente */}
                      <Box sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          startIcon={reclamosExpandidos[cliente['Nº Cliente']] ? <ExpandLess /> : <ExpandMore />}
                          onClick={() => toggleReclamos(cliente['Nº Cliente'])}
                        >
                          Reclamos recientes
                        </Button>
                        <Collapse in={reclamosExpandidos[cliente['Nº Cliente']]}>
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                            {getReclamosCliente(cliente['Nº Cliente']).length === 0 ? (
                              <Typography variant="body2">No hay reclamos</Typography>
                            ) : (
                              getReclamosCliente(cliente['Nº Cliente']).map((reclamo, index) => (
                                <Box key={index} sx={{ mb: 1 }}>
                                  <Typography variant="caption" display="block">
                                    {new Date(reclamo['Fecha y hora']).toLocaleDateString()} - {reclamo['Tipo de reclamo']}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {reclamo['Estado']} - {reclamo['Técnico'] || 'Sin asignar'}
                                  </Typography>
                                </Box>
                              ))
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Grid>

            {/* Formulario de edición/creación */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                {nuevoCliente ? 'Nuevo Cliente' : `Editando Cliente #${clienteSeleccionado}`}
              </Typography>
              
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Número de Cliente *"
                        value={formData.nro_cliente}
                        onChange={(e) => handleInputChange('nro_cliente', e.target.value)}
                        disabled={!nuevoCliente}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Sector *</InputLabel>
                        <Select
                          value={formData.sector}
                          label="Sector *"
                          onChange={(e) => handleInputChange('sector', e.target.value)}
                        >
                          <MenuItem value="">Seleccionar sector</MenuItem>
                          {SECTORES_DISPONIBLES.map(sector => (
                            <MenuItem key={sector} value={sector}>
                              Sector {sector}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nombre completo *"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value.toUpperCase())}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Dirección *"
                        value={formData.direccion}
                        onChange={(e) => handleInputChange('direccion', e.target.value.toUpperCase())}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Teléfono"
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="N° de Precinto"
                        value={formData.precinto}
                        onChange={(e) => handleInputChange('precinto', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleGuardar}
                          disabled={!formData.nro_cliente || !formData.nombre || !formData.direccion || !formData.sector}
                        >
                          {nuevoCliente ? 'Crear Cliente' : 'Guardar Cambios'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setNuevoCliente(false);
                            setClienteEditando(null);
                          }}
                        >
                          Cancelar
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default GestionClientes;