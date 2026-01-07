import { useState, useEffect } from 'react'
import { uploadClimateData, uploadDengueData, listUploads, retrainModel, getCaseReports } from '../services/api'
import { Bar, Doughnut } from 'react-chartjs-2'
import BarangayHeatmap from '../components/BarangayHeatmap'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const AdminDashboard = () => {
  const [climateFile, setClimateFile] = useState(null)
  const [dengueFile, setDengueFile] = useState(null)
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(false)
  const [retraining, setRetraining] = useState(false)
  const [autoRetrain, setAutoRetrain] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [caseReports, setCaseReports] = useState([])
  const [caseReportsLoading, setCaseReportsLoading] = useState(false)
  const [caseReportsAnalytics, setCaseReportsAnalytics] = useState(null)

  useEffect(() => {
    // Debug: Log when admin dashboard loads
    console.log('Admin Dashboard loaded at path:', window.location.pathname)
    fetchUploads()
    fetchCaseReports()
    
    // Auto-refresh case reports every 5 seconds (silent refresh, no loading indicator)
    const interval = setInterval(() => {
      fetchCaseReports(false)
    }, 5000)
    
    return () => clearInterval(interval)
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
      
      // Auto-trigger retraining if enabled
      if (autoRetrain) {
        await handleAutoRetrain()
      }
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
      
      // Auto-trigger retraining if enabled
      if (autoRetrain) {
        await handleAutoRetrain()
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Upload failed: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleAutoRetrain = async () => {
    setRetraining(true)
    setMessage({ type: 'info', text: 'Auto-retraining model with new data... This may take a few minutes.' })
    try {
      const result = await retrainModel()
      setMessage({ 
        type: 'success', 
        text: `Model retrained successfully! ${result.message}` 
      })
    } catch (err) {
      setMessage({ 
        type: 'warning', 
        text: `Upload successful, but retraining failed: ${err.message}. You can retrain manually.` 
      })
    } finally {
      setRetraining(false)
    }
  }

  const handleRetrainModel = async () => {
    if (!window.confirm('This will retrain the model with the latest data. This may take a few minutes. Continue?')) {
      return
    }

    setRetraining(true)
    setMessage({ type: '', text: '' })
    try {
      const result = await retrainModel()
      setMessage({ type: 'success', text: `Model retrained successfully! ${result.message}` })
    } catch (err) {
      setMessage({ type: 'error', text: `Retraining failed: ${err.message}` })
    } finally {
      setRetraining(false)
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

  const fetchCaseReports = async (showLoading = true) => {
    if (showLoading) {
      setCaseReportsLoading(true)
    }
    try {
      const data = await getCaseReports()
      setCaseReports(data.reports || [])
      setCaseReportsAnalytics(data.analytics || null)
      // Clear any previous error messages if fetch succeeds
      if (message.text && message.text.includes('case reports')) {
        setMessage({ type: '', text: '' })
      }
    } catch (err) {
      console.error('Error fetching case reports:', err)
      // Only show error message if it's a manual refresh, not auto-refresh
      if (showLoading) {
        setMessage({ type: 'error', text: `Failed to load case reports: ${err.message}` })
      }
    } finally {
      if (showLoading) {
        setCaseReportsLoading(false)
      }
    }
  }

  const getRiskBadge = (report) => {
    const risk = report.riskClassification || {}
    if (risk.red) return { text: 'High Risk', class: 'bg-red-100 text-red-800 border-red-300' }
    if (risk.yellow) return { text: 'Moderate Risk', class: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
    if (risk.green) return { text: 'Low Risk', class: 'bg-green-100 text-green-800 border-green-300' }
    return { text: 'Not Classified', class: 'bg-gray-100 text-gray-800 border-gray-300' }
  }

  const getSymptomsList = (symptoms) => {
    if (!symptoms) return 'None'
    const symptomNames = {
      fever: 'Fever',
      headache: 'Headache',
      musclePain: 'Muscle Pain',
      rash: 'Rash',
      nausea: 'Nausea',
      abdominalPain: 'Abdominal Pain',
      bleeding: 'Bleeding'
    }
    const activeSymptoms = Object.entries(symptoms)
      .filter(([_, present]) => present)
      .map(([key, _]) => symptomNames[key] || key)
    return activeSymptoms.length > 0 ? activeSymptoms.join(', ') : 'None'
  }


  return (
    <div className="min-h-screen bg-gray-50 pt-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Upload and manage dengue prediction data</p>
        </div>

        {/* Heatmap Section - Prominent Display */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-300 mb-8 animate-slide-up">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Dengue Risk Heatmap</h2>
            <p className="text-gray-600 text-lg">Real-time dengue risk visualization across all barangays in Koronadal City</p>
            <p className="text-sm text-gray-500 mt-2">Click on any barangay to see detailed risk information</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <BarangayHeatmap />
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-300'
                : message.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-300'
                : message.type === 'warning'
                ? 'bg-yellow-50 text-yellow-800 border-yellow-300'
                : 'bg-blue-50 text-blue-800 border-blue-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Auto-Retrain Toggle */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Auto-Retrain Model</h3>
              <p className="text-sm text-gray-600">
                Automatically retrain the model after uploading new data files
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRetrain}
                onChange={(e) => setAutoRetrain(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
          <button
            onClick={handleRetrainModel}
            disabled={retraining}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-md"
          >
            {retraining ? 'Retraining Model...' : 'Manually Retrain Model Now'}
          </button>
        </div>

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

        {/* Case Reports Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Cases Reported</h2>
              {caseReportsAnalytics && (
                <p className="text-gray-600 mt-1">
                  Total Reports: <span className="font-semibold text-red-600">{caseReportsAnalytics.total_reports}</span>
                  <span className="ml-3 text-xs text-gray-500">(Auto-refreshes every 5 seconds)</span>
                </p>
              )}
            </div>
            <button
              onClick={() => fetchCaseReports(true)}
              disabled={caseReportsLoading}
              className="text-red-600 hover:text-red-700 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {caseReportsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>

          {caseReportsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading case reports...</p>
            </div>
          ) : caseReports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No case reports yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Barangay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Age / Sex
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date Reported
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Symptoms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Reported By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {caseReports.map((report, index) => {
                    const riskBadge = getRiskBadge(report)
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {report.barangay || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {report.age ? `${report.age} / ${report.sex || 'N/A'}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {report.dateReported ? (
                            <div>
                              <div>{new Date(report.dateReported).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">{report.timeReported || ''}</div>
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={getSymptomsList(report.symptoms)}>
                            {getSymptomsList(report.symptoms)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskBadge.class}`}>
                            {riskBadge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {report.reportedBy || 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Analytics Summary */}
          {caseReportsAnalytics && caseReportsAnalytics.total_reports > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Summary Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">By Risk Level</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-red-600">High:</span>
                      <span className="font-semibold">{caseReportsAnalytics.by_risk?.red || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Moderate:</span>
                      <span className="font-semibold">{caseReportsAnalytics.by_risk?.yellow || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Low:</span>
                      <span className="font-semibold">{caseReportsAnalytics.by_risk?.green || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">By Barangay</div>
                  <div className="space-y-1 text-sm max-h-24 overflow-y-auto">
                    {Object.entries(caseReportsAnalytics.by_barangay || {}).map(([barangay, count]) => (
                      <div key={barangay} className="flex justify-between">
                        <span className="truncate mr-2">{barangay}:</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Actions Taken</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Referred to Facility:</span>
                      <span className="font-semibold">{caseReportsAnalytics.by_action?.referredToFacility || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Advised Monitoring:</span>
                      <span className="font-semibold">{caseReportsAnalytics.by_action?.advisedMonitoring || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notified Family:</span>
                      <span className="font-semibold">{caseReportsAnalytics.by_action?.notifiedFamily || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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

        {/* Model Retraining */}
        <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8 border-2 border-red-200 animate-slide-up">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Model Retraining</h3>
              <p className="text-gray-700">
                After uploading new data files, retrain the model to incorporate the latest information and improve prediction accuracy.
              </p>
            </div>
            <button
              onClick={handleRetrainModel}
              disabled={retraining}
              className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg text-lg"
            >
              {retraining ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Retraining...</span>
                </span>
              ) : (
                '🔄 Retrain Model'
              )}
            </button>
          </div>
        </div>


        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl p-8 border border-gray-200 animate-slide-up">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Climate data CSV should have columns: <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">date, rainfall, temperature, humidity</code></li>
            <li>Dengue cases CSV should have columns: <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">date, barangay, cases</code></li>
            <li>Dates should be in YYYY-MM-DD format</li>
            <li>After uploading new data, click "Retrain Model" to update the prediction model with the latest information</li>
            <li>Model retraining may take 1-3 minutes depending on data size</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
