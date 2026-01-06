import { useEffect, useState } from 'react'

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    // Progress animation - much faster
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => {
            if (onComplete) onComplete()
          }, 100) // Reduced delay
          return 100
        }
        return prev + 10 // Much faster progress (10% increments)
      })
    }, 20) // Faster animation (20ms intervals)

    // Dots animation
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return ''
        return prev + '.'
      })
    }, 500)

    return () => {
      clearInterval(progressInterval)
      clearInterval(dotsInterval)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo/Icon */}
        <div className="mb-8 animate-float">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative bg-white p-6 md:p-8 rounded-full shadow-2xl">
              <img 
                src="/logo.png" 
                alt="Denguess Logo" 
                className="w-16 h-16 md:w-24 md:h-24 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight">
            Denguess
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-red-100 mb-8 font-semibold">
          AI-Powered Dengue Prediction{dots}
        </p>

        {/* Progress bar */}
        <div className="w-80 md:w-96 mx-auto">
          <div className="h-2 bg-white/30 rounded-full overflow-hidden border border-white/20">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <p className="text-red-100 text-sm mt-2 font-medium">{progress}%</p>
        </div>

        {/* Loading text */}
        <div className="mt-8 text-red-100 text-sm font-medium">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Initializing prediction system</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
