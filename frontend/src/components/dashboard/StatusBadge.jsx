// frontend/src/components/dashboard/StatusBadge.jsx
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const StatusBadge = ({ 
  status, 
  count, 
  percentage, 
  color, 
  icon, 
  onClick 
}) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        bgcolor: `${color}15`,
        borderRadius: 2,
        border: `1px solid ${color}30`,
        mb: 1,
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          bgcolor: `${color}20`,
          borderColor: color,
          transform: 'translateX(4px)'
        } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ color, fontSize: '1.5rem' }}>{icon}</Box>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {status}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ color, fontWeight: 700 }}>
          {count}
        </Typography>
        {percentage && (
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            ({percentage}%)
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default StatusBadge;