import { Link } from 'react-router-dom'
import { getBarangays } from '../services/api'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import WeatherCard from '../components/WeatherCard'
import MiniHeatmap from '../components/MiniHeatmap'
import AIInsightCard from '../components/AIInsightCard'
import ForecastSlider from '../components/ForecastSlider'
import TipsCarousel from '../components/TipsCarousel'
import MosquitoAnimation from '../components/MosquitoAnimation'
import { getCurrentWeather } from '../services/weather'

const Home = () => {
  const [barangays, setBarangays] = useState([])
  const [weather, setWeather] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [theme, setTheme] = useState('default')

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
    <div className={`min-h-screen pt-20 ${getThemeGradient()} animate-fade-in transition-colors duration-500 relative overflow-hidden`}>
      {/* Mosquito Flying Animation Background - Enhanced */}
      <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ top: '80px', zIndex: 1 }}>
        <MosquitoAnimation count={15} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        {/* Premium Hero Section */}
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo - Premium Presentation */}
          <motion.div
            className="flex justify-center mb-10"
            initial={{ opacity: 0, scale: 0.8, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.2,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0] }}
              transition={{ duration: 0.3 }}
            >
              {/* Subtle glow effect */}
              <motion.div
                className="absolute inset-0 blur-2xl opacity-20"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.15, 0.25, 0.15],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background: 'radial-gradient(circle, #D64541 0%, transparent 70%)',
                }}
              />
              <img
                src="/logo.png"
                alt="Denguess Logo"
                className="h-28 md:h-40 lg:h-48 w-auto object-contain relative z-10 drop-shadow-2xl"
                loading="eager"
                onLoad={() => console.log('Homepage logo loaded from /logo.png')}
                onError={(e) => {
                  console.error('Homepage logo failed to load:', e)
                }}
              />
            </motion.div>
          </motion.div>

          {/* Title - Premium Typography */}
          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold text-gray-900 mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.span
              className="block"
              animate={{
                textShadow: [
                  '0 0 0px rgba(214, 69, 65, 0)',
                  '0 0 20px rgba(214, 69, 65, 0.3)',
                  '0 0 0px rgba(214, 69, 65, 0)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Denguess
            </motion.span>
          </motion.h1>

          {/* Tagline - Elegant */}
          <motion.p
            className="text-xl md:text-2xl lg:text-3xl text-gray-600 font-light tracking-wide mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Outsmart the Bite Before It Strikes
          </motion.p>
          
          {/* Subtle decorative line */}
          <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
          </motion.div>
        </motion.div>

        {/* Top Row: Weather Card and Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <WeatherCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AIInsightCard />
          </motion.div>
        </div>

        {/* Interactive Heatmap */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <MiniHeatmap />
        </motion.div>

        {/* 7-Day Forecast */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <ForecastSlider />
        </motion.div>

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
