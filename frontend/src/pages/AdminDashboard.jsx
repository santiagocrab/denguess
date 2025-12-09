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
  const [analytics, setAnalytics] = useState(null)
  const [loadingReports, setLoadingReports] = useState(false)
  const [showCaseReports, setShowCaseReports] = useState(false)

  useEffect(() => {
    fetchUploads()
    fetchCaseReports()
  }, [])

  const fetchUploads = async () => {
    try {
      const data = await listUploads()
      setUploads(data)
    } catch (err) {
      console.error('Error fetching uploads:', err)
    }
  }

  const fetchCaseReports = async () => {
    setLoadingReports(true)
    try {
      const data = await getCaseReports()
      setCaseReports(data.reports || [])
      setAnalytics(data.analytics || null)
    } catch (err) {
      console.error('Error fetching case reports:', err)
      setMessage({ type: 'error', text: `Failed to load case reports: ${err.message}` })
    } finally {
      setLoadingReports(false)
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

  const formatReportDate = (dateStr, timeStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':')
      date.setHours(parseInt(hours), parseInt(minutes))
    }
    return date.toLocaleString()
  }

  const getSymptomLabel = (key) => {
    const labels = {
      fever: 'Fever (2-7 days)',
      headache: 'Headache / Eye Pain',
      musclePain: 'Muscle or Joint Pain',
      rash: 'Rash',
      nausea: 'Nausea / Vomiting',
      abdominalPain: 'Abdominal Pain',
      bleeding: 'Bleeding Signs'
    }
    return labels[key] || key
  }

  const getActionLabel = (key) => {
    const labels = {
      referredToFacility: 'Referred to Facility',
      advisedMonitoring: 'Advised Monitoring',
      notifiedFamily: 'Notified Family'
    }
    return labels[key] || key
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Upload and manage dengue prediction data</p>
        </div>

        {/* Heatmap Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Dengue Risk Heatmap</h2>
          <p className="text-gray-600 mb-6">Real-time dengue risk visualization across all barangays in Koronadal City</p>
          <BarangayHeatmap />
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

        {/* Case Reports Section */}
        <div className="mt-8 bg-white rounded-xl p-8 shadow-lg border border-gray-200 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Case Reports</h2>
              <p className="text-gray-600 mt-1">View and analyze all reported dengue cases</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchCaseReports}
                disabled={loadingReports}
                className="text-green-600 hover:text-green-700 text-sm font-semibold transition-colors disabled:text-gray-400"
              >
                {loadingReports ? 'Loading...' : '🔄 Refresh'}
              </button>
              <button
                onClick={() => setShowCaseReports(!showCaseReports)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                {showCaseReports ? 'Hide Reports' : 'Show Reports'}
              </button>
            </div>
          </div>

          {loadingReports ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading case reports...</p>
            </div>
          ) : analytics ? (
            <>
              {/* Analytics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="text-sm font-semibold text-blue-900">Total Reports</div>
                  <div className="text-3xl font-bold text-blue-700">{analytics.total_reports}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                  <div className="text-sm font-semibold text-red-900">High Risk</div>
                  <div className="text-3xl font-bold text-red-700">{analytics.by_risk.red}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                  <div className="text-sm font-semibold text-yellow-900">Moderate Risk</div>
                  <div className="text-3xl font-bold text-yellow-700">{analytics.by_risk.yellow}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="text-sm font-semibold text-green-900">Low Risk</div>
                  <div className="text-3xl font-bold text-green-700">{analytics.by_risk.green}</div>
                </div>
              </div>

              {/* Analytics Charts */}
              {showCaseReports && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Reports by Barangay */}
                  <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Reports by Barangay</h3>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: Object.keys(analytics.by_barangay),
                          datasets: [{
                            label: 'Number of Reports',
                            data: Object.values(analytics.by_barangay),
                            backgroundColor: '#ef4444',
                            borderColor: '#dc2626',
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            y: { beginAtZero: true, ticks: { stepSize: 1 } }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Risk Classification Distribution */}
                  <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Classification</h3>
                    <div className="h-64">
                      <Doughnut
                        data={{
                          labels: ['High Risk', 'Moderate Risk', 'Low Risk'],
                          datasets: [{
                            data: [
                              analytics.by_risk.red,
                              analytics.by_risk.yellow,
                              analytics.by_risk.green
                            ],
                            backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Symptoms Distribution */}
                  <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Symptoms Reported</h3>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: Object.keys(analytics.by_symptoms).map(getSymptomLabel),
                          datasets: [{
                            label: 'Cases',
                            data: Object.values(analytics.by_symptoms),
                            backgroundColor: '#3b82f6',
                            borderColor: '#2563eb',
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            x: { beginAtZero: true, ticks: { stepSize: 1 } }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions Taken */}
                  <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Actions Taken</h3>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: Object.keys(analytics.by_action).map(getActionLabel),
                          datasets: [{
                            label: 'Cases',
                            data: Object.values(analytics.by_action),
                            backgroundColor: '#10b981',
                            borderColor: '#059669',
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            x: { beginAtZero: true, ticks: { stepSize: 1 } }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Case Reports Table */}
              {showCaseReports && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">All Case Reports ({caseReports.length})</h3>
                  {caseReports.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No case reports yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date Reported</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Patient Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Age/Sex</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Barangay</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Risk</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Symptoms</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reported By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {caseReports.map((report, index) => {
                            const symptoms = report.symptoms || {}
                            const activeSymptoms = Object.entries(symptoms)
                              .filter(([_, present]) => present)
                              .map(([key]) => getSymptomLabel(key))
                            
                            const riskClass = report.riskClassification || {}
                            let riskLevel = 'N/A'
                            let riskColor = 'gray'
                            if (riskClass.red) { riskLevel = 'High'; riskColor = 'red' }
                            else if (riskClass.yellow) { riskLevel = 'Moderate'; riskColor = 'yellow' }
                            else if (riskClass.green) { riskLevel = 'Low'; riskColor = 'green' }

                            const actions = report.actionTaken || {}
                            const actionsTaken = Object.entries(actions)
                              .filter(([_, taken]) => taken)
                              .map(([key]) => getActionLabel(key))

                            return (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {formatReportDate(report.dateReported, report.timeReported)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {report.name || 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {report.age || 'N/A'} / {report.sex || 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {report.barangay || report.address || 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                    riskColor === 'red' ? 'bg-red-100 text-red-800' :
                                    riskColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                    riskColor === 'green' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {riskLevel}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {activeSymptoms.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {activeSymptoms.slice(0, 2).map((symptom, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                          {symptom}
                                        </span>
                                      ))}
                                      {activeSymptoms.length > 2 && (
                                        <span className="text-xs text-gray-500">+{activeSymptoms.length - 2} more</span>
                                      )}
                                    </div>
                                  ) : 'None'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {report.reportedBy || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {actionsTaken.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {actionsTaken.map((action, i) => (
                                        <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                          {action}
                                        </span>
                                      ))}
                                    </div>
                                  ) : 'None'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No case reports data available</p>
          )}
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
            <li>Case reports are submitted by users from barangay pages and can be viewed in the Case Reports section above</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
