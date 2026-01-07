import { MapContainer, TileLayer, Polygon, Popup, Tooltip } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchBarangayBoundaries } from '../data/barangayBoundaries'
import { getAllBarangayPredictionsOptimized } from '../services/api'
import { subscribeToWeatherUpdates, getCurrentWeather } from '../services/weather'

// Fix for default marker icon
if (typeof window !== 'undefined' && L.Icon && L.Icon.Default) {
  try {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  } catch (e) {}
}

const KORONADAL_CENTER = [6.4938, 124.8531]
const BARANGAY_NAMES = ['General Paulino Santos', 'Zone II', 'Santa Cruz', 'Sto. Niño', 'Morales']

const getRiskColor = (risk) => {
  switch (risk) {
    case 'High':
      return '#ef4444' // red-500
    case 'Moderate':
      return '#f59e0b' // amber-500
    case 'Low':
      return '#10b981' // emerald-500
    default:
      return '#6b7280' // gray-500
  }
}

const MiniHeatmap = () => {
  const [boundaries, setBoundaries] = useState({})
  const [barangayRisks, setBarangayRisks] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingBoundaries, setLoadingBoundaries] = useState(true)
  const [weather, setWeather] = useState(null)

  const fetchBoundaries = async () => {
    try {
      setLoadingBoundaries(true)
      const bounds = await fetchBarangayBoundaries()
      setBoundaries(bounds)
    } catch (error) {
      console.error('Error fetching boundaries:', error)
      const { getApproximateBoundaries } = await import('../data/barangayBoundaries')
      setBoundaries(getApproximateBoundaries())
    } finally {
      setLoadingBoundaries(false)
    }
  }

  const fetchAllPredictions = async () => {
    try {
      setLoading(true)
      // Use optimized batch endpoint for faster loading
      const predictions = await getAllBarangayPredictionsOptimized()
      const risks = {}
      
      // Get all barangays to ensure we have predictions for all
      const { getBarangays } = await import('../services/api')
      const allBarangays = await getBarangays()
      
      // Get current week's risk for each barangay from ML model predictions - ensure we always have a valid risk
      allBarangays.forEach(barangay => {
        let riskValue = 'Moderate' // Default fallback
        if (predictions[barangay] && predictions[barangay].full_forecast && predictions[barangay].full_forecast.length > 0) {
          const forecast = predictions[barangay].full_forecast[0]
          // Validate risk value - must be Low, Moderate, or High
          const validRisk = forecast.risk
          if (validRisk === 'Low' || validRisk === 'Moderate' || validRisk === 'High') {
            riskValue = validRisk
          } else {
            console.warn(`Invalid risk value for ${barangay}: ${validRisk}, using Moderate`)
            riskValue = 'Moderate'
          }
        } else {
          // If prediction is missing, use Moderate as default
          console.warn(`Missing prediction for ${barangay}, using Moderate as fallback`)
        }
        risks[barangay] = riskValue
      })
      
      // Ensure all barangays have a risk value
      allBarangays.forEach(barangay => {
        if (!risks[barangay] || risks[barangay] === 'Unknown' || risks[barangay] === '') {
          risks[barangay] = 'Moderate'
        }
      })
      
      setBarangayRisks(risks)
    } catch (error) {
      console.error('Error fetching predictions:', error)
      // Set all to Moderate if fetch completely fails
      const { getBarangays } = await import('../services/api')
      try {
        const allBarangays = await getBarangays()
        const fallbackRisks = {}
        allBarangays.forEach(barangay => {
          fallbackRisks[barangay] = 'Moderate'
        })
        setBarangayRisks(fallbackRisks)
      } catch (err) {
        console.error('Error getting barangays for fallback:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllPredictions()
    fetchBoundaries()
    
    // Load current weather for tooltips
    getCurrentWeather().then(setWeather)
    
    // Subscribe to weather updates to refresh predictions when weather changes
    const weatherCleanup = subscribeToWeatherUpdates((weatherData) => {
      setWeather(weatherData)
      fetchAllPredictions()
    }, 300000)  // Also refresh every 5 minutes
    
    // Refresh predictions every 5 minutes (same as barangay pages)
    const interval = setInterval(() => {
      fetchAllPredictions()
    }, 300000)

    return () => {
      clearInterval(interval)
      if (weatherCleanup) weatherCleanup()
    }
  }, [])

  if (loading || loadingBoundaries) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200 h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <motion.div
      className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-2">Interactive Heatmap</h3>
      <p className="text-sm text-gray-600 mb-3 italic">
        🗺️ Real-time insights that help communities prepare, respond, and stay safe.
      </p>
      <motion.div
        className="h-64 rounded-lg overflow-hidden border border-gray-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <MapContainer
          center={KORONADAL_CENTER}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {BARANGAY_NAMES.map((barangay) => {
            const boundary = boundaries[barangay]
            if (!boundary) return null
            
            // Ensure we always have a valid risk value - never Unknown
            let risk = barangayRisks[barangay]
            if (!risk || risk === 'Unknown' || risk === '' || (risk !== 'Low' && risk !== 'Moderate' && risk !== 'High')) {
              risk = 'Moderate'
            }
            const color = getRiskColor(risk)
            const fillOpacity = risk === 'High' ? 0.5 : risk === 'Moderate' ? 0.4 : 0.3 // Better opacity range
            const temp = weather?.temperature || 28.0
            const humidity = weather?.humidity || 75
            const wind = weather?.windSpeed || 10
            
            // Simplified tooltip content as per requirements (only temp and humidity)
            const tooltipContent = `${barangay}<br>🌡 ${temp.toFixed(1)}°C | 💧 ${humidity}%`
            
            return (
              <Polygon
                key={barangay}
                positions={boundary}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: fillOpacity,
                  weight: 2,
                }}
              >
                <Tooltip>
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: tooltipContent }} />
                </Tooltip>
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold text-sm mb-2">{barangay}</h4>
                    <div className="space-y-1 mb-2 text-xs">
                      <div>🌡️ Temp: <strong>{temp.toFixed(1)}°C</strong></div>
                      <div>💧 Humidity: <strong>{humidity}%</strong></div>
                      <div>🌬️ Wind: <strong>{wind.toFixed(1)}kph</strong></div>
                    </div>
                    <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${
                      risk === 'High' ? 'bg-red-100 text-red-800' :
                      risk === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      risk === 'Low' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {risk === 'High' ? '🔴 High Risk' : risk === 'Moderate' ? '🟡 Moderate Risk' : risk === 'Low' ? '🟢 Low Risk' : '🟡 Moderate Risk'}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Based on ML model prediction
                    </p>
                  </div>
                </Popup>
              </Polygon>
            )
          })}
        </MapContainer>
      </motion.div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>Low Risk</span>
        </div>
      </div>
    </motion.div>
  )
}

export default MiniHeatmap

