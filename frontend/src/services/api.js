import axios from 'axios'
import { getCurrentWeather } from './weather'

// Detect if we're in production (Vercel)
const isProduction = import.meta.env.PROD
// Use environment variable or default to Render backend
// Always have a fallback URL to prevent empty baseURL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://denguess-backend.onrender.com'

// API Configuration - Version 2.0 (Updated timeout to 90s)
const API_TIMEOUT = 90000 // 90 seconds - backend needs time to wake up from sleep

console.log('[API] Base URL:', API_BASE_URL || 'NOT SET - using default')
console.log('[API] Environment:', isProduction ? 'Production' : 'Development')
console.log('[API] Timeout:', API_TIMEOUT, 'ms')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT, // 90 seconds - backend needs time to wake up from sleep
})

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('[API] Backend connection failed. Is the server running on', API_BASE_URL, '?')
      console.error('[API] Error details:', error.message)
    } else if (error.response) {
      console.error('[API] Response error:', error.response.status, error.response.data)
    } else {
      console.error('[API] Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export const getBarangays = async () => {
  const response = await api.get('/barangays')
  const barangays = response?.data?.barangays
  return Array.isArray(barangays) ? barangays : []
}

export const predictDengueRisk = async (barangay, climate, date) => {
  const response = await api.post('/predict', {
    barangay,
    climate,
    date,
  })
  return response.data
}

export const uploadClimateData = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/upload/climate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const uploadDengueData = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/upload/dengue', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const listUploads = async () => {
  const response = await api.get('/uploads')
  return response.data.uploads
}

export const getCaseReports = async () => {
  const response = await api.get('/case-reports')
  return response.data
}

export const reportCase = async (barangay, reportData) => {
  const response = await api.post('/report-case', {
    barangay,
    ...reportData,
  })
  return response.data
}

export const retrainModel = async () => {
  const response = await api.post('/model/retrain')
  return response.data
}

export const predictBatch = async (requests) => {
  const response = await api.post('/predict/batch', requests)
  return response.data
}

export const getWeeklyPredictions = async (barangay, startDate) => {
  // Use the new endpoint if available, otherwise fallback to old method
  try {
    // Get real-time weather data for accurate predictions
    const weatherData = await getCurrentWeather()
    const response = await api.get(`/predict/weekly/${encodeURIComponent(barangay)}`, {
      params: { 
        start_date: startDate,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        rainfall: weatherData.rainfall || 0
      }
    })
    return response.data
  } catch (err) {
    // Fallback to old method - use real-time weather data for accuracy
    const weatherData = await getCurrentWeather()
    const climate = {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      rainfall: weatherData.rainfall || 0
    }
    
    const response = await predictDengueRisk(barangay, climate, startDate)
    
    // Transform to the requested format
    const weekly_predictions = {}
    if (response.weekly_forecast) {
      response.weekly_forecast.forEach((week, index) => {
        // Calculate date for each week
        const weekDate = new Date(startDate)
        weekDate.setDate(weekDate.getDate() + (index * 7))
        const dateKey = weekDate.toISOString().split('T')[0]
        weekly_predictions[dateKey] = week.risk
      })
    }
    
    return {
      barangay,
      weekly_predictions
    }
  }
}

export const getInsights = async () => {
  const response = await api.get('/insights')
  return response.data
}

// Cache for predictions to avoid repeated API calls
let predictionsCache = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Check if backend is healthy
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health', { timeout: 10000 }) // Increased to 10 seconds
    return response.data?.status === 'healthy'
  } catch (err) {
    console.warn('Backend health check failed:', err.message)
    // If backend is sleeping, it might take longer - don't fail immediately
    return false
  }
}

// Optimized function to get all barangay predictions at once (faster for heatmap)
export const getAllBarangayPredictionsOptimized = async () => {
  try {
    // Check cache first
    if (predictionsCache && cacheTimestamp) {
      const cacheAge = Date.now() - cacheTimestamp
      if (cacheAge < CACHE_DURATION) {
        console.log('Using cached predictions')
        return predictionsCache
      }
    }

    const startDate = new Date().toISOString().split('T')[0]
    
    // Get weather data
    let weatherData
    try {
      weatherData = await getCurrentWeather()
    } catch (weatherErr) {
      console.warn('Error fetching weather, using defaults:', weatherErr)
      weatherData = {
        temperature: 28.0,
        humidity: 75.0,
        rainfall: 100.0
      }
    }
    
    const climate = {
      temperature: weatherData.temperature || 28.0,
      humidity: weatherData.humidity || 75.0,
      rainfall: weatherData.rainfall || 0
    }

    // Try the optimized batch endpoint first
    try {
      const response = await api.post('/predict/all-barangays', {
        climate,
        date: startDate
      }, { timeout: 60000 })
      
      if (response.data && response.data.predictions) {
        const predictionsObj = {}
        Object.keys(response.data.predictions).forEach(barangay => {
          const pred = response.data.predictions[barangay]
          // Validate and sanitize forecast data
          const forecast = (pred.weekly_forecast || []).map(week => {
            // Ensure risk is always valid (Low, Moderate, or High)
            let risk = week.risk
            if (!risk || risk === 'Unknown' || (risk !== 'Low' && risk !== 'Moderate' && risk !== 'High')) {
              risk = 'Moderate'
            }
            return {
              ...week,
              risk: risk
            }
          })
          predictionsObj[barangay] = {
            barangay,
            full_forecast: forecast
          }
        })
        
        // Update cache
        predictionsCache = predictionsObj
        cacheTimestamp = Date.now()
        return predictionsObj
      }
    } catch (batchErr) {
      console.warn('Batch endpoint failed, falling back to individual requests:', batchErr.message)
      // Fall through to individual requests
    }

    // Fallback to individual requests if batch endpoint fails
    return await getAllBarangayPredictions(false) // Don't use cache since we're already checking
  } catch (err) {
    console.error('Error in optimized predictions:', err)
    // Return cached data if available
    if (predictionsCache) {
      return predictionsCache
    }
    // Return fallback - use hardcoded list if getBarangays fails
    let barangays
    try {
      barangays = await getBarangays()
    } catch (err) {
      console.warn('Error getting barangays for fallback, using hardcoded list:', err)
      barangays = ['General Paulino Santos', 'Morales', 'Santa Cruz', 'Sto. Niño', 'Zone II']
    }
    
    // Ensure barangays is an array
    if (!Array.isArray(barangays) || barangays.length === 0) {
      barangays = ['General Paulino Santos', 'Morales', 'Santa Cruz', 'Sto. Niño', 'Zone II']
    }
    
    const fallback = {}
    barangays.forEach(barangay => {
      fallback[barangay] = {
        barangay,
        full_forecast: [{
          week: 'Current Week',
          risk: 'Moderate',
          probability: 0.45,
          outbreak_probability: 0.45,
          climate_used: {
            rainfall: 100.0,
            temperature: 28.0,
            humidity: 75.0,
            source: 'fallback'
          }
        }]
      }
    })
    return fallback
  }
}

export const getAllBarangayPredictions = async (useCache = true) => {
  try {
    // Check cache first
    if (useCache && predictionsCache && cacheTimestamp) {
      const cacheAge = Date.now() - cacheTimestamp
      if (cacheAge < CACHE_DURATION) {
        console.log('Using cached predictions')
        return predictionsCache
      }
    }

    // Check backend health first
    const isHealthy = await checkBackendHealth()
    if (!isHealthy) {
      console.warn('Backend not healthy, using fallback predictions')
      // Return cached data if available, otherwise fallback
      if (predictionsCache) {
        return predictionsCache
      }
    }

    const barangays = await getBarangays()
    const startDate = new Date().toISOString().split('T')[0]
    
    // Use real-time weather data for accurate predictions (same as barangay pages)
    let weatherData
    try {
      weatherData = await getCurrentWeather()
    } catch (weatherErr) {
      console.warn('Error fetching weather, using defaults:', weatherErr)
      // Use default climate values if weather fetch fails
      weatherData = {
        temperature: 28.0,
        humidity: 75.0,
        rainfall: 100.0
      }
    }
    
    const climate = {
      temperature: weatherData.temperature || 28.0,
      humidity: weatherData.humidity || 75.0,
      rainfall: weatherData.rainfall || 0  // Use 0 if rainfall is not available
    }
    
    // Retry function for individual predictions with better error handling
    const predictWithRetry = async (barangay, retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await predictDengueRisk(barangay, climate, startDate)
          if (response && response.weekly_forecast && response.weekly_forecast.length > 0) {
            return {
              barangay,
              full_forecast: response.weekly_forecast
            }
          }
          // If response is empty, retry
          if (attempt < retries) {
            console.warn(`Empty forecast for ${barangay}, retrying (attempt ${attempt}/${retries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
            continue
          }
        } catch (err) {
          console.error(`Error fetching prediction for ${barangay} (attempt ${attempt}/${retries}):`, err.message)
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
            continue
          }
        }
      }
      // If all retries failed, return a fallback forecast
      console.warn(`All retries failed for ${barangay}, using fallback forecast`)
      return {
        barangay,
        full_forecast: [{
          week: 'Current Week',
          risk: 'Moderate',
          probability: 0.45,
          outbreak_probability: 0.45,
          climate_used: {
            rainfall: climate.rainfall,
            temperature: climate.temperature,
            humidity: climate.humidity,
            source: 'fallback'
          }
        }]
      }
    }
    
    // Process predictions in parallel with concurrency limit for better performance
    const BATCH_SIZE = 3 // Process 3 at a time to avoid overwhelming the backend
    const results = []
    
    for (let i = 0; i < barangays.length; i += BATCH_SIZE) {
      const batch = barangays.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map(barangay => predictWithRetry(barangay))
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    // Convert to object keyed by barangay name
    const predictionsObj = {}
    results.forEach(result => {
      if (result && result.barangay) {
        predictionsObj[result.barangay] = result
      }
    })
    
    // Ensure all barangays have predictions
    barangays.forEach(barangay => {
      if (!predictionsObj[barangay] || !predictionsObj[barangay].full_forecast || predictionsObj[barangay].full_forecast.length === 0) {
        console.warn(`Missing prediction for ${barangay}, adding fallback`)
        predictionsObj[barangay] = {
          barangay,
          full_forecast: [{
            week: 'Current Week',
            risk: 'Moderate',
            probability: 0.45,
            outbreak_probability: 0.45,
            climate_used: {
              rainfall: climate.rainfall,
              temperature: climate.temperature,
              humidity: climate.humidity,
              source: 'fallback'
            }
          }]
        }
      }
    })
    
    // Update cache
    predictionsCache = predictionsObj
    cacheTimestamp = Date.now()
    
    return predictionsObj
  } catch (err) {
    console.error('Error fetching all predictions:', err)
    // Return cached data if available
    if (predictionsCache) {
      console.log('Returning cached predictions due to error')
      return predictionsCache
    }
    // Return fallback for all barangays
    try {
      const barangays = await getBarangays()
      const fallback = {}
      barangays.forEach(barangay => {
        fallback[barangay] = {
          barangay,
          full_forecast: [{
            week: 'Current Week',
            risk: 'Moderate',
            probability: 0.45,
            outbreak_probability: 0.45,
            climate_used: {
              rainfall: 100.0,
              temperature: 28.0,
              humidity: 75.0,
              source: 'fallback'
            }
          }]
        }
      })
      return fallback
    } catch (fallbackErr) {
      console.error('Error creating fallback:', fallbackErr)
      return {}
    }
  }
}

export default api
