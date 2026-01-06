import axios from 'axios'
import { getCurrentWeather } from './weather'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
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
  return response.data.barangays
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

export const getAllBarangayPredictions = async () => {
  try {
    const barangays = await getBarangays()
    const startDate = new Date().toISOString().split('T')[0]
    
    // Use real-time weather data for accurate predictions (same as barangay pages)
    const weatherData = await getCurrentWeather()
    const climate = {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      rainfall: weatherData.rainfall || 0  // Use 0 if rainfall is not available
    }
    
    const predictionsPromises = barangays.map(async (barangay) => {
      try {
        const response = await predictDengueRisk(barangay, climate, startDate)
        return {
          barangay,
          full_forecast: response.weekly_forecast || []
        }
      } catch (err) {
        console.error(`Error fetching prediction for ${barangay}:`, err)
        return {
          barangay,
          full_forecast: []
        }
      }
    })
    
    const results = await Promise.all(predictionsPromises)
    
    // Convert to object keyed by barangay name
    const predictionsObj = {}
    results.forEach(result => {
      predictionsObj[result.barangay] = result
    })
    
    return predictionsObj
  } catch (err) {
    console.error('Error fetching all predictions:', err)
    return {}
  }
}

export default api
