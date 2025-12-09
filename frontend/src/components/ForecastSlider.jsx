import { useState, useEffect } from 'react'
import { getForecast } from '../services/weather'

const ForecastSlider = () => {
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null)

  useEffect(() => {
    const loadForecast = async () => {
      try {
        const data = await getForecast()
        setForecast(data)
      } catch (error) {
        console.error('Error loading forecast:', error)
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
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200 animate-slide-up">
        <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Forecast</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="flex-shrink-0 w-20 h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200 animate-slide-up">
      <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Forecast</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
        {forecast.map((day, index) => (
          <div
            key={index}
            onClick={() => setExpandedDay(expandedDay === index ? null : index)}
            className={`flex-shrink-0 w-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 cursor-pointer transition-all transform hover:scale-105 ${
              expandedDay === index ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-xs text-gray-600 mb-1">{formatDate(day.date)}</div>
            <div className="text-2xl mb-1">{getWeatherIcon(day.condition)}</div>
            <div className="text-lg font-bold text-gray-900">{day.temp}°</div>
            <div className="text-xs text-gray-600">{day.rainfall}mm</div>
          </div>
        ))}
      </div>
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
    </div>
  )
}

export default ForecastSlider

