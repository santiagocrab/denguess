import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getForecast } from '../services/weather'

const ForecastSlider = () => {
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null)

  useEffect(() => {
    const loadForecast = async () => {
      try {
        const data = await getForecast()
        console.log('Forecast data loaded:', data)
        if (data && Array.isArray(data) && data.length > 0) {
          setForecast(data)
        } else {
          console.warn('Forecast data is empty or invalid:', data)
          setForecast([])
        }
      } catch (error) {
        console.error('Error loading forecast:', error)
        setForecast([])
      } finally {
        setLoading(false)
      }
    }
    loadForecast()
  }, [])

  const getWeatherIcon = (condition) => {
    const icons = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️'
    }
    return icons[condition] || '🌤️'
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <motion.div
        className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">7-Day Forecast</h3>
          <p className="text-sm text-gray-600">Koronadal City</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="flex-shrink-0 w-20 h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1">7-Day Forecast</h3>
        <p className="text-sm text-gray-600">Koronadal City</p>
      </div>
      {forecast.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Unable to load forecast data. Please try refreshing the page.</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
          {forecast.map((day, index) => (
            <div
              key={index}
              onClick={() => setExpandedDay(expandedDay === index ? null : index)}
              className={`flex-shrink-0 w-24 md:w-28 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 cursor-pointer transition-all transform hover:scale-105 ${
                expandedDay === index ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="text-xs text-gray-600 mb-2 font-medium">{formatDate(day.date)}</div>
              <div className="text-3xl mb-2 text-center">{getWeatherIcon(day.condition)}</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1 text-center">{day.temp}°C</div>
              <div className="text-xs text-gray-600 text-center">{day.rainfall > 0 ? day.rainfall : '0'}</div>
            </div>
          ))}
        </div>
      )}
      {expandedDay !== null && forecast[expandedDay] && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-900">{formatDate(forecast[expandedDay].date)}</h4>
            <div className="text-2xl">{getWeatherIcon(forecast[expandedDay].condition)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">High:</span> <span className="font-semibold">{forecast[expandedDay].tempMax}°C</span>
            </div>
            <div>
              <span className="text-gray-600">Low:</span> <span className="font-semibold">{forecast[expandedDay].tempMin}°C</span>
            </div>
            <div>
              <span className="text-gray-600">Humidity:</span> <span className="font-semibold">{forecast[expandedDay].humidity}%</span>
            </div>
            <div>
              <span className="text-gray-600">Wind:</span> <span className="font-semibold">{forecast[expandedDay].windSpeed}kph</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ForecastSlider
