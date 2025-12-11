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

const RiskChart = ({ forecast, type = 'line', barangay = null, allBarangaysData = null, selectedBarangays = null, onBarangayToggle = null }) => {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No forecast data available</p>
      </div>
    )
  }

  // Format dates for x-axis labels
  const formatDate = (weekString) => {
    const parts = weekString.split('–')
    if (parts.length > 1) {
      const startDate = new Date(parts[0].trim())
      return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return weekString
  }

  const weeks = forecast.map((week) => formatDate(week.week))
  const risks = forecast.map(week => {
    switch (week.risk) {
      case 'High': return 3
      case 'Moderate': return 2
      case 'Low': return 1
      default: return 0
    }
  })
  const probabilities = forecast.map(week => parseFloat((week.probability * 100).toFixed(1)))

  const riskColors = forecast.map(week => {
    switch (week.risk) {
      case 'High': return '#ef4444'
      case 'Moderate': return '#f59e0b'
      case 'Low': return '#10b981'
      default: return '#6b7280'
    }
  })

  // Prepare datasets for multi-barangay comparison if available
  let lineDatasets = []
  let barDatasets = []

  if (allBarangaysData && selectedBarangays) {
    // Multi-barangay mode
    const barangayColors = {
      'General Paulino Santos': '#D32F2F',
      'Zone II': '#1976D2',
      'Santa Cruz': '#388E3C',
      'Sto. Niño': '#F57C00',
      'Morales': '#7B1FA2',
    }
    
    selectedBarangays.forEach(barangayName => {
      const data = allBarangaysData[barangayName]
      if (data && data.weekly_forecast) {
        const probs = data.weekly_forecast.map(w => parseFloat((w.probability * 100).toFixed(1)))
        const color = barangayColors[barangayName] || '#6b7280'
        lineDatasets.push({
          label: barangayName,
          data: probs,
          borderColor: color,
          backgroundColor: color + '40',
          tension: 0.4,
          fill: false,
        })
        barDatasets.push({
          label: barangayName,
          data: probs,
          backgroundColor: color + '80',
          borderColor: color,
          borderWidth: 2,
        })
      }
    })
  } else {
    // Single barangay mode
    lineDatasets = [
      {
        label: 'Probability of Dengue Risk (%)',
        data: probabilities,
        borderColor: '#D32F2F',
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ]
    barDatasets = [
      {
        label: 'Probability of Dengue Risk (%)',
        data: probabilities,
        backgroundColor: riskColors,
        borderColor: riskColors,
        borderWidth: 2,
      },
    ]
  }

  const lineData = {
    labels: weeks,
    datasets: lineDatasets,
  }

  const barData = {
    labels: weeks,
    datasets: barDatasets.length > 0 ? barDatasets : [
      {
        label: 'Probability of Dengue Risk (%)',
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

  const getRiskLevel = (probability) => {
    if (probability >= 60) return 'High'
    if (probability >= 30) return 'Moderate'
    return 'Low'
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
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y
            const riskLevel = getRiskLevel(value)
            return `🧪 ${context.dataset.label || 'Risk'}: ${value.toFixed(1)}% (${riskLevel} Risk)`
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Forecast Dates',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Probability of Dengue Risk (%)',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        ticks: {
          callback: function(value) {
            return value + '%'
          },
        },
      },
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: allBarangaysData ? true : false,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Risk Probability by Week',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y
            const riskLevel = getRiskLevel(value)
            return `🧪 ${context.dataset.label || 'Risk'}: ${value.toFixed(1)}% (${riskLevel} Risk)`
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Forecast Dates',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Probability of Dengue Risk (%)',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
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
    <div className="w-full">
      {/* Barangay Toggle Switches (if multi-barangay mode) */}
      {allBarangaysData && onBarangayToggle && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Filter by Barangay:</h4>
          <div className="flex flex-wrap gap-3">
            {Object.keys(allBarangaysData).map(barangayName => (
              <label key={barangayName} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBarangays?.includes(barangayName) || false}
                  onChange={(e) => onBarangayToggle(barangayName, e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">{barangayName}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="w-full h-80 bg-white rounded-lg p-4">
        {type === 'line' && <Line data={lineData} options={options} />}
        {type === 'bar' && <Bar data={barData} options={barOptions} />}
        {type === 'doughnut' && <Doughnut data={doughnutData} options={doughnutOptions} />}
      </div>
    </div>
  )
}

export default RiskChart
