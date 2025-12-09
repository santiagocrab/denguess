import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchBarangayBoundaries, getBarangayCentroids } from '../data/barangayBoundaries'
import { getCurrentWeather } from '../services/weather'

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

const getRiskFromWeather = (weather) => {
  if (!weather) return 'moderate'
  if (weather.rainfall > 50 || weather.humidity > 85) return 'high'
  if (weather.rainfall > 20 || weather.humidity > 75) return 'moderate'
  return 'low'
}

const getRiskColor = (risk) => {
  switch (risk) {
    case 'high': return '#ef4444'
    case 'moderate': return '#f59e0b'
    case 'low': return '#10b981'
    default: return '#6b7280'
  }
}

const MiniHeatmap = () => {
  const [boundaries, setBoundaries] = useState({})
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bounds, currentWeather] = await Promise.all([
          fetchBarangayBoundaries(),
          getCurrentWeather()
        ])
        setBoundaries(bounds)
        setWeather(currentWeather)
      } catch (error) {
        console.error('Error loading heatmap data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200 h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
      </div>
    )
  }

  const riskLevel = getRiskFromWeather(weather)

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200 animate-slide-up">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Interactive Heatmap</h3>
      <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
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
            
            const risk = getRiskFromWeather(weather)
            const color = getRiskColor(risk)
            
            return (
              <Polygon
                key={barangay}
                positions={boundary}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold text-sm mb-2">{barangay}</h4>
                    {weather && (
                      <div className="text-xs space-y-1">
                        <div>🌡️ Temp: {weather.temperature}°C</div>
                        <div>💧 Humidity: {weather.humidity}%</div>
                        <div>🌧️ Rain: {weather.rainfall}mm</div>
                        <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${
                          risk === 'high' ? 'bg-red-100 text-red-800' :
                          risk === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {risk === 'high' ? '⚠️ High Risk' : risk === 'moderate' ? '⚠️ Moderate Risk' : '✅ Low Risk'}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Polygon>
            )
          })}
        </MapContainer>
      </div>
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
    </div>
  )
}

export default MiniHeatmap

