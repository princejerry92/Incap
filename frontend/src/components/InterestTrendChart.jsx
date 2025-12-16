import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Interest Trend Chart component using Chart.js - Modern Histogram with rounded corners
const InterestTrendChart = ({ data }) => {
  // Process data for histogram - use cumulative_interest as bar height
  const chartData = data && data.length > 0
    ? data.map(d => ({
        week: d.week,
        value: d.cumulative_interest
      }))
    : [];

  const barData = {
    labels: chartData.map(d => `W${d.week}`),
    datasets: [
      {
        label: 'Cumulative Interest',
        data: chartData.map(d => d.value),
        backgroundColor: '#84CC16', // green-500
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: false,
      tooltip: {
        callbacks: {
          label: function(context) {
            return `₦${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#6B7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: { display: false },
        ticks: {
          color: '#6B7280',
          callback: function(value) {
            return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value;
          },
        },
      },
    },
  };

  return (
    <div className="relative w-full h-[240px] sm:h-[300px] md:h-[350px]">
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <TrendingUp className="w-8 h-8 mr-2" />
          No interest data available
        </div>
      ) : (
        <Bar data={barData} options={options} />
      )}
    </div>
  );
};

export default InterestTrendChart;
