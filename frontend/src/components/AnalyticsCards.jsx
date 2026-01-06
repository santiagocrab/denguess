import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCurrentWeather } from '../services/weather'

const AnalyticsCards = () => {
  const [current, setCurrent] = useState(null)
  const [previous, setPrevious] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const weather = await getCurrentWeather()
        setCurrent(weather)
        
        // Simulate previous data (in real app, fetch from history)
        setPrevious({
          temperature: weather.temperature - 2,
          humidity: weather.humidity - 5,
          rainfall: weather.rainfall - 3
        })
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !current || !previous) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200 h-24 animate-pulse"></div>
        ))}
      </div>
    )
  }

  const tempDiff = current.temperature - previous.temperature
  const humidityDiff = current.humidity - previous.humidity
  const rainTrend = current.rainfall > previous.rainfall ? 'up' : current.rainfall < previous.rainfall ? 'down' : 'stable'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Temperature Card */}
      <motion.div
        className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">🌡️ Temperature</div>
            <div className="text-2xl font-bold text-gray-900">{current.temperature}°C</div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${
              tempDiff > 0 ? 'text-red-600' : tempDiff < 0 ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {tempDiff > 0 ? '↑' : tempDiff < 0 ? '↓' : '→'} {Math.abs(tempDiff).toFixed(1)}°C vs yesterday
            </div>
          </div>
        </div>
      </motion.div>

      {/* Humidity Card */}
      <motion.div
        className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">💧 Humidity</div>
            <div className="text-2xl font-bold text-gray-900">{current.humidity}%</div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${
              humidityDiff > 0 ? 'text-red-600' : humidityDiff < 0 ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {humidityDiff > 0 ? '↑' : humidityDiff < 0 ? '↓' : '→'} {Math.abs(humidityDiff)}% vs last week avg
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rainfall Trend Card */}
      <motion.div
        className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">🌧️ Rainfall Trend</div>
            <div className="text-2xl font-bold text-gray-900">{current.rainfall}mm</div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${
              rainTrend === 'up' ? 'text-blue-600' : rainTrend === 'down' ? 'text-gray-600' : 'text-green-600'
            }`}>
              {rainTrend === 'up' ? '↗️' : rainTrend === 'down' ? '↘️' : '→'} {rainTrend === 'up' ? 'Increasing' : rainTrend === 'down' ? 'Decreasing' : 'Stable'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyticsCards
