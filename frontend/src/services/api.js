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

export const reportCase = async (barangay, date, symptoms = null) => {
  const response = await api.post('/report-case', null, {
    params: {
      barangay,
      date,
      symptoms,
    },
  })
  return response.data
}

export default api

