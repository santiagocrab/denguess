import { MapContainer, TileLayer, Polygon, Popup, Tooltip } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAllBarangayPredictions } from '../services/api'

// Fix for default marker icon in React Leaflet
if (typeof window !== 'undefined' && L.Icon && L.Icon.Default) {
  try {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  } catch (e) {
    // Silently fail if icon fix doesn't work
  }
}

// Koronadal City center coordinates
const KORONADAL_CENTER = [6.4938, 124.8531]

// 🗺️ CORRECTED BARANGAY COORDINATES
// Centroids for each barangay in Koronadal City
const BARANGAY_COORDINATES = {
  'General Paulino Santos': [6.5050, 124.8473],
  'Zone II': [6.4960, 124.8531],
  'Santa Cruz': [6.4743, 124.8398],
  'Sto. Niño': [6.4938, 124.8681],
  'Morales': [6.4765, 124.8617],
}

// Create approximate polygons around centroids (0.01 degree radius ~1km)
const createPolygonFromCenter = (center, radius = 0.008) => {
  const [lat, lng] = center
  return [
    [lat + radius, lng - radius], // Top-left
    [lat + radius, lng + radius], // Top-right
    [lat - radius, lng + radius], // Bottom-right
    [lat - radius, lng - radius], // Bottom-left
    [lat + radius, lng - radius], // Close polygon
  ]
}

// Barangay boundaries (created from centroids)
const BARANGAY_BOUNDARIES = {
  'General Paulino Santos': createPolygonFromCenter(BARANGAY_COORDINATES['General Paulino Santos']),
  'Zone II': createPolygonFromCenter(BARANGAY_COORDINATES['Zone II']),
  'Santa Cruz': createPolygonFromCenter(BARANGAY_COORDINATES['Santa Cruz']),
  'Sto. Niño': createPolygonFromCenter(BARANGAY_COORDINATES['Sto. Niño']),
  'Morales': createPolygonFromCenter(BARANGAY_COORDINATES['Morales']),
}

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

const getRiskOpacity = (risk) => {
  switch (risk) {
    case 'High':
      return 0.7
    case 'Moderate':
      return 0.5
    case 'Low':
      return 0.3
    default:
      return 0.2
  }
}

const BarangayHeatmap = () => {
  const [barangayRisks, setBarangayRisks] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllPredictions()
  }, [])

  const fetchAllPredictions = async () => {
    try {
      setLoading(true)
      const predictions = await getAllBarangayPredictions()
      const risks = {}
      
      // Get current week's risk for each barangay
      Object.keys(predictions).forEach(barangay => {
        if (predictions[barangay].full_forecast && predictions[barangay].full_forecast.length > 0) {
          risks[barangay] = predictions[barangay].full_forecast[0].risk
        } else {
          risks[barangay] = 'Unknown'
        }
      })
      
      setBarangayRisks(risks)
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading heatmap...</p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={KORONADAL_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {Object.keys(BARANGAY_BOUNDARIES).map((barangay) => {
            const risk = barangayRisks[barangay] || 'Unknown'
            const fillColor = getRiskColor(risk)
            const fillOpacity = getRiskOpacity(risk)
            
            return (
              <Polygon
                key={barangay}
                positions={BARANGAY_BOUNDARIES[barangay]}
                pathOptions={{
                  color: fillColor,
                  fillColor: fillColor,
                  fillOpacity: fillOpacity,
                  weight: 3,
                }}
              >
                <Tooltip permanent direction="center" className="custom-tooltip">
                  <div className="text-center">
                    <div className="font-bold text-sm">{barangay}</div>
                    <div className={`text-xs font-semibold ${
                      risk === 'High' ? 'text-red-600' :
                      risk === 'Moderate' ? 'text-yellow-600' :
                      risk === 'Low' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {risk} Risk
                    </div>
                  </div>
                </Tooltip>
                <Popup className="bg-white text-gray-900 border border-gray-300 rounded-lg shadow-lg">
                  <div className="text-center p-3 min-w-[200px]">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{barangay}</h3>
                    <div className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-sm mb-2 ${
                      risk === 'High' ? 'bg-red-100 text-red-800' :
                      risk === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      risk === 'Low' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {risk === 'High' ? '🔴' : risk === 'Moderate' ? '🟠' : risk === 'Low' ? '🟢' : '⚪'} {risk} Risk
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Click to view detailed forecast
                    </p>
                  </div>
                </Popup>
              </Polygon>
            )
          })}
        </MapContainer>
      )}
    </div>
  )
}

export default BarangayHeatmap
