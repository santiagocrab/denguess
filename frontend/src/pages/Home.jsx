import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getCurrentWeather } from '../services/weather'

const Home = () => {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentWeather().then(data => {
      setWeather(data)
      setLoading(false)
    })
    
    const interval = setInterval(() => {
      getCurrentWeather().then(setWeather)
    }, 300000)
    
    return () => clearInterval(interval)
  }, [])

  const barangays = [
    { name: 'General Paulino Santos', path: '/general-paulino-santos', slug: 'general-paulino-santos' },
    { name: 'Morales', path: '/morales', slug: 'morales' },
    { name: 'Santa Cruz', path: '/santa-cruz', slug: 'santa-cruz' },
    { name: 'Sto. Niño', path: '/santo-nino', slug: 'santo-nino' },
    { name: 'Zone II', path: '/zone-2', slug: 'zone-2' },
  ]

  return (
    <div className="min-h-screen pt-24 bg-gray-50 animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Denguess
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              AI-Powered Dengue Prediction System
            </h2>
            <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-3xl mx-auto">
              Real-time dengue risk forecasts for Koronadal City
            </p>
            
            {/* Live Weather Display */}
            {weather && (
              <div className="inline-flex items-center space-x-8 bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 shadow-lg border border-white/30">
                <div className="text-center">
                  <div className="text-sm text-red-100 mb-1 font-medium">Temperature</div>
                  <div className="text-3xl font-bold">{weather.temperature}°C</div>
                </div>
                <div className="w-px h-12 bg-white/30"></div>
                <div className="text-center">
                  <div className="text-sm text-red-100 mb-1 font-medium">Humidity</div>
                  <div className="text-3xl font-bold">{weather.humidity}%</div>
                </div>
                <div className="w-px h-12 bg-white/30"></div>
                <div className="text-center">
                  <div className="text-sm text-red-100 mb-1 font-medium">Rainfall</div>
                  <div className="text-3xl font-bold">{weather.rainfall}mm</div>
                </div>
                <div className="ml-4 px-3 py-1 bg-green-500/80 text-white rounded-full text-xs font-bold flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>LIVE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barangays Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Explore Barangays</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select a barangay to view detailed dengue risk forecasts and weekly predictions
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {barangays.map((barangay, index) => (
            <Link
              key={barangay.path}
              to={barangay.path}
              className="group relative overflow-hidden rounded-lg card-hover bg-white shadow-md border border-gray-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                    <span className="text-3xl">📍</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{barangay.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    View weekly dengue risk forecast and interactive map
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-red-600 font-semibold mt-6 group-hover:text-red-700 transition-colors">
                  <span>View Details</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* About Section */}
        <div className="bg-white rounded-xl p-12 shadow-lg border border-gray-200 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Denguess Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our advanced AI model analyzes real-time climate data to predict dengue risk levels
              with high accuracy, helping protect communities in Koronadal City.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center p-6 rounded-lg bg-green-50 border-2 border-green-200">
              <div className="text-5xl mb-4">🟢</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Low Risk</h3>
              <p className="text-green-700">Minimal dengue activity expected. Continue preventive measures.</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-yellow-50 border-2 border-yellow-200">
              <div className="text-5xl mb-4">🟡</div>
              <h3 className="text-xl font-bold text-yellow-800 mb-2">Moderate Risk</h3>
              <p className="text-yellow-700">Increased vigilance recommended. Monitor symptoms closely.</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-red-50 border-2 border-red-200">
              <div className="text-5xl mb-4">🔴</div>
              <h3 className="text-xl font-bold text-red-800 mb-2">High Risk</h3>
              <p className="text-red-700">Take immediate preventive measures. Seek medical attention if needed.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link
            to="/information"
            className="inline-flex items-center space-x-3 bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
          >
            <span>Learn More About Dengue Prevention</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
