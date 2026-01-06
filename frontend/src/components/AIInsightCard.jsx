import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getInsights } from '../services/api'
import { gsap } from 'gsap'

const AIInsightCard = () => {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(true)
  const cardRef = useRef(null)

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const data = await getInsights()
        if (data.insights && data.insights.length > 0) {
          setInsight(data.insights[0])
        } else {
          setInsight('🌡️ Current weather conditions are being monitored for dengue risk assessment.')
        }
      } catch (error) {
        console.error('Error fetching insights:', error)
        setInsight('🌡️ Current weather conditions are being monitored for dengue risk assessment.')
      } finally {
        setLoading(false)
      }
    }
    fetchInsight()
  }, [])

  useEffect(() => {
    // GSAP slide-in animation for insight
    if (cardRef.current && !loading) {
      gsap.from(cardRef.current, { duration: 0.5, opacity: 0, x: -10, delay: 0.3, ease: "power2.out" })
    }
  }, [loading])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <div className="h-4 bg-yellow-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      ref={cardRef}
      className="ai-insight bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className="text-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          💡
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-yellow-900 mb-1">Insight</div>
          <p className="text-gray-800 text-sm leading-relaxed">{insight}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default AIInsightCard

