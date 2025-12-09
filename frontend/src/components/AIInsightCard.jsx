import { useState, useEffect } from 'react'
import api from '../services/api'

const AIInsightCard = () => {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const response = await api.get('/insights')
        if (response.data.insights && response.data.insights.length > 0) {
          setInsight(response.data.insights[0])
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
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="text-3xl">💡</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-yellow-900 mb-1">AI Insight</div>
          <p className="text-gray-800 text-sm leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  )
}

export default AIInsightCard

