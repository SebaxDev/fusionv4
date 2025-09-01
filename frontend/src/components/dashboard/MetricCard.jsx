// frontend/src/components/dashboard/MetricCard.jsx
import React from 'react';
import { Card, CardContent, Typography, Box, Chip, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const MetricCard = ({ 
  value, 
  label, 
  icon, 
  color = '#2196f3', 
  trend, 
  helpText, 
  loading = false,
  suffix = '' 
}) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
        <Box sx={{ width: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            Cargando...
          </Typography>
        </Box>
      </Card>
    );
  }

  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend > 0 ? 'success' : 'error';
  const trendText = trend !== undefined ? `${Math.abs(trend)}%` : '';

  return (
    <Card sx={{ 
      height: '100%', 
      textAlign: 'center',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      border: `1px solid ${color}20`,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4],
        borderColor: color
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ color, fontSize: '2.5rem', mb: 1 }}>
          {icon}
        </Box>
        <Typography variant="h4" component="div" sx={{ 
          fontWeight: 700, 
          color: theme.palette.text.primary,
          mb: 1
        }}>
          {value} {suffix}
        </Typography>
        <Typography variant="h6" sx={{ 
          color: theme.palette.text.secondary,
          mb: trend ? 1 : 0
        }}>
          {label}
        </Typography>
        {trend !== undefined && (
          <Chip 
            icon={<TrendIcon />}
            label={trendText}
            size="small"
            color={trendColor}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        )}
        {helpText && (
          <Typography variant="caption" sx={{ 
            color: theme.palette.text.secondary,
            display: 'block',
            mt: 1
          }}>
            {helpText}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;