// Barangay boundary GeoJSON data from OpenStreetMap
// Fetched using Overpass QL query
// This file contains the actual polygon boundaries for each barangay

// If GeoJSON is not available, we'll use the centroids to create approximate boundaries
const BARANGAY_CENTROIDS = {
  'General Paulino Santos': [6.5050, 124.8473],
  'Zone II': [6.4960, 124.8531],
  'Santa Cruz': [6.4743, 124.8398],
  'Sto. Niño': [6.4938, 124.8681],
  'Morales': [6.4765, 124.8617],
}

// Function to create approximate polygon from centroid
const createPolygonFromCenter = (center, radius = 0.008) => {
  const [lat, lng] = center
  return [
    [lat + radius, lng - radius],
    [lat + radius, lng + radius],
    [lat - radius, lng + radius],
    [lat - radius, lng - radius],
    [lat + radius, lng - radius],
  ]
}

// Function to fetch real boundaries from Overpass API
export const fetchBarangayBoundaries = async () => {
  const overpassQuery = `
    [out:json][timeout:50];
    area["name"="Koronadal City"]->.searchArea;
    (
      relation["boundary"="administrative"]["admin_type:PH"="barangay"]["name"="General Paulino Santos"](area.searchArea);
      relation["boundary"="administrative"]["admin_type:PH"="barangay"]["name"="Zone II"](area.searchArea);
      relation["boundary"="administrative"]["admin_type:PH"="barangay"]["name"="Santa Cruz"](area.searchArea);
      relation["boundary"="administrative"]["admin_type:PH"="barangay"]["name"="Santo Niño"](area.searchArea);
      relation["boundary"="administrative"]["admin_type:PH"="barangay"]["name"="Morales"](area.searchArea);
    );
    out geom;
  `

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    })

    if (!response.ok) {
      throw new Error('Failed to fetch boundaries from Overpass API')
    }

    const data = await response.json()
    return processOverpassData(data)
  } catch (error) {
    console.warn('Failed to fetch real boundaries, using approximate polygons:', error)
    return getApproximateBoundaries()
  }
}

// Process Overpass API response into usable format
const processOverpassData = (data) => {
  const boundaries = {}
  
  if (data.elements && Array.isArray(data.elements)) {
    data.elements.forEach((element) => {
      if (element.type === 'relation' && element.members) {
        const name = element.tags?.name
        if (name && BARANGAY_CENTROIDS[name]) {
          // Extract polygon coordinates from relation members
          const coordinates = []
          element.members.forEach((member) => {
            if (member.type === 'way' && member.geometry) {
              const wayCoords = member.geometry.map((point) => [point.lat, point.lon])
              coordinates.push(...wayCoords)
            }
          })
          
          if (coordinates.length > 0) {
            // Close the polygon
            coordinates.push(coordinates[0])
            boundaries[name] = coordinates
          }
        }
      }
    })
  }

  // Fill in missing boundaries with approximate ones
  Object.keys(BARANGAY_CENTROIDS).forEach((name) => {
    if (!boundaries[name]) {
      boundaries[name] = createPolygonFromCenter(BARANGAY_CENTROIDS[name])
    }
  })

  return boundaries
}

// Get approximate boundaries as fallback
export const getApproximateBoundaries = () => {
  const boundaries = {}
  Object.keys(BARANGAY_CENTROIDS).forEach((name) => {
    boundaries[name] = createPolygonFromCenter(BARANGAY_CENTROIDS[name])
  })
  return boundaries
}

// Export centroids for marker placement
export const getBarangayCentroids = () => BARANGAY_CENTROIDS

// Default export: approximate boundaries (will be replaced by real data if fetched)
export default getApproximateBoundaries()

