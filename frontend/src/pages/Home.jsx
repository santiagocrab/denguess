import { Link } from 'react-router-dom'
import { getBarangays } from '../services/api'
import { useState, useEffect } from 'react'

const Home = () => {
  const [barangays, setBarangays] = useState([])

  useEffect(() => {
    getBarangays().then(setBarangays).catch(console.error)
  }, [])

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-gray-50 to-white animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/logo.png" 
              alt="Denguess Logo" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain animate-float drop-shadow-lg logo-hover"
            />
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              Denguess
            </h1>
          </div>
        </div>

        {/* Barangays Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {barangays.map((barangay) => {
            const slug = barangay.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')
            const path = `/${slug === 'sto.-niño' ? 'santo-nino' : slug === 'zone-ii' ? 'zone-2' : slug}`
            
            return (
              <Link
                key={barangay}
                to={path}
                className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200 hover:border-red-500 transition-all transform hover:scale-105 card-hover animate-slide-up"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">🏘️</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{barangay}</h3>
                  <p className="text-gray-600 text-sm">View Risk Forecast</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200 animate-slide-up">
            <div className="text-3xl mb-3">🔴</div>
            <h3 className="text-lg font-bold text-red-900 mb-2">High Risk</h3>
            <p className="text-red-700 text-sm">Greater than 60% outbreak probability</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200 animate-slide-up">
            <div className="text-3xl mb-3">🟡</div>
            <h3 className="text-lg font-bold text-yellow-900 mb-2">Moderate Risk</h3>
            <p className="text-yellow-700 text-sm">30-60% outbreak probability</p>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 animate-slide-up">
            <div className="text-3xl mb-3">🟢</div>
            <h3 className="text-lg font-bold text-green-900 mb-2">Low Risk</h3>
            <p className="text-green-700 text-sm">Less than 30% outbreak probability</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8 border-2 border-red-200 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Stay Informed, Stay Safe</h2>
          <p className="text-gray-700 mb-6">
            Check your barangay's dengue risk forecast and report any cases or symptoms you observe.
          </p>
          <Link
            to="/information"
            className="inline-block bg-red-600 text-white px-8 py-4 rounded-lg font-semibold shadow-md hover:bg-red-700 transition-all transform hover:scale-105"
          >
            Learn More About Dengue
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
