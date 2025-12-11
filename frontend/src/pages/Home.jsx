import { Link } from 'react-router-dom'
import { getBarangays } from '../services/api'
import { useState, useEffect, useRef } from 'react'
import WeatherCard from '../components/WeatherCard'
import MiniHeatmap from '../components/MiniHeatmap'
import AIInsightCard from '../components/AIInsightCard'
import AnalyticsCards from '../components/AnalyticsCards'
import ForecastSlider from '../components/ForecastSlider'
import TipsCarousel from '../components/TipsCarousel'
import { getCurrentWeather } from '../services/weather'
import lottie from 'lottie-web'

const Home = () => {
  const [barangays, setBarangays] = useState([])
  const [weather, setWeather] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [theme, setTheme] = useState('default')
  const mosquitoAnimRef = useRef(null)

  useEffect(() => {
    getBarangays().then(setBarangays).catch(console.error)
    
    // Load weather for theming
    getCurrentWeather().then((data) => {
      setWeather(data)
      setLastUpdate(new Date())
      
      // Set theme based on weather
      if (data.condition === 'Rain' || data.rainfall > 20) {
        setTheme('rainy')
      } else if (data.condition === 'Clear' && data.temperature > 30) {
        setTheme('sunny')
      } else if (data.condition === 'Clouds') {
        setTheme('cloudy')
      } else {
        setTheme('default')
      }
    })

    // Initialize Lottie animation for mosquito icon
    if (mosquitoAnimRef.current) {
      // Create SVG-based mosquito animation (fallback if no Lottie JSON)
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '0 0 100 100')
      svg.setAttribute('width', '100%')
      svg.setAttribute('height', '100%')
      svg.innerHTML = `
        <g class="mosquito">
          <circle cx="50" cy="50" r="8" fill="#D32F2F" opacity="0.8">
            <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite"/>
          </circle>
          <path d="M 50 42 L 50 30" stroke="#D32F2F" stroke-width="2" fill="none">
            <animate attributeName="d" values="M 50 42 L 50 30;M 52 42 L 50 30;M 50 42 L 50 30" dur="3s" repeatCount="indefinite"/>
          </path>
          <path d="M 50 58 L 50 70" stroke="#D32F2F" stroke-width="2" fill="none">
            <animate attributeName="d" values="M 50 58 L 50 70;M 48 58 L 50 70;M 50 58 L 50 70" dur="3s" repeatCount="indefinite"/>
          </path>
          <circle cx="45" cy="45" r="2" fill="#D32F2F"/>
          <circle cx="55" cy="45" r="2" fill="#D32F2F"/>
        </g>
      `
      mosquitoAnimRef.current.appendChild(svg)
    }
  }, [])

  const handleRefresh = async () => {
    const data = await getCurrentWeather()
    setWeather(data)
    setLastUpdate(new Date())
  }

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Theme-based background gradients
  const getThemeGradient = () => {
    switch (theme) {
      case 'sunny':
        return 'bg-gradient-to-b from-yellow-50 via-orange-50 to-white'
      case 'rainy':
        return 'bg-gradient-to-b from-blue-50 via-gray-50 to-white'
      case 'cloudy':
        return 'bg-gradient-to-b from-gray-50 to-white'
      default:
        return 'bg-gradient-to-b from-gray-50 to-white'
    }
  }

  return (
    <div className={`min-h-screen pt-20 ${getThemeGradient()} animate-fade-in transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div ref={mosquitoAnimRef} id="mosquito-animation" className="w-16 h-16 md:w-20 md:h-20 animate-float"></div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              Denguess
            </h1>
          </div>
          <p className="text-center italic text-gray-600 mt-2 text-lg md:text-xl font-semibold">
            🦟 Outsmart the Bite Before It Strikes
          </p>
        </div>

        {/* Top Row: Weather Card and AI Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <WeatherCard />
          <AIInsightCard />
        </div>

        {/* Analytics Cards */}
        <AnalyticsCards />

        {/* Interactive Heatmap */}
        <div className="mb-6">
          <MiniHeatmap />
        </div>

        {/* 7-Day Forecast */}
        <div className="mb-6">
          <ForecastSlider />
        </div>

        {/* Last Updated + Refresh Button */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600">
            {lastUpdate ? (
              <>Last updated: <span className="font-semibold">{formatTime(lastUpdate)}</span></>
            ) : (
              'Loading...'
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Did You Know Carousel */}
        <div className="mb-12">
          <TipsCarousel />
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

        {/* Important Warning */}
        <div className="mt-12 text-center bg-red-50 rounded-xl p-6 border-2 border-red-300 animate-slide-up">
          <p className="text-lg font-semibold text-red-900 leading-relaxed">
            ⚠️ Dengue is dangerous and can be fatal if not addressed immediately. When left untreated, it can lead to internal bleeding, shock, and other severe complications.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home
