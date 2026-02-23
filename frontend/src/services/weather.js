// Weather service for real-time climate data
// Coordinates for Koronadal City, South Cotabato, Philippines
const KORONADAL_COORDS = {
  lat: 6.5031,
  lon: 124.8470
}

// Get current weather from OpenWeatherMap (live data only)
export const getCurrentWeather = async () => {
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
  if (!API_KEY) {
    throw new Error('Missing VITE_WEATHER_API_KEY for OpenWeatherMap')
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${KORONADAL_COORDS.lat}&lon=${KORONADAL_COORDS.lon}&appid=${API_KEY}&units=metric`
  )

  if (!response.ok) {
    throw new Error(`OpenWeatherMap error: ${response.status}`)
  }

  const data = await response.json()
  const windSpeed = data.wind?.speed ? (data.wind.speed * 3.6) : 0 // Convert m/s to kph

  const rain1h = data.rain?.['1h']
  const rain3h = data.rain?.['3h']
  const snow1h = data.snow?.['1h']
  const snow3h = data.snow?.['3h']

  let rainfall = 0
  let rainfallPeriodHours = 1

  if (typeof rain1h === 'number' || typeof snow1h === 'number') {
    rainfall = (rain1h || 0) + (snow1h || 0)
    rainfallPeriodHours = 1
  } else if (typeof rain3h === 'number' || typeof snow3h === 'number') {
    rainfall = (rain3h || 0) + (snow3h || 0)
    rainfallPeriodHours = 3
  }

  return {
    temperature: Math.round(data.main.temp * 10) / 10,
    humidity: data.main.humidity,
    rainfall: Math.round(rainfall * 10) / 10,
    rainfallPeriodHours,
    windSpeed: Math.round(windSpeed * 10) / 10,
    condition: data.weather[0]?.main || 'Clear',
    icon: data.weather[0]?.icon || '01d',
    observedAt: data.dt ? new Date(data.dt * 1000).toISOString() : new Date().toISOString(),
    location: 'Koronadal City, South Cotabato',
    source: 'OpenWeatherMap'
  }
}

// Get 7-day forecast
export const getForecast = async () => {
  try {
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
    if (!API_KEY) {
      throw new Error('Missing VITE_WEATHER_API_KEY for OpenWeatherMap')
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${KORONADAL_COORDS.lat}&lon=${KORONADAL_COORDS.lon}&appid=${API_KEY}&units=metric&cnt=40`
    )

    if (!response.ok) {
      throw new Error(`OpenWeatherMap forecast error: ${response.status}`)
    }

    const data = await response.json()
    // Group forecast into daily aggregates for more realistic values
    const dayBuckets = new Map()
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000)
      const dateKey = date.toDateString()
      if (!dayBuckets.has(dateKey)) {
        dayBuckets.set(dateKey, [])
      }
      dayBuckets.get(dateKey).push(item)
    })

    const dailyForecasts = Array.from(dayBuckets.entries())
      .slice(0, 5) // Free OpenWeather forecast provides 5-day horizon
      .map(([dateKey, items]) => {
        const temps = items.map((i) => i.main.temp)
        const humidities = items.map((i) => i.main.humidity)
        const winds = items.map((i) => (i.wind?.speed || 0) * 3.6)
        const totalRain = items.reduce((sum, i) => sum + (i.rain?.['3h'] || 0), 0)

        // Pick the most frequent condition for the day
        const conditionCounts = {}
        items.forEach((i) => {
          const c = i.weather?.[0]?.main || 'Clear'
          conditionCounts[c] = (conditionCounts[c] || 0) + 1
        })
        const condition = Object.keys(conditionCounts).sort((a, b) => conditionCounts[b] - conditionCounts[a])[0] || 'Clear'
        const icon = items[0]?.weather?.[0]?.icon || '01d'

        return {
          date: new Date(items[0].dt * 1000),
          dateKey,
          temp: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10,
          tempMin: Math.round(Math.min(...temps) * 10) / 10,
          tempMax: Math.round(Math.max(...temps) * 10) / 10,
          humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
          rainfall: Math.round(totalRain * 10) / 10,
          condition,
          icon,
          windSpeed: Math.round((winds.reduce((a, b) => a + b, 0) / winds.length) * 10) / 10
        }
      })

    return dailyForecasts
  } catch (error) {
    console.error('Error fetching forecast:', error)
    return []
  }
}

// Auto-update weather every 15 minutes
export const subscribeToWeatherUpdates = (callback, intervalMs = 900000, onError) => {
  const run = () => {
    getCurrentWeather()
      .then(callback)
      .catch((error) => {
        if (onError) {
          onError(error)
        }
      })
  }

  run()
  const interval = setInterval(() => {
    run()
  }, intervalMs)
  return () => clearInterval(interval)
}
