import { useState, useEffect, useRef } from 'react'
import BarangayMap from '../components/BarangayMap'
import RiskLegend from '../components/RiskLegend'
import RiskChart from '../components/RiskChart'
import AnimatedCounter from '../components/AnimatedCounter'
import CaseReportModal from '../components/CaseReportModal'
import { predictDengueRisk, reportCase } from '../services/api'
import { getCurrentWeather, subscribeToWeatherUpdates } from '../services/weather'
import { gsap } from 'gsap'

const BarangayPage = ({ barangay }) => {
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [climateData, setClimateData] = useState({
    temperature: 28.0,
    humidity: 75,
    rainfall: 100,
  })
  const [weather, setWeather] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [selectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [showReportForm, setShowReportForm] = useState(false)
  const [chartType, setChartType] = useState('line')
  const [reportData, setReportData] = useState({
    // Patient Details
    name: '',
    age: '',
    sex: '',
    address: '',
    // Report Information
    dateReported: new Date().toISOString().split('T')[0],
    timeReported: new Date().toTimeString().slice(0, 5),
    reportedBy: '',
    // Presenting Symptoms
    fever: false,
    headache: false,
    musclePain: false,
    rash: false,
    nausea: false,
    abdominalPain: false,
    bleeding: false,
    // Symptom Onset
    symptomOnsetDate: '',
    // Risk Classification
    riskRed: false,
    riskYellow: false,
    riskGreen: false,
    // Action Taken
    referredToFacility: false,
    advisedMonitoring: false,
    notifiedFamily: false,
    // Remarks
    remarks: '',
  })

  const currentRisk = forecast.length > 0 ? forecast[0].risk : 'Unknown'

  // Auto-update climate data from weather service (read-only for public)
  useEffect(() => {
    const updateWeather = (weatherData) => {
      setWeather(weatherData)
      setLastUpdate(new Date())
      setClimateData({
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        rainfall: weatherData.rainfall,
      })
    }

    getCurrentWeather().then(updateWeather)
    const cleanup = subscribeToWeatherUpdates(updateWeather, 300000)

    return cleanup
  }, [])

  useEffect(() => {
    fetchForecast()
  }, [barangay, selectedDate, climateData])

  const fetchForecast = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await predictDengueRisk(barangay, climateData, selectedDate)
      setForecast(data.weekly_forecast || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch forecast')
      console.error('Forecast error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    try {
      // Prepare data for submission - convert empty strings to null for optional fields
      const submitData = {
        ...reportData,
        symptomOnsetDate: reportData.symptomOnsetDate || null,
        remarks: reportData.remarks || null,
        address: reportData.address || barangay, // Ensure address is set
      }
      
      await reportCase(barangay, submitData)
      alert('Case report submitted successfully!')
      setShowReportForm(false)
      // Reset form
      setReportData({
        name: '',
        age: '',
        sex: '',
        address: barangay,
        dateReported: new Date().toISOString().split('T')[0],
        timeReported: new Date().toTimeString().slice(0, 5),
        reportedBy: '',
        fever: false,
        headache: false,
        musclePain: false,
        rash: false,
        nausea: false,
        abdominalPain: false,
        bleeding: false,
        symptomOnsetDate: '',
        riskRed: false,
        riskYellow: false,
        riskGreen: false,
        referredToFacility: false,
        advisedMonitoring: false,
        notifiedFamily: false,
        remarks: '',
      })
    } catch (err) {
      console.error('Report submission error:', err)
      let errorMessage = 'Failed to submit report'
      
      try {
        if (err.response) {
          // Handle API error response
          const errorData = err.response.data
          if (errorData?.detail) {
            if (Array.isArray(errorData.detail)) {
              // Validation errors from FastAPI
              errorMessage = 'Validation errors:\n' + errorData.detail.map((e) => {
                const field = Array.isArray(e.loc) ? e.loc.slice(1).join('.') : 'unknown'
                return `${field}: ${e.msg || e.message || 'Invalid value'}`
              }).join('\n')
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail
            } else {
              errorMessage = String(errorData.detail)
            }
          } else if (errorData?.message) {
            errorMessage = errorData.message
          } else if (typeof errorData === 'string') {
            errorMessage = errorData
          } else {
            errorMessage = `Error ${err.response.status}: ${JSON.stringify(errorData, null, 2)}`
          }
        } else if (err.message) {
          errorMessage = err.message
        } else if (typeof err === 'string') {
          errorMessage = err
        } else {
          errorMessage = 'Unknown error occurred. Please check the console for details.'
        }
      } catch (parseErr) {
        errorMessage = `Error: ${String(err)}`
      }
      
      alert(errorMessage)
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'High':
        return '🔴'
      case 'Moderate':
        return '🟡'
      case 'Low':
        return '🟢'
      default:
        return '⚪'
    }
  }

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'High':
        return 'bg-red-600 text-white'
      case 'Moderate':
        return 'bg-yellow-500 text-white'
      case 'Low':
        return 'bg-green-600 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="min-h-screen pt-24 bg-gray-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{barangay}</h1>
              <p className="text-lg text-gray-600">Real-time Dengue Risk Forecast</p>
            </div>
            <div className={`px-6 py-3 rounded-lg font-bold text-lg shadow-md border-2 ${getRiskBadge(currentRisk)}`}>
              {getRiskIcon(currentRisk)} {currentRisk} Risk
            </div>
          </div>
        </div>

        {/* Climate Parameters Card - Read Only */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Current Climate Conditions</h2>
            <p className="text-gray-600">Real-time weather data from Koronadal City (Auto-updated)</p>
          </div>

          {weather && lastUpdate && (
            <div className="mb-4 text-sm text-gray-500 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Last updated: {new Date(lastUpdate).toLocaleTimeString()}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCounter
              value={climateData.temperature}
              label="Temperature"
              icon="🌡️"
              suffix="°C"
              decimals={1}
            />
            <AnimatedCounter
              value={climateData.humidity}
              label="Humidity"
              icon="💧"
              suffix="%"
              decimals={1}
            />
            <AnimatedCounter
              value={climateData.rainfall}
              label="Rainfall"
              icon="🌧️"
              suffix="mm"
              decimals={1}
            />
          </div>
        </div>

        {/* AI Smart Alerts */}
        {forecast.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🧠 AI Smart Alerts</h2>
            <div className="space-y-3">
              {(() => {
                const highRiskWeeks = forecast.filter(w => w.risk === 'High').length
                const recentTrend = forecast.length >= 2 
                  ? forecast[0].probability - forecast[1].probability 
                  : 0
                const alerts = []
                
                if (highRiskWeeks > 0) {
                  alerts.push(
                    <div key="high-risk" className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 shadow-sm rounded-md">
                      <p className="font-semibold">⚠️ High Risk Alert</p>
                      <p className="text-sm mt-1">
                        {highRiskWeeks} week{highRiskWeeks > 1 ? 's' : ''} showing high dengue risk. 
                        Take preventive measures and monitor symptoms closely.
                      </p>
                    </div>
                  )
                }
                
                if (recentTrend > 0.1) {
                  alerts.push(
                    <div key="trend-up" className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 shadow-sm rounded-md">
                      <p className="font-semibold">📈 Rising Risk Trend</p>
                      <p className="text-sm mt-1">
                        Dengue risk is increasing. Based on 3-week trends, risk may spike after rainfall in {barangay}.
                      </p>
                    </div>
                  )
                } else if (recentTrend < -0.1) {
                  alerts.push(
                    <div key="trend-down" className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 shadow-sm rounded-md">
                      <p className="font-semibold">📉 Decreasing Risk Trend</p>
                      <p className="text-sm mt-1">
                        Good news! Dengue risk is decreasing. Continue maintaining preventive measures.
                      </p>
                    </div>
                  )
                }
                
                if (climateData.rainfall > 20) {
                  alerts.push(
                    <div key="rainfall" className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 shadow-sm rounded-md">
                      <p className="font-semibold">🌧️ High Rainfall Alert</p>
                      <p className="text-sm mt-1">
                        Current rainfall is elevated. Stagnant water may increase mosquito breeding. 
                        Clear standing water around your area.
                      </p>
                    </div>
                  )
                }
                
                return alerts.length > 0 ? alerts : (
                  <div className="bg-gray-100 border-l-4 border-gray-400 text-gray-700 p-4 shadow-sm rounded-md">
                    <p className="text-sm">No active alerts. Current conditions are stable.</p>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive Map</h2>
          <BarangayMap barangay={barangay} currentRisk={currentRisk} />
        </div>

        {/* Forecast Chart (Optional) */}
        {!loading && !error && forecast.length > 0 && (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 animate-slide-up">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Forecast Visualization</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    chartType === 'line' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    chartType === 'bar' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('doughnut')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    chartType === 'doughnut' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Distribution
                </button>
              </div>
            </div>
            <div className="opacity-0" style={{ animation: 'fadeIn 0.8s ease-out forwards' }}>
              <RiskChart forecast={forecast} type={chartType} />
            </div>
          </div>
        )}

        {/* Forecast Table */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Weekly Forecast</h2>
              <p className="text-gray-600">4-week dengue risk prediction with date ranges</p>
            </div>
            <button
              onClick={() => {
                if (!showReportForm) {
                  // Initialize address with barangay when opening form
                  setReportData({
                    ...reportData,
                    address: barangay,
                    dateReported: new Date().toISOString().split('T')[0],
                    timeReported: new Date().toTimeString().slice(0, 5),
                  })
                }
                setShowReportForm(!showReportForm)
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all transform hover:scale-105"
            >
              📥 Report Case
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-semibold">Loading forecast...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <p className="text-red-800 font-semibold">Error: {error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {forecast.map((week, index) => {
                // Parse week string to get date range
                const weekParts = week.week.split('–')
                const startDate = weekParts[0].trim()
                const endDate = weekParts[1] || weekParts[0].trim()
                
                return (
                  <div
                    key={index}
                    className={`bg-white rounded-lg p-6 border-2 ${getRiskColor(week.risk)} card-hover transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="text-4xl">{getRiskIcon(week.risk)}</div>
                        <div className="flex-1">
                          <div className="text-lg font-bold text-gray-900 mb-1">{week.week}</div>
                          <div className="text-sm text-gray-600 mb-2">Week {index + 1} of 4</div>
                          {/* Prediction Block with Date Range */}
                          <div className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-sm border-2 ${getRiskColor(week.risk)}`}>
                            <span className="mr-2">{getRiskIcon(week.risk)}</span>
                            <span>{week.risk} Risk</span>
                            <span className="ml-2 text-xs opacity-75">({(week.probability * 100).toFixed(0)}%)</span>
                          </div>
                          {week.climate_used && (
                            <div className="text-xs text-gray-500 mt-2">
                              {week.climate_used.source === 'current' ? '📊 Current data' : '📅 Historical avg'} • 
                              {week.climate_used.rainfall}mm • 
                              {week.climate_used.temperature}°C • 
                              {week.climate_used.humidity}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Report Form - Now using Modal */}
          <CaseReportModal
            isOpen={showReportForm}
            onClose={() => {
              setShowReportForm(false)
              // Reset form when closing
              setReportData({
                name: '',
                age: '',
                sex: '',
                address: barangay,
                dateReported: new Date().toISOString().split('T')[0],
                timeReported: new Date().toTimeString().slice(0, 5),
                reportedBy: '',
                fever: false,
                headache: false,
                musclePain: false,
                rash: false,
                nausea: false,
                abdominalPain: false,
                bleeding: false,
                symptomOnsetDate: '',
                riskRed: false,
                riskYellow: false,
                riskGreen: false,
                referredToFacility: false,
                advisedMonitoring: false,
                notifiedFamily: false,
                remarks: '',
              })
            }}
            barangay={barangay}
            onSubmit={handleReportSubmit}
            reportData={reportData}
            setReportData={setReportData}
          />

          {/* Legacy inline form (hidden, kept for reference) */}
          {false && showReportForm && (
            <div className="mt-8 border-t-2 border-gray-200 pt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Report Dengue Case or Symptoms</h3>
              <form onSubmit={handleReportSubmit} className="space-y-8">
                {/* Patient Details Section */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">1. Patient Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportData.name}
                        onChange={(e) => setReportData({ ...reportData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                        required
                        placeholder="Enter patient name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Age <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={reportData.age}
                          onChange={(e) => setReportData({ ...reportData, age: e.target.value })}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                          required
                          min="0"
                          max="120"
                          placeholder="Age"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sex <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={reportData.sex}
                          onChange={(e) => setReportData({ ...reportData, sex: e.target.value })}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                          required
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address/Barangay <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportData.address}
                        onChange={(e) => setReportData({ ...reportData, address: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                        required
                        placeholder={`${barangay} (or enter specific address)`}
                      />
                    </div>
                  </div>
                </div>

                {/* Report Information Section */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">2. Report Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date Reported <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={reportData.dateReported}
                        onChange={(e) => setReportData({ ...reportData, dateReported: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Time Reported <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={reportData.timeReported}
                        onChange={(e) => setReportData({ ...reportData, timeReported: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Reported By <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportData.reportedBy}
                        onChange={(e) => setReportData({ ...reportData, reportedBy: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                        required
                        placeholder="Enter reporter name"
                      />
                    </div>
                  </div>
                </div>

                {/* Presenting Symptoms Section */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">3. Presenting Symptoms</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.fever}
                        onChange={(e) => setReportData({ ...reportData, fever: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Fever (2–7 days)</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.headache}
                        onChange={(e) => setReportData({ ...reportData, headache: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Headache / Eye Pain</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.musclePain}
                        onChange={(e) => setReportData({ ...reportData, musclePain: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Muscle or Joint Pain</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.rash}
                        onChange={(e) => setReportData({ ...reportData, rash: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Rash</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.nausea}
                        onChange={(e) => setReportData({ ...reportData, nausea: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Nausea / Vomiting</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.abdominalPain}
                        onChange={(e) => setReportData({ ...reportData, abdominalPain: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Abdominal Pain</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.bleeding}
                        onChange={(e) => setReportData({ ...reportData, bleeding: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Bleeding Signs</span>
                    </label>
                  </div>
                </div>

                {/* Symptom Onset Section */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">4. Symptom Onset</h4>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date Started
                    </label>
                    <input
                      type="date"
                      value={reportData.symptomOnsetDate}
                      onChange={(e) => setReportData({ ...reportData, symptomOnsetDate: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                    />
                  </div>
                </div>

                {/* Risk Classification Section */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">5. Risk Classification</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.riskRed}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setReportData({ 
                            ...reportData, 
                            riskRed: checked,
                            riskYellow: checked ? false : reportData.riskYellow,
                            riskGreen: checked ? false : reportData.riskGreen
                          })
                        }}
                        className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="text-gray-700 font-semibold">🔴 Red – High Risk</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.riskYellow}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setReportData({ 
                            ...reportData, 
                            riskYellow: checked,
                            riskRed: checked ? false : reportData.riskRed,
                            riskGreen: checked ? false : reportData.riskGreen
                          })
                        }}
                        className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                      />
                      <span className="text-gray-700 font-semibold">🟡 Yellow – Moderate Risk</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.riskGreen}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setReportData({ 
                            ...reportData, 
                            riskGreen: checked,
                            riskRed: checked ? false : reportData.riskRed,
                            riskYellow: checked ? false : reportData.riskYellow
                          })
                        }}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700 font-semibold">🟢 Green – Low Risk</span>
                    </label>
                  </div>
                </div>

                {/* Action Taken Section */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">6. Action Taken</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.referredToFacility}
                        onChange={(e) => setReportData({ ...reportData, referredToFacility: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Referred to Health Facility</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.advisedMonitoring}
                        onChange={(e) => setReportData({ ...reportData, advisedMonitoring: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Advised Monitoring</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportData.notifiedFamily}
                        onChange={(e) => setReportData({ ...reportData, notifiedFamily: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Notified Family</span>
                    </label>
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Remarks</h4>
                  <textarea
                    value={reportData.remarks}
                    onChange={(e) => setReportData({ ...reportData, remarks: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                    rows="4"
                    placeholder="Enter any additional remarks or notes..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-8 py-4 rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all transform hover:scale-105"
                >
                  Submit Report
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Risk Chart */}
        {!loading && !error && forecast.length > 0 && (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Risk Trend Visualization</h2>
            <RiskChart forecast={forecast} type="bar" />
          </div>
        )}

        {/* Risk Legend */}
        <RiskLegend />
      </div>
    </div>
  )
}

export default BarangayPage
