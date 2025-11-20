// Weather service for real-time climate data
// Coordinates for Koronadal City, South Cotabato, Philippines
const KORONADAL_COORDS = {
  lat: 6.5031,
  lon: 124.8470
}

// Simulated realistic weather data based on Koronadal City's climate
// In production, replace with actual weather API (OpenWeatherMap, etc.)
export const getCurrentWeather = async () => {
  try {
    // Option 1: Use OpenWeatherMap API (requires API key)
    // Uncomment and add your API key:
    /*
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${KORONADAL_COORDS.lat}&lon=${KORONADAL_COORDS.lon}&appid=${API_KEY}&units=metric`
    )
    const data = await response.json()
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain['1h'] * 10 : 0, // Convert to mm
      timestamp: new Date().toISOString()
    }
    */

    // Option 2: Simulated realistic data (for demo)
    // Based on Koronadal City's typical climate patterns
    const now = new Date()
    const hour = now.getHours()
    const month = now.getMonth() // 0-11
    
    // Temperature varies by time of day (warmer during day, cooler at night)
    const baseTemp = 27.5
    const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * 3 // -3 to +3
    const seasonalTemp = month >= 3 && month <= 5 ? 1.5 : 0 // Slightly warmer in summer
    const temperature = baseTemp + tempVariation + seasonalTemp + (Math.random() * 2 - 1)
    
    // Humidity is typically higher at night and during rainy season
    const baseHumidity = 75
    const humidityVariation = hour >= 18 || hour <= 6 ? 5 : -5 // Higher at night
    const seasonalHumidity = month >= 5 && month <= 10 ? 8 : 0 // Rainy season (June-October)
    const humidity = Math.max(50, Math.min(95, baseHumidity + humidityVariation + seasonalHumidity + (Math.random() * 5 - 2.5)))
    
    // Rainfall is more likely during rainy season and afternoon
    let rainfall = 0
    if (month >= 5 && month <= 10) { // Rainy season
      const rainChance = hour >= 14 && hour <= 18 ? 0.4 : 0.15 // Higher chance in afternoon
      if (Math.random() < rainChance) {
        rainfall = Math.random() * 150 + 10 // 10-160mm
      }
    } else {
      const rainChance = 0.05 // Low chance in dry season
      if (Math.random() < rainChance) {
        rainfall = Math.random() * 50 + 5 // 5-55mm
      }
    }
    
    return {
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      rainfall: Math.round(rainfall * 10) / 10,
      timestamp: now.toISOString(),
      location: 'Koronadal City, South Cotabato'
    }
  } catch (error) {
    console.error('Error fetching weather:', error)
    // Fallback to default values
    return {
      temperature: 28.0,
      humidity: 75,
      rainfall: 0,
      timestamp: new Date().toISOString(),
      location: 'Koronadal City, South Cotabato'
    }
  }
}

// Auto-update weather every 5 minutes
export const subscribeToWeatherUpdates = (callback, intervalMs = 300000) => {
  // Fetch immediately
  getCurrentWeather().then(callback)
  
  // Then update at intervals
  const interval = setInterval(() => {
    getCurrentWeather().then(callback)
  }, intervalMs)
  
  // Return cleanup function
  return () => clearInterval(interval)
}

