// frontend/src/components/dashboard/Dashboard.jsx - Versión final
import React, { useState, useEffect, useContext } from 'react';
import {
  Grid, Card, CardContent, Typography, Box,
  Chip, LinearProgress, useTheme, Paper,
  Tabs, Tab, Button, IconButton
} from '@mui/material';
import {
  Refresh, TrendingUp, TrendingDown,
  Dashboard as DashboardIcon, BarChart,
  PieChart, ShowChart, Download
} from '@mui/icons-material';

import { reclamosService } from '../../services/reclamosService';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Componentes auxiliares
import MetricCard from './MetricCard';
import StatusBadge from './StatusBadge';
import SimpleChart from './SimpleChart';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalReclamos: 0,
    reclamosActivos: 0,
    reclamosResueltos: 0,
    porcentajeResueltos: 0,
    reclamos24h: 0,
    reclamosSemana: 0,
    reclamosMes: 0,
    pendientes: 0,
    enProceso: 0,
    cancelados: 0,
    tiempoPromedioResolucion: 0
  });
  
  const [estados, setEstados] = useState([]);
  const [distribucionTipo, setDistribucionTipo] = useState([]);
  const [distribucionSector, setDistribucionSector] = useState([]);
  const [reclamosRecientes, setReclamosRecientes] = useState([]);
  const [tendencias, setTendencias] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('week');
  
  const { user } = useContext(AuthContext);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    cargarMetricas();
    
    // Configurar actualización automática cada 5 minutos
    const interval = setInterval(() => {
      cargarMetricas(true);
    }, 300000);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const cargarMetricas = async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const [metricasResult, tendenciasResult] = await Promise.all([
        reclamosService.obtenerMetricasDashboard(timeRange),
        reclamosService.obtenerTendenciasTemporales('month')
      ]);

      if (metricasResult.success) {
        const metricas = metricasResult.data;
        
        setStats({
          totalReclamos: metricas.total_reclamos,
          reclamosActivos: metricas.reclamos_activos,
          reclamosResueltos: metricas.reclamos_resueltos,
          porcentajeResueltos: metricas.porcentaje_resueltos,
          reclamos24h: metricas.reclamos_24h,
          reclamosSemana: metricas.reclamos_semana,
          reclamosMes: metricas.reclamos_mes,
          pendientes: metricas.pendientes,
          enProceso: metricas.en_proceso,
          cancelados: metricas.cancelados,
          tiempoPromedioResolucion: metricas.tiempo_promedio_resolucion
        });

        // Procesar distribución por tipo
        const tipoData = Object.entries(metricas.distribucion_tipo || {})
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);
        setDistribucionTipo(tipoData);

        // Procesar distribución por sector
        const sectorData = Object.entries(metricas.distribucion_sector || {})
          .map(([label, value]) => ({ label: `Sector ${label}`, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);
        setDistribucionSector(sectorData);

        // Procesar estados
        const estadosData = Object.entries(metricas.distribucion_tipo || {})
          .map(([estado, count]) => ({
            estado,
            count,
            percentage: metricas.total_reclamos > 0 ? (count / metricas.total_reclamos * 100).toFixed(1) : 0
          }))
          .sort((a, b) => b.count - a.count);
        setEstados(estadosData);

        setReclamosRecientes(metricas.reclamos_recientes || []);
        setTendencias(metricas.tendencias || {});

        if (isBackgroundRefresh) {
          showSuccess('Datos actualizados automáticamente');
        }
      } else {
        showError('Error cargando métricas del dashboard');
      }
    } catch (error) {
      console.error('Error cargando métricas:', error);
      showError('Error cargando métricas del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    cargarMetricas();
  };

  const handleExportData = async () => {
    try {
      const response = await reclamosService.exportarReclamos({});
      if (response.success) {
        // Crear descarga del archivo
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_reclamos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showSuccess('Reporte exportado exitosamente');
      } else {
        showError('Error exportando reporte');
      }
    } catch (error) {
      console.error('Error exportando datos:', error);
      showError('Error al exportar el reporte');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const statusConfig = {
    'Pendiente': { color: '#ff9800', icon: '⏳' },
    'En Proceso': { color: '#2196f3', icon: '🔧' },
    'Resuelto': { color: '#4caf50', icon: '✅' },
    'Cerrado': { color: '#4caf50', icon: '🔒' },
    'Cancelado': { color: '#f44336', icon: '❌' },
    'Desconexión': { color: '#ff5252', icon: '🔌' },
    'Derivado': { color: '#9c27b0', icon: '↗️' },
    'Desconocido': { color: '#9e9e9e', icon: '❓' }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con controles */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        p: 3, 
        borderRadius: 2,
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Dashboard de Métricas
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Resumen general de la gestión de reclamos en tiempo real
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportData}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Selector de rango de tiempo */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs value={timeRange} onChange={(e, newValue) => setTimeRange(newValue)}>
          <Tab label="Hoy" value="today" />
          <Tab label="Esta semana" value="week" />
          <Tab label="Este mes" value="month" />
          <Tab label="Todos" value="all" />
        </Tabs>
      </Paper>

      {/* Métricas Principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            value={stats.totalReclamos}
            label="Total Reclamos"
            icon="📋"
            color="#2196f3"
            trend={tendencias.total}
            helpText="Total histórico de reclamos"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            value={stats.reclamosActivos}
            label="Activos"
            icon="📄"
            color="#ff9800"
            helpText="Requieren atención inmediata"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            value={stats.reclamos24h}
            label="Últimas 24h"
            icon="🕒"
            color="#9c27b0"
            helpText="Nuevos reclamos recientes"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            value={`${stats.porcentajeResueltos.toFixed(1)}%`}
            label="Tasa Resolución"
            icon="🎯"
            color="#4caf50"
            helpText="Eficiencia general del sistema"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Segunda Fila de Métricas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            value={stats.pendientes}
            label="Pendientes"
            icon="⏳"
            color="#ff9800"
            helpText="Esperando asignación"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            value={stats.enProceso}
            label="En Proceso"
            icon="🔧"
            color="#2196f3"
            helpText="En trabajo activo"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            value={stats.reclamosResueltos}
            label="Resueltos"
            icon="✅"
            color="#4caf50"
            helpText="Completados exitosamente"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            value={stats.tiempoPromedioResolucion}
            label="Días Promedio"
            icon="⏱️"
            color="#ff5722"
            helpText="Tiempo promedio de resolución"
            loading={loading}
            suffix="días"
          />
        </Grid>
      </Grid>

      {/* Tabs para diferentes vistas */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<BarChart />} label="Distribución por Estado" />
          <Tab icon={<PieChart />} label="Distribución por Tipo" />
          <Tab icon={<ShowChart />} label="Distribución por Sector" />
          <Tab icon={<DashboardIcon />} label="Reclamos Recientes" />
        </Tabs>
      </Paper>

      {/* Contenido de las tabs */}
      {tabValue === 0 && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart /> Distribución por Estado
          </Typography>
          
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            {estados.map(({ estado, count, percentage }) => {
              const config = statusConfig[estado] || statusConfig['Desconocido'];
              return (
                <StatusBadge
                  key={estado}
                  status={estado}
                  count={count}
                  percentage={percentage}
                  color={config.color}
                  icon={config.icon}
                />
              );
            })}
          </Box>
        </Card>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <SimpleChart
              title="Distribución por Tipo de Reclamo"
              data={distribucionTipo}
              color="#2196f3"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Detalles por Tipo
              </Typography>
              {distribucionTipo.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2">{item.label}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <SimpleChart
              title="Distribución por Sector"
              data={distribucionSector}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Detalles por Sector
              </Typography>
              {distribucionSector.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2">{item.label}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon /> Reclamos Recientes
          </Typography>
          
          {reclamosRecientes.length > 0 ? (
            reclamosRecientes.map((reclamo, index) => {
              const config = statusConfig[reclamo.Estado] || statusConfig['Desconocido'];
              return (
                <Paper key={index} sx={{ p: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {reclamo['Nº Cliente']} - {reclamo.Nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reclamo['Fecha y hora']} | Sector {reclamo.Sector}
                      </Typography>
                      <Typography variant="body2">
                        {reclamo['Tipo de reclamo']}
                      </Typography>
                    </Box>
                    <Chip
                      label={reclamo.Estado}
                      sx={{ bgcolor: `${config.color}20`, color: config.color, border: `1px solid ${config.color}30` }}
                    />
                  </Box>
                </Paper>
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No hay reclamos recientes
            </Typography>
          )}
        </Card>
      )}

      {/* Información del sistema */}
      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Última actualización: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')} | 
          Usuario: {user?.nombre || 'Sistema'} | 
          {refreshing && ' Actualizando datos...'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;