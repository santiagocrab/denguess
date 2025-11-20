import { useState, useEffect } from 'react'
import { predictDengueRisk, getBarangays } from '../services/api'
import { getCurrentWeather } from '../services/weather'

const InformationDesk = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    checkAlerts()
    getCurrentWeather().then(setWeather)
  }, [])

  const checkAlerts = async () => {
    setLoading(true)
    try {
      const barangays = await getBarangays()
      const today = new Date().toISOString().split('T')[0]
      
      // Get current weather data
      const currentWeather = await getCurrentWeather()
      const currentClimate = {
        temperature: currentWeather.temperature,
        humidity: currentWeather.humidity,
        rainfall: currentWeather.rainfall
      }

      const alertPromises = barangays.map(async (barangay) => {
        try {
          const forecast = await predictDengueRisk(barangay, currentClimate, today)
          // Check only THIS WEEK (first week of forecast)
          const thisWeekRisk = forecast.weekly_forecast[0]?.risk
          if (thisWeekRisk === 'High') {
            return { barangay, risk: thisWeekRisk }
          }
          return null
        } catch (err) {
          return null
        }
      })

      const results = await Promise.all(alertPromises)
      setAlerts(results.filter((alert) => alert !== null))
    } catch (err) {
      console.error('Error checking alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 bg-gray-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Information Desk
          </h1>
          <p className="text-lg text-gray-600">Dengue prevention, symptoms, and resources</p>
        </div>

        {/* Alerts - Only THIS WEEK */}
        {loading ? (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600 font-semibold">Checking for alerts...</p>
          </div>
        ) : alerts.length > 0 ? (
          <div className="bg-red-600 rounded-xl p-8 shadow-lg mb-8 text-white border-2 border-red-700 animate-slide-up">
            <div className="flex items-center space-x-4 mb-6">
              <div className="text-5xl animate-pulse">⚠️</div>
              <div>
                <h2 className="text-3xl font-bold mb-2">High Risk Alert - This Week</h2>
                <p className="text-red-100 text-lg">
                  The following barangays are at <strong>High Risk</strong> for dengue this week
                </p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {alerts.map((alert, index) => (
                <li key={index} className="text-xl font-bold bg-red-700/50 rounded-lg px-6 py-4 border border-red-500/50">
                  {alert.barangay}
                </li>
              ))}
            </ul>
            <p className="text-lg font-semibold bg-red-700/50 rounded-lg px-6 py-4 border border-red-500/50">
              Please take immediate preventive measures and seek medical attention if you experience symptoms.
            </p>
          </div>
        ) : (
          <div className="bg-green-600 rounded-xl p-8 shadow-lg mb-8 text-white border-2 border-green-700 animate-slide-up">
            <div className="flex items-center space-x-4">
              <div className="text-5xl">✅</div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Current Status</h2>
                <p className="text-green-100 text-lg">
                  No barangays are at high risk this week. Continue practicing preventive measures.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Symptoms */}
        <div className="bg-white rounded-xl p-10 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Dengue Symptoms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-red-50 rounded-lg p-8 border-2 border-red-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <span className="text-4xl">🤒</span>
                <span>Common Symptoms</span>
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>High fever (40°C/104°F)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Severe headache</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Pain behind the eyes</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Muscle and joint pains</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Nausea and vomiting</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Swollen glands</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Rash</span>
                </li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-8 border-2 border-red-200">
              <h3 className="text-2xl font-bold text-red-900 mb-6 flex items-center space-x-3">
                <span className="text-4xl">🚨</span>
                <span>Warning Signs</span>
              </h3>
              <p className="text-red-800 font-bold mb-4">Seek Immediate Medical Care</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Severe abdominal pain</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Persistent vomiting</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Rapid breathing</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Bleeding gums or nose</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Fatigue and restlessness</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Blood in vomit or stool</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Extreme thirst</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Pale, cold, or clammy skin</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Prevention */}
        <div className="bg-white rounded-xl p-10 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Prevention Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🚫', title: 'Remove Standing Water', desc: 'Empty containers, flower pots, and any items that can collect water. Mosquitoes breed in stagnant water.', color: 'bg-red-50 border-red-200' },
              { icon: '🪟', title: 'Use Window Screens', desc: 'Install screens on windows and doors to prevent mosquitoes from entering your home.', color: 'bg-red-50 border-red-200' },
              { icon: '🧴', title: 'Use Mosquito Repellent', desc: 'Apply EPA-registered insect repellents containing DEET, picaridin, or oil of lemon eucalyptus.', color: 'bg-red-50 border-red-200' },
              { icon: '👕', title: 'Wear Protective Clothing', desc: 'Wear long-sleeved shirts and long pants, especially during peak mosquito hours (dawn and dusk).', color: 'bg-red-50 border-red-200' },
              { icon: '🛏️', title: 'Use Mosquito Nets', desc: 'Sleep under mosquito nets, especially for infants and young children.', color: 'bg-red-50 border-red-200' },
              { icon: '🧹', title: 'Keep Surroundings Clean', desc: 'Regularly clean gutters, drains, and areas where water can accumulate.', color: 'bg-red-50 border-red-200' },
            ].map((tip, index) => (
              <div key={index} className={`${tip.color} rounded-lg p-6 border-2 card-hover shadow-sm`}>
                <div className="text-5xl mb-4">{tip.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{tip.title}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-xl p-10 shadow-lg border border-gray-200 mb-8 animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Emergency Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-600 rounded-lg p-8 text-white shadow-lg border-2 border-red-700">
              <div className="text-5xl mb-4">📞</div>
              <h3 className="text-2xl font-bold mb-2">Emergency Hotline</h3>
              <div className="text-4xl font-bold mb-4">911</div>
              <p className="text-red-100">For immediate medical emergencies</p>
            </div>
            <div className="bg-red-700 rounded-lg p-8 text-white shadow-lg border-2 border-red-800">
              <div className="text-5xl mb-4">🏥</div>
              <h3 className="text-2xl font-bold mb-2">Local Health Office</h3>
              <div className="text-xl font-semibold mb-4">Koronadal City Health Office</div>
              <p className="text-red-100">Contact your local health office for dengue-related concerns</p>
            </div>
          </div>
        </div>

        {/* Treatment */}
        <div className="bg-white rounded-xl p-10 shadow-lg border border-gray-200 animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Treatment</h2>
          <div className="bg-yellow-50 rounded-lg p-8 border-2 border-yellow-200">
            <p className="text-lg text-gray-800 mb-6">
              <strong className="text-gray-900">Important:</strong> There is no specific treatment for dengue fever. If you suspect you have dengue:
            </p>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start space-x-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <span className="text-lg">Rest and stay hydrated</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <span className="text-lg">Take acetaminophen (paracetamol) for pain and fever</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-red-600 font-bold text-xl">✗</span>
                <span className="text-lg"><strong>Do NOT take aspirin or ibuprofen</strong> as they can increase bleeding risk</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <span className="text-lg">Seek medical attention immediately if warning signs appear</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <span className="text-lg">Follow your doctor's instructions carefully</span>
              </li>
            </ul>
            <p className="mt-6 text-lg text-gray-800 font-semibold">
              <strong>Note:</strong> Early detection and proper medical care can significantly reduce the risk of complications.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InformationDesk
