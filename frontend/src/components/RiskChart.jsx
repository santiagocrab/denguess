import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
import { gsap } from 'gsap'

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
  const chartContainerRef = useRef(null)

  useEffect(() => {
    // GSAP entry animation for charts
    if (chartContainerRef.current) {
      gsap.from(chartContainerRef.current, { duration: 0.8, y: 20, opacity: 0, ease: "power2.out" })
    }
  }, [forecast, type])

  if (!forecast || forecast.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No forecast data available</p>
          <p className="text-gray-400 text-sm">Loading forecast data...</p>
        </div>
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
      'General Paulino Santos': '#D64541',
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
        borderColor: '#D64541',
        backgroundColor: 'rgba(214, 69, 65, 0.1)',
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
      {/* Barangay Filter Dropdown */}
      {allBarangaysData && onBarangayToggle && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label htmlFor="barangayFilter" className="block text-sm font-semibold text-gray-700 mb-2">
            Filter by Barangay:
          </label>
          <select
            id="barangayFilter"
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D64541] focus:border-[#D64541] text-gray-700"
            onChange={(e) => {
              const selected = e.target.value
              // Toggle the selected barangay
              Object.keys(allBarangaysData).forEach(name => {
                if (name === selected) {
                  onBarangayToggle(name, true)
                } else {
                  onBarangayToggle(name, false)
                }
              })
            }}
          >
            <option value="">All Barangays</option>
            {Object.keys(allBarangaysData).map(barangayName => (
              <option key={barangayName} value={barangayName}>
                {barangayName}
              </option>
            ))}
          </select>
        </div>
      )}
      <motion.div
        ref={chartContainerRef}
        className="chart-container w-full bg-white rounded-lg p-4"
        style={{ minHeight: '400px', height: '400px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
          {type === 'line' && <Line data={lineData} options={options} />}
          {type === 'bar' && <Bar data={barData} options={barOptions} />}
          {type === 'doughnut' && <Doughnut data={doughnutData} options={doughnutOptions} />}
        </div>
      </motion.div>
    </div>
  )
}

export default RiskChart
