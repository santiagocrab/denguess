import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchBarangayBoundaries, getApproximateBoundaries } from '../data/barangayBoundaries'

// Fix for default marker icon in React Leaflet (run once on module load)
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

// Approximate coordinates for Koronadal City center
const KORONADAL_CENTER = [6.4938, 124.8531]

const getRiskColor = (risk) => {
  switch (risk) {
    case 'High':
      return '#ef4444'
    case 'Moderate':
      return '#f59e0b'
    case 'Low':
      return '#10b981'
    default:
      return '#6b7280'
  }
}

const BarangayMap = ({ barangay, currentRisk }) => {
  const [bounds, setBounds] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Validate and sanitize currentRisk - never allow Unknown
  const validatedRisk = (currentRisk === 'Low' || currentRisk === 'Moderate' || currentRisk === 'High') 
    ? currentRisk 
    : 'Moderate'

  useEffect(() => {
    const loadBoundaries = async () => {
      try {
        setLoading(true)
        const boundaries = await fetchBarangayBoundaries()
        if (boundaries[barangay]) {
          setBounds(boundaries[barangay])
        } else {
          // Fallback to approximate
          const approximate = getApproximateBoundaries()
          setBounds(approximate[barangay] || approximate['General Paulino Santos'])
        }
      } catch (error) {
        console.error('Error loading boundaries:', error)
        const approximate = getApproximateBoundaries()
        setBounds(approximate[barangay] || approximate['General Paulino Santos'])
      } finally {
        setLoading(false)
      }
    }
    loadBoundaries()
  }, [barangay])

  const fillColor = getRiskColor(validatedRisk)
  const fillOpacity = 0.5

  if (loading || !bounds) {
    return (
      <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
      <MapContainer
        center={KORONADAL_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polygon
          positions={bounds}
          pathOptions={{
            color: fillColor,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            weight: 4,
          }}
        >
          <Popup className="bg-white text-gray-900 border border-gray-300 rounded-lg shadow-lg">
            <div className="text-center p-2">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{barangay}</h3>
              <p className="text-gray-700">
                Current Risk: <span className={`font-bold ${
                  validatedRisk === 'High' ? 'text-red-600' :
                  validatedRisk === 'Moderate' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>{validatedRisk}</span>
              </p>
            </div>
          </Popup>
        </Polygon>
      </MapContainer>
    </div>
  )
}

export default BarangayMap

