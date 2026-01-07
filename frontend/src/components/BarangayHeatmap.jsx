import { MapContainer, TileLayer, Polygon, Popup, Tooltip } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAllBarangayPredictionsOptimized } from '../services/api'
import { fetchBarangayBoundaries, getBarangayCentroids } from '../data/barangayBoundaries'

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

// Barangay names
const BARANGAY_NAMES = [
  'General Paulino Santos',
  'Zone II',
  'Santa Cruz',
  'Sto. Niño',
  'Morales',
]

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
  const [barangayBoundaries, setBarangayBoundaries] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingBoundaries, setLoadingBoundaries] = useState(true)

  const fetchBoundaries = async () => {
    try {
      setLoadingBoundaries(true)
      const boundaries = await fetchBarangayBoundaries()
      setBarangayBoundaries(boundaries)
    } catch (error) {
      console.error('Error fetching boundaries:', error)
      // Fallback to approximate boundaries
      const { getApproximateBoundaries } = await import('../data/barangayBoundaries')
      setBarangayBoundaries(getApproximateBoundaries())
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
      
      // Get current week's risk for each barangay - ensure we always have a valid risk
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
        // Final fallback - use hardcoded list
        const fallbackRisks = {}
        BARANGAY_NAMES.forEach(barangay => {
          fallbackRisks[barangay] = 'Moderate'
        })
        setBarangayRisks(fallbackRisks)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllPredictions()
    fetchBoundaries()
    
    // Refresh predictions when weather updates (every 5 minutes like barangay pages)
    const interval = setInterval(() => {
      fetchAllPredictions()
    }, 300000) // 5 minutes, same as barangay pages

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
      {(loading || loadingBoundaries) ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600 font-semibold">
              {loadingBoundaries ? 'Loading barangay boundaries...' : 'Loading heatmap...'}
            </p>
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
          {BARANGAY_NAMES.map((barangay) => {
            // Ensure we always have a valid risk value - never Unknown
            let risk = barangayRisks[barangay]
            if (!risk || risk === 'Unknown' || risk === '' || (risk !== 'Low' && risk !== 'Moderate' && risk !== 'High')) {
              risk = 'Moderate'
            }
            const fillColor = getRiskColor(risk)
            const fillOpacity = getRiskOpacity(risk)
            const boundaries = barangayBoundaries[barangay]
            
            if (!boundaries || boundaries.length === 0) {
              return null
            }
            
            return (
              <Polygon
                key={barangay}
                positions={boundaries}
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
