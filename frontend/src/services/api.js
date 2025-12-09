import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
    const response = await api.get(`/predict/weekly/${encodeURIComponent(barangay)}`, {
      params: { start_date: startDate }
    })
    return response.data
  } catch (err) {
    // Fallback to old method
    const climate = {
      temperature: 28.0,
      humidity: 75.0,
      rainfall: 100.0
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
    // Import weather service to get current weather (same as barangay pages use)
    const { getCurrentWeather } = await import('./weather')
    
    // Get current weather data (same source as barangay pages)
    const weather = await getCurrentWeather()
    const climate = {
      temperature: weather.temperature,
      humidity: weather.humidity,
      rainfall: weather.rainfall
    }
    
    const barangays = await getBarangays()
    const startDate = new Date().toISOString().split('T')[0]
    
    const predictionsPromises = barangays.map(async (barangay) => {
      try {
        // Use the same climate data and API call as barangay pages
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

