// Weather service for real-time climate data
// Coordinates for Koronadal City, South Cotabato, Philippines
const KORONADAL_COORDS = {
  lat: 6.5031,
  lon: 124.8470
}

// Get current weather from OpenWeatherMap or fallback to simulated
export const getCurrentWeather = async () => {
  try {
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
    
    if (API_KEY) {
      // Use OpenWeatherMap API
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${KORONADAL_COORDS.lat}&lon=${KORONADAL_COORDS.lon}&appid=${API_KEY}&units=metric`
      )
      
      if (response.ok) {
        const data = await response.json()
        const windSpeed = data.wind?.speed ? (data.wind.speed * 3.6) : 0 // Convert m/s to kph
        
        return {
          temperature: Math.round(data.main.temp * 10) / 10,
          humidity: data.main.humidity,
          rainfall: data.rain ? (data.rain['1h'] || 0) : 0,
          windSpeed: Math.round(windSpeed * 10) / 10,
          condition: data.weather[0]?.main || 'Clear',
          icon: data.weather[0]?.icon || '01d',
          timestamp: new Date().toISOString(),
          location: 'Koronadal City, South Cotabato',
          source: 'OpenWeatherMap'
        }
      }
    }
    
    // Fallback to simulated realistic data
    return getSimulatedWeather()
  } catch (error) {
    console.error('Error fetching weather:', error)
    return getSimulatedWeather()
  }
}

// Simulated weather data (fallback)
const getSimulatedWeather = () => {
  const now = new Date()
  const hour = now.getHours()
  const month = now.getMonth()
  
  const baseTemp = 27.5
  const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * 3
  const seasonalTemp = month >= 3 && month <= 5 ? 1.5 : 0
  const temperature = baseTemp + tempVariation + seasonalTemp + (Math.random() * 2 - 1)
  
  const baseHumidity = 75
  const humidityVariation = hour >= 18 || hour <= 6 ? 5 : -5
  const seasonalHumidity = month >= 5 && month <= 10 ? 8 : 0
  const humidity = Math.max(50, Math.min(95, baseHumidity + humidityVariation + seasonalHumidity + (Math.random() * 5 - 2.5)))
  
  let rainfall = 0
  let condition = 'Clear'
  if (month >= 5 && month <= 10) {
    const rainChance = hour >= 14 && hour <= 18 ? 0.4 : 0.15
    if (Math.random() < rainChance) {
      rainfall = Math.random() * 150 + 10
      condition = 'Rain'
    }
  } else {
    const rainChance = 0.05
    if (Math.random() < rainChance) {
      rainfall = Math.random() * 50 + 5
      condition = 'Rain'
    }
  }
  
  const windSpeed = 5 + Math.random() * 15 // 5-20 kph
  
  return {
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity),
    rainfall: Math.round(rainfall * 10) / 10,
    windSpeed: Math.round(windSpeed * 10) / 10,
    condition: condition,
    icon: condition === 'Rain' ? '10d' : hour >= 6 && hour < 18 ? '01d' : '01n',
    timestamp: now.toISOString(),
    location: 'Koronadal City, South Cotabato',
    source: 'Simulated'
  }
}

// Get 7-day forecast
export const getForecast = async () => {
  try {
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
    
    if (API_KEY) {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${KORONADAL_COORDS.lat}&lon=${KORONADAL_COORDS.lon}&appid=${API_KEY}&units=metric&cnt=40`
      )
      
      if (response.ok) {
        const data = await response.json()
        // Group by day and get daily forecasts
        const dailyForecasts = []
        const seenDates = new Set()
        
        data.list.forEach(item => {
          const date = new Date(item.dt * 1000)
          const dateKey = date.toDateString()
          
          if (!seenDates.has(dateKey) && dailyForecasts.length < 7) {
            seenDates.add(dateKey)
            dailyForecasts.push({
              date: date,
              dateKey: dateKey,
              temp: Math.round(item.main.temp),
              tempMin: Math.round(item.main.temp_min),
              tempMax: Math.round(item.main.temp_max),
              humidity: item.main.humidity,
              rainfall: item.rain ? (item.rain['3h'] || 0) : 0,
              condition: item.weather[0]?.main || 'Clear',
              icon: item.weather[0]?.icon || '01d',
              windSpeed: item.wind?.speed ? Math.round(item.wind.speed * 3.6) : 0
            })
          }
        })
        
        return dailyForecasts
      }
    }
    
    // Fallback to simulated forecast (based on current weather)
    return getSimulatedForecast()
  } catch (error) {
    console.error('Error fetching forecast:', error)
    return getSimulatedForecast()
  }
}

// Simulated 7-day forecast - matches current weather pattern
const getSimulatedForecast = async () => {
  const forecasts = []
  const now = new Date()
  const month = now.getMonth()
  
  // Get current weather to base forecast on
  const currentWeather = await getCurrentWeather()
  const baseTemp = currentWeather.temperature
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    
    // Temperature variation based on current temp (slight daily variation)
    const tempVariation = (Math.random() * 2 - 1) // -1 to +1 degree variation
    const dailyTemp = baseTemp + tempVariation + (i * 0.1) // Slight trend over week
    
    // Rainfall based on season and current conditions
    let rainfall = 0
    let condition = 'Clear'
    if (month >= 5 && month <= 10) {
      // Rainy season
      const rainChance = 0.3
      if (Math.random() < rainChance) {
        rainfall = Math.random() * 50 + 10
        condition = rainfall > 30 ? 'Rain' : 'Drizzle'
      } else if (Math.random() < 0.4) {
        condition = 'Clouds'
      }
    } else {
      // Dry season
      const rainChance = 0.1
      if (Math.random() < rainChance) {
        rainfall = Math.random() * 20 + 5
        condition = 'Rain'
      } else if (Math.random() < 0.3) {
        condition = 'Clouds'
      }
    }
    
    // Humidity based on current humidity with variation
    const humidityVariation = (Math.random() * 10 - 5)
    const dailyHumidity = Math.max(50, Math.min(95, currentWeather.humidity + humidityVariation))
    
    forecasts.push({
      date: date,
      dateKey: date.toDateString(),
      temp: Math.round(dailyTemp * 10) / 10,
      tempMin: Math.round((dailyTemp - 2) * 10) / 10,
      tempMax: Math.round((dailyTemp + 2) * 10) / 10,
      humidity: Math.round(dailyHumidity),
      rainfall: Math.round(rainfall * 10) / 10,
      condition: condition,
      icon: condition === 'Rain' ? '10d' : condition === 'Clouds' ? '02d' : '01d',
      windSpeed: Math.round((currentWeather.windSpeed + (Math.random() * 5 - 2.5)) * 10) / 10
    })
  }
  
  return forecasts
}

// Auto-update weather every 15 minutes
export const subscribeToWeatherUpdates = (callback, intervalMs = 900000) => {
  getCurrentWeather().then(callback)
  const interval = setInterval(() => {
    getCurrentWeather().then(callback)
  }, intervalMs)
  return () => clearInterval(interval)
}
