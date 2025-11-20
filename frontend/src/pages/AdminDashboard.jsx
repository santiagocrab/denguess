import { useState, useEffect } from 'react'
import { uploadClimateData, uploadDengueData, listUploads } from '../services/api'

const AdminDashboard = () => {
  const [climateFile, setClimateFile] = useState(null)
  const [dengueFile, setDengueFile] = useState(null)
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      const data = await listUploads()
      setUploads(data)
    } catch (err) {
      console.error('Error fetching uploads:', err)
    }
  }

  const handleClimateUpload = async (e) => {
    e.preventDefault()
    if (!climateFile) {
      setMessage({ type: 'error', text: 'Please select a file' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const result = await uploadClimateData(climateFile)
      setMessage({ type: 'success', text: `Successfully uploaded: ${result.message}` })
      setClimateFile(null)
      fetchUploads()
    } catch (err) {
      setMessage({ type: 'error', text: `Upload failed: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleDengueUpload = async (e) => {
    e.preventDefault()
    if (!dengueFile) {
      setMessage({ type: 'error', text: 'Please select a file' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const result = await uploadDengueData(dengueFile)
      setMessage({ type: 'success', text: `Successfully uploaded: ${result.message}` })
      setDengueFile(null)
      fetchUploads()
    } catch (err) {
      setMessage({ type: 'error', text: `Upload failed: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Upload and manage dengue prediction data</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Upload Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Climate Data Upload */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Climate Data</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload monthly climate data CSV with columns: date, rainfall, temperature, humidity
            </p>
            <form onSubmit={handleClimateUpload}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setClimateFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:border file:border-red-300"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !climateFile}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-md"
              >
                {loading ? 'Uploading...' : 'Upload Climate Data'}
              </button>
            </form>
          </div>

          {/* Dengue Cases Upload */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Dengue Cases Data</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload monthly dengue cases CSV with columns: date, barangay, cases
            </p>
            <form onSubmit={handleDengueUpload}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setDengueFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:border file:border-red-300"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !dengueFile}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-md"
              >
                {loading ? 'Uploading...' : 'Upload Dengue Cases Data'}
              </button>
            </form>
          </div>
        </div>

        {/* Upload History */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Upload History</h2>
            <button
              onClick={fetchUploads}
              className="text-red-600 hover:text-red-700 text-sm font-semibold transition-colors"
            >
              Refresh
            </button>
          </div>
          {uploads.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No uploads yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Uploaded
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploads.map((upload, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {upload.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatFileSize(upload.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(upload.modified)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl p-8 border border-gray-200 animate-slide-up">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Climate data CSV should have columns: <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">date, rainfall, temperature, humidity</code></li>
            <li>Dengue cases CSV should have columns: <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">date, barangay, cases</code></li>
            <li>Dates should be in YYYY-MM-DD format</li>
            <li>After uploading new data, you may need to retrain the model (contact system administrator)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
