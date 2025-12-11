import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const CaseReportModal = ({ isOpen, onClose, barangay, onSubmit, reportData, setReportData }) => {
  const modalRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(overlayRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.3 }
      )
      gsap.fromTo(modalRef.current,
        { x: '100%', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      )
    } else {
      gsap.to(modalRef.current,
        { x: '100%', opacity: 0, duration: 0.3, ease: 'power3.in' }
      )
      gsap.to(overlayRef.current,
        { opacity: 0, duration: 0.2, delay: 0.1 }
      )
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmit(e)
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">Report Dengue Case</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Details Section */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">1. Patient Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportData.name}
                    onChange={(e) => setReportData({ ...reportData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                    required
                    placeholder="Enter patient name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={reportData.age}
                      onChange={(e) => setReportData({ ...reportData, age: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                      required
                      min="0"
                      max="120"
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sex <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={reportData.sex}
                      onChange={(e) => setReportData({ ...reportData, sex: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address/Barangay <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportData.address}
                    onChange={(e) => setReportData({ ...reportData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                    required
                    placeholder={`${barangay} (or enter specific address)`}
                  />
                </div>
              </div>
            </div>

            {/* Report Information Section */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">2. Report Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Reported <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={reportData.dateReported}
                    onChange={(e) => setReportData({ ...reportData, dateReported: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time Reported <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={reportData.timeReported}
                    onChange={(e) => setReportData({ ...reportData, timeReported: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reported By <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportData.reportedBy}
                    onChange={(e) => setReportData({ ...reportData, reportedBy: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                    required
                    placeholder="Enter reporter name"
                  />
                </div>
              </div>
            </div>

            {/* Presenting Symptoms Section */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">3. Presenting Symptoms</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'fever', label: 'Fever (2–7 days)' },
                  { key: 'headache', label: 'Headache / Eye Pain' },
                  { key: 'musclePain', label: 'Muscle or Joint Pain' },
                  { key: 'rash', label: 'Rash' },
                  { key: 'nausea', label: 'Nausea / Vomiting' },
                  { key: 'abdominalPain', label: 'Abdominal Pain' },
                  { key: 'bleeding', label: 'Bleeding Signs' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportData[key]}
                      onChange={(e) => setReportData({ ...reportData, [key]: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Symptom Onset Section */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">4. Symptom Onset</h4>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date Started
                </label>
                <input
                  type="date"
                  value={reportData.symptomOnsetDate}
                  onChange={(e) => setReportData({ ...reportData, symptomOnsetDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Risk Classification Section */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">5. Risk Classification</h4>
              <div className="space-y-3">
                {[
                  { key: 'riskRed', label: '🔴 Red – High Risk' },
                  { key: 'riskYellow', label: '🟡 Yellow – Moderate Risk' },
                  { key: 'riskGreen', label: '🟢 Green – Low Risk' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportData[key]}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const updates = { ...reportData, [key]: checked }
                        if (checked) {
                          // Uncheck others
                          if (key === 'riskRed') {
                            updates.riskYellow = false
                            updates.riskGreen = false
                          } else if (key === 'riskYellow') {
                            updates.riskRed = false
                            updates.riskGreen = false
                          } else {
                            updates.riskRed = false
                            updates.riskYellow = false
                          }
                        }
                        setReportData(updates)
                      }}
                      className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-offset-2"
                      style={{
                        accentColor: key === 'riskRed' ? '#ef4444' : key === 'riskYellow' ? '#f59e0b' : '#10b981'
                      }}
                    />
                    <span className="text-gray-700 font-semibold">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Taken Section */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">6. Action Taken</h4>
              <div className="space-y-3">
                {[
                  { key: 'referredToFacility', label: 'Referred to Health Facility' },
                  { key: 'advisedMonitoring', label: 'Advised Monitoring' },
                  { key: 'notifiedFamily', label: 'Notified Family' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportData[key]}
                      onChange={(e) => setReportData({ ...reportData, [key]: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Remarks Section */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Remarks</h4>
              <textarea
                value={reportData.remarks}
                onChange={(e) => setReportData({ ...reportData, remarks: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all text-gray-900"
                rows="4"
                placeholder="Enter any additional remarks or notes..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 px-8 py-4 rounded-lg font-semibold shadow-md hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white px-8 py-4 rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all transform hover:scale-105"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default CaseReportModal
