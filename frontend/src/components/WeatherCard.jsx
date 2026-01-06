import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getCurrentWeather, subscribeToWeatherUpdates } from '../services/weather'
import { gsap } from 'gsap'

const WeatherCard = () => {
  const [weather, setWeather] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [loading, setLoading] = useState(true)
  const cardRef = useRef(null)

  useEffect(() => {
    const updateWeather = (data) => {
      setWeather(data)
      setLastUpdate(new Date())
      setLoading(false)
      
      // Animate card when weather updates
      if (cardRef.current) {
        gsap.from(cardRef.current, { duration: 0.5, opacity: 0, y: -10, ease: "power2.out" })
      }
    }

    getCurrentWeather().then(updateWeather)
    const cleanup = subscribeToWeatherUpdates(updateWeather, 900000) // 15 minutes

    return cleanup
  }, [])

  useEffect(() => {
    // Initial animation
    if (cardRef.current && !loading) {
      gsap.from(cardRef.current, { duration: 0.5, opacity: 0, y: -10, ease: "power2.out" })
    }
  }, [loading])

  const getWeatherIcon = (condition) => {
    const icons = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Mist': '🌫️',
      'Fog': '🌫️'
    }
    return icons[condition] || '🌤️'
  }

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading || !weather) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200 animate-slide-up">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#D64541] border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      ref={cardRef}
      className="weather-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-lg border-2 border-blue-200 relative group w-full"
      style={{ boxShadow: 'rgba(0, 0, 0, 0.08) 0px 4px 12px' }}
      title="Live weather powered by OpenWeatherMap"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Koronadal City</div>
          <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900">{weather.temperature}°C</div>
        </div>
        <div className="text-6xl md:text-7xl lg:text-8xl">{getWeatherIcon(weather.condition)}</div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 md:gap-6 text-base md:text-lg">
        <div>
          <div className="text-gray-600 mb-1">💧 Humidity</div>
          <div className="font-bold text-gray-900 text-xl md:text-2xl">{weather.humidity}%</div>
        </div>
        <div>
          <div className="text-gray-600 mb-1">🌧️ Rainfall</div>
          <div className="font-bold text-gray-900 text-xl md:text-2xl">{weather.rainfall}</div>
        </div>
        <div>
          <div className="text-gray-600 mb-1">💨 Wind</div>
          <div className="font-bold text-gray-900 text-xl md:text-2xl">{weather.windSpeed}kph</div>
        </div>
      </div>
      
      {lastUpdate && (
        <div className="mt-4 text-sm text-gray-500">
          Updated: {formatTime(lastUpdate)}
        </div>
      )}
    </motion.div>
  )
}

export default WeatherCard
