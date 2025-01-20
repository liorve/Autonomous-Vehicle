import React, { useState, useEffect } from 'react';
import { Typography, Button, Snackbar, Alert, Box, Grid } from '@mui/material';
import OffsetChart from './OffsetChart';

const RealTimeStatsDisplay = ({ checkpointsData }) => {
  const [offsetData, setOffsetData] = useState([]);
  const [viewWindow, setViewWindow] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const dataMapRef = React.useRef(new Map());

  useEffect(() => {
    const newOffsetData = checkpointsData.reduce((acc, checkpoint) => {
      if (!dataMapRef.current.has(checkpoint.created_at)) {
        const newDataPoint = {
          time: checkpoint.created_at,
          value: checkpoint.avg_offset,
        };
        dataMapRef.current.set(checkpoint.created_at, newDataPoint);
        acc.push(newDataPoint);
      }
      return acc;
    }, []);

    setOffsetData((prevData) => [...prevData, ...newOffsetData].slice(-100));
  }, [checkpointsData]);

  const handleZoom = (direction) => {
    setViewWindow((prev) => {
      if (direction === 'in') {
        return Math.max(5, prev - 5);
      } else if (direction === 'out') {
        return prev + 5 <= offsetData.length ? Math.min(100, prev + 5) : prev;
      }
      return prev;
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} style={{ minWidth: '400px' }}>
          <OffsetChart data={offsetData} viewWindow={viewWindow} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={() => handleZoom('in')}>
          Zoom In
        </Button>
        <Button variant="contained" color="primary" onClick={() => handleZoom('out')}>
          Zoom Out
        </Button>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RealTimeStatsDisplay;