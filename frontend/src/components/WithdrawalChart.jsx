import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { ArrowDownCircle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Withdrawal Chart component using Chart.js
const WithdrawalChart = ({ withdrawals, weeklyWithdrawals }) => {
  // Prepare data
  const data = weeklyWithdrawals && Object.keys(weeklyWithdrawals).length > 0
    ? Object.entries(weeklyWithdrawals)
        .map(([week, amount]) => ({ week: parseInt(week), amount: amount || 0 }))
        .sort((a, b) => a.week - b.week)
    : [];

  const chartData = {
    labels: data.map(d => `W${d.week}`),
    datasets: [
      {
        label: 'Withdrawals',
        data: data.map(d => d.amount),
        backgroundColor: '#F97316', // orange-500
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
    <div className="relative w-full h-[220px] sm:h-[260px] md:h-[300px]">
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <ArrowDownCircle className="w-8 h-8 mr-2" />
          No withdrawal data available
        </div>
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

export default WithdrawalChart;
