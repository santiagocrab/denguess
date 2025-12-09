import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const RiskChart = ({ forecast, type = 'line' }) => {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No forecast data available</p>
      </div>
    )
  }

  const weeks = forecast.map((week, index) => `Week ${index + 1}`)
  const risks = forecast.map(week => {
    switch (week.risk) {
      case 'High': return 3
      case 'Moderate': return 2
      case 'Low': return 1
      default: return 0
    }
  })
  const probabilities = forecast.map(week => (week.probability * 100).toFixed(1))

  const riskColors = forecast.map(week => {
    switch (week.risk) {
      case 'High': return '#ef4444'
      case 'Moderate': return '#f59e0b'
      case 'Low': return '#10b981'
      default: return '#6b7280'
    }
  })

  const lineData = {
    labels: weeks,
    datasets: [
      {
        label: 'Risk Level (1=Low, 2=Moderate, 3=High)',
        data: risks,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Probability (%)',
        data: probabilities,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y1',
        tension: 0.4,
      },
    ],
  }

  const barData = {
    labels: weeks,
    datasets: [
      {
        label: 'Risk Probability (%)',
        data: probabilities,
        backgroundColor: riskColors,
        borderColor: riskColors,
        borderWidth: 2,
      },
    ],
  }

  const doughnutData = {
    labels: ['Low Risk', 'Moderate Risk', 'High Risk'],
    datasets: [
      {
        data: [
          forecast.filter(w => w.risk === 'Low').length,
          forecast.filter(w => w.risk === 'Moderate').length,
          forecast.filter(w => w.risk === 'High').length,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Dengue Risk Forecast - 4 Weeks',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 3,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            if (value === 1) return 'Low'
            if (value === 2) return 'Moderate'
            if (value === 3) return 'High'
            return ''
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Risk Probability by Week',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%'
          },
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Risk Distribution',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  }

  return (
    <div className="w-full h-80 bg-white rounded-lg p-4">
      {type === 'line' && <Line data={lineData} options={options} />}
      {type === 'bar' && <Bar data={barData} options={barOptions} />}
      {type === 'doughnut' && <Doughnut data={doughnutData} options={doughnutOptions} />}
    </div>
  )
}

export default RiskChart
