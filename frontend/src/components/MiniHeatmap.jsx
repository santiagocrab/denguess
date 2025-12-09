import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchBarangayBoundaries } from '../data/barangayBoundaries'
import { getAllBarangayPredictions } from '../services/api'

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
      // Use the same prediction API as barangay pages and admin dashboard
      const predictions = await getAllBarangayPredictions()
      const risks = {}
      
      // Get current week's risk for each barangay from ML model predictions
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

  useEffect(() => {
    fetchAllPredictions()
    fetchBoundaries()
    
    // Refresh predictions every 5 minutes (same as barangay pages)
    const interval = setInterval(() => {
      fetchAllPredictions()
    }, 300000)

    return () => clearInterval(interval)
  }, [])

  if (loading || loadingBoundaries) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200 h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
      </div>
    )
  }

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
            
            // Use actual ML model prediction (same as barangay pages)
            const risk = barangayRisks[barangay] || 'Unknown'
            const color = getRiskColor(risk)
            const opacity = risk === 'High' ? 0.7 : risk === 'Moderate' ? 0.5 : 0.3
            
            return (
              <Polygon
                key={barangay}
                positions={boundary}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: opacity,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold text-sm mb-2">{barangay}</h4>
                    <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${
                      risk === 'High' ? 'bg-red-100 text-red-800' :
                      risk === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      risk === 'Low' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {risk === 'High' ? '🔴 High Risk' : risk === 'Moderate' ? '🟡 Moderate Risk' : risk === 'Low' ? '🟢 Low Risk' : '⚪ Unknown'}
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

