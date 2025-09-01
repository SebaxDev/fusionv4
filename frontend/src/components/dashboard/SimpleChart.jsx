// frontend/src/components/dashboard/SimpleChart.jsx
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const SimpleChart = ({ title, data, type = 'bar', color = '#2196f3', height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay datos disponibles
        </Typography>
      </Paper>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const normalizedData = data.map(item => ({
    ...item,
    normalizedValue: maxValue > 0 ? (item.value / maxValue) * height * 0.8 : 0
  }));

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ 
        height, 
        display: 'flex', 
        alignItems: 'end', 
        justifyContent: 'center',
        gap: 1,
        mt: 3 
      }}>
        {normalizedData.map((item, index) => (
          <Box
            key={index}
            sx={{
              width: 30,
              height: item.normalizedValue,
              bgcolor: color,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'center',
              p: 0.5,
              transition: 'height 0.3s ease',
              '&:hover': {
                bgcolor: `${color}dark`,
                transform: 'scale(1.05)'
              }
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
        {normalizedData.map((item, index) => (
          <Typography key={index} variant="caption" sx={{ textAlign: 'center', width: 30 }}>
            {item.label.length > 6 ? item.label.substring(0, 5) + '...' : item.label}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
};

export default SimpleChart;