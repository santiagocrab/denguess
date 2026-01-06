import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TIPS = [
  "🦟 A bottle cap of stagnant water can breed 100+ mosquitoes.",
  "💧 Empty containers, tires, and plant pots weekly to prevent breeding.",
  "🌡️ Mosquitoes are most active during dawn and dusk hours.",
  "🪴 Use mosquito-repellent plants like citronella and lemongrass.",
  "👕 Wear long sleeves and pants during peak mosquito hours.",
  "🧴 Apply insect repellent with DEET or picaridin for protection.",
  "🪟 Install window screens to keep mosquitoes out of your home.",
  "🌊 Keep gutters clean and free of standing water.",
  "🪣 Cover water storage containers tightly.",
  "🌿 Remove standing water from flower pot saucers daily."
]

const TipsCarousel = () => {
  const [currentTip, setCurrentTip] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length)
    }, 10000) // Rotate every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const goToTip = (index) => {
    setCurrentTip(index)
  }

  return (
    <motion.div
      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border-2 border-green-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">📚</div>
        <h3 className="text-lg font-bold text-gray-900">Did You Know?</h3>
      </div>
      <div className="min-h-[60px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentTip}
            className="text-gray-800 text-sm leading-relaxed"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {TIPS[currentTip]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        {TIPS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToTip(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentTip ? 'bg-green-600 w-6' : 'bg-green-300'
            }`}
            aria-label={`Go to tip ${index + 1}`}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default TipsCarousel

