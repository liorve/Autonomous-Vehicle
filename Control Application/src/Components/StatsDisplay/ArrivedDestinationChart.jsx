import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Box } from '@mui/material';
ChartJS.register(ArcElement, Tooltip, Legend);

const ArrivedDestinationChart = ({ telemetryData = [] }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (telemetryData.length > 0) {
      const numbersOfTripsArrived = telemetryData.filter(data => data.arrived_at_destination == 1).length;
      const totalTrips = telemetryData.length;
      console.log("arrived", numbersOfTripsArrived, "not arrived", totalTrips - numbersOfTripsArrived);
      
      const data = {
        labels: ['Arrived', 'Not Arrived'],
        datasets: [
          {
            label: '# of Trips',
            data: [numbersOfTripsArrived, totalTrips - numbersOfTripsArrived],
            backgroundColor: ['#36A2EB', '#FF6384'],
            hoverBackgroundColor: ['#36A2EB', '#FF6384'],
            borderWidth: 1,
          },
        ],
      };
      setChartData(data);
    }
  }, [telemetryData]);

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const value = tooltipItem.raw;
            const total = telemetryData.length;
            const percentage = ((value / total) * 100).toFixed(2);
            return `${tooltipItem.label}: ${percentage}% (${value} trips)`;
          },
        },
      },
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      <Box sx={{ height: '400px', width: '400px', margin: '0 auto' }}>
        {chartData ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <p>No data available</p>
        )}
      </Box>
    </Box>
  );
};

export default ArrivedDestinationChart;