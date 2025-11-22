import { useState, useEffect } from 'react'
import BarangayMap from '../components/BarangayMap'
import { predictDengueRisk, reportCase } from '../services/api'
import { getCurrentWeather, subscribeToWeatherUpdates } from '../services/weather'

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
  const [reportData, setReportData] = useState({
    date: new Date().toISOString().split('T')[0],
    symptoms: '',
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
      await reportCase(barangay, reportData.date, reportData.symptoms)
      alert('Case report submitted successfully!')
      setShowReportForm(false)
      setReportData({ date: new Date().toISOString().split('T')[0], symptoms: '' })
    } catch (err) {
      alert('Failed to submit report: ' + err.message)
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
            <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-red-900">Temperature</label>
                <span className="text-2xl">🌡️</span>
              </div>
              <div className="text-3xl font-bold text-red-700">{climateData.temperature.toFixed(1)}</div>
              <div className="text-sm text-red-600 mt-1">°C</div>
            </div>

            <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-red-900">Humidity</label>
                <span className="text-2xl">💧</span>
              </div>
              <div className="text-3xl font-bold text-red-700">{climateData.humidity.toFixed(1)}</div>
              <div className="text-sm text-red-600 mt-1">%</div>
            </div>

            <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-red-900">Rainfall</label>
                <span className="text-2xl">🌧️</span>
              </div>
              <div className="text-3xl font-bold text-red-700">{climateData.rainfall.toFixed(1)}</div>
              <div className="text-sm text-red-600 mt-1">mm</div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive Map</h2>
          <BarangayMap barangay={barangay} currentRisk={currentRisk} />
        </div>

        {/* Forecast Table */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Weekly Forecast</h2>
              <p className="text-gray-600">4-week dengue risk prediction</p>
            </div>
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all transform hover:scale-105"
            >
              {showReportForm ? 'Cancel Report' : 'Report Case'}
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
              {forecast.map((week, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-6 border-2 ${getRiskColor(week.risk)} card-hover`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{getRiskIcon(week.risk)}</div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{week.week}</div>
                        <div className="text-sm text-gray-600">Week {index + 1} of 4</div>
                        {week.climate_used && (
                          <div className="text-xs text-gray-500 mt-1">
                            {week.climate_used.source === 'current' ? '📊 Current data' : '📅 Historical avg'} • 
                            {week.climate_used.rainfall}mm • 
                            {week.climate_used.temperature}°C • 
                            {week.climate_used.humidity}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-lg border-2 ${getRiskColor(week.risk)}`}>
                          {week.risk} Risk
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          {(week.probability * 100).toFixed(1)}% probability
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report Form */}
          {showReportForm && (
            <div className="mt-8 border-t-2 border-gray-200 pt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Report Dengue Case or Symptoms</h3>
              <form onSubmit={handleReportSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={reportData.date}
                    onChange={(e) => setReportData({ ...reportData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Symptoms (optional)
                  </label>
                  <textarea
                    value={reportData.symptoms}
                    onChange={(e) => setReportData({ ...reportData, symptoms: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                    rows="4"
                    placeholder="Describe symptoms if any..."
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all transform hover:scale-105"
                >
                  Submit Report
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Risk Legend */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Risk Level Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
              <div className="text-5xl mb-4 text-center">🟢</div>
              <h3 className="text-xl font-bold text-green-800 mb-2 text-center">Low Risk</h3>
              <p className="text-sm text-green-700 text-center">Minimal dengue activity expected. Continue preventive measures.</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
              <div className="text-5xl mb-4 text-center">🟡</div>
              <h3 className="text-xl font-bold text-yellow-800 mb-2 text-center">Moderate Risk</h3>
              <p className="text-sm text-yellow-700 text-center">Increased vigilance recommended. Monitor symptoms closely.</p>
            </div>
            <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
              <div className="text-5xl mb-4 text-center">🔴</div>
              <h3 className="text-xl font-bold text-red-800 mb-2 text-center">High Risk</h3>
              <p className="text-sm text-red-700 text-center">Take immediate preventive measures. Seek medical attention if needed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarangayPage
