import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const OffsetChart = ({ data, viewWindow = 6 }) => { 
  const createChartData = (data) => {
    const extendedData = [{ time: 'Start', value: 0 }, ...data.slice(-viewWindow)];

    return {
      labels: extendedData.map(d => d.time),
      datasets: [
        {
          label: 'Average Offset',
          data: extendedData.map(d => d.value),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        }
      ]
    };
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year.slice(-2)}`;
  };

  const options = {
    responsive: false,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 30,  
        bottom: 20, 
      }
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Real-time Average Offset', font: { size: 16 } },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const label = tooltipItems[0].label;
            if (label === 'Start') return 'Start';
            const [date, time] = label.split(' ');
            const formattedDate = formatDate(date);
            return `${time} ${formattedDate}`;
          },
          label: (tooltipItem) => {
            return `Average Offset: ${tooltipItem.formattedValue}`;
          }
        },
        displayColors: false,
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Time' },
        ticks: {
          autoSkip: false,
          minRotation: 13,
          callback: function(value, index, values) {
            const label = this.getLabelForValue(value);
            if (label === 'Start') {
              return 'Start';
            }
            const [date, time] = label.split(' ');
            const formattedDate = formatDate(date);
            return `${time}\n${formattedDate}`;
          },
        },
      },
      y: {
        title: { display: true, text: 'Offset' },
        suggestedMin: 0,
        suggestedMax: 7,
      }
    },
    animation: { duration: 0 },
    elements: { line: { borderWidth: 2 } },
  };

  return (
    <Box sx={{ height: '400px', width: '500px' }}>
      <Line 
        data={createChartData(data)} 
        options={options} 
        width={500}
        height={400}
      />
    </Box>
  );
};

export default OffsetChart;