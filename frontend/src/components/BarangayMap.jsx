import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

// Approximate coordinates for Koronadal City (you can adjust these)
const KORONADAL_CENTER = [6.5031, 124.8470]

// Simplified polygon boundaries for each barangay
// In production, use actual GeoJSON boundaries
const BARANGAY_BOUNDARIES = {
  'General Paulino Santos': [
    [6.51, 124.84],
    [6.52, 124.84],
    [6.52, 124.85],
    [6.51, 124.85],
  ],
  'Morales': [
    [6.50, 124.84],
    [6.51, 124.84],
    [6.51, 124.85],
    [6.50, 124.85],
  ],
  'Santa Cruz': [
    [6.49, 124.85],
    [6.50, 124.85],
    [6.50, 124.86],
    [6.49, 124.86],
  ],
  'Sto. Niño': [
    [6.50, 124.86],
    [6.51, 124.86],
    [6.51, 124.87],
    [6.50, 124.87],
  ],
  'Zone II': [
    [6.51, 124.85],
    [6.52, 124.85],
    [6.52, 124.86],
    [6.51, 124.86],
  ],
}

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
  const [bounds, setBounds] = useState(BARANGAY_BOUNDARIES[barangay] || BARANGAY_BOUNDARIES['General Paulino Santos'])

  useEffect(() => {
    if (BARANGAY_BOUNDARIES[barangay]) {
      setBounds(BARANGAY_BOUNDARIES[barangay])
    }
  }, [barangay])

  const fillColor = getRiskColor(currentRisk)
  const fillOpacity = 0.5

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
                  currentRisk === 'High' ? 'text-red-600' :
                  currentRisk === 'Moderate' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>{currentRisk || 'Unknown'}</span>
              </p>
            </div>
          </Popup>
        </Polygon>
      </MapContainer>
    </div>
  )
}

export default BarangayMap

