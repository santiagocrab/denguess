import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const AnimatedCounter = ({ value, label, icon, suffix = '', duration = 1.5, decimals = 1 }) => {
  const targetValue = parseFloat(value) || 0
  const [displayValue, setDisplayValue] = useState(targetValue)
  const counterRef = useRef(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    const newTargetValue = parseFloat(value) || 0
    
    if (isFirstRender.current) {
      // On first render, set immediately
      setDisplayValue(newTargetValue)
      isFirstRender.current = false
      return
    }
    
    // Animate to new value
    const obj = { val: displayValue }
    gsap.to(obj, {
      val: newTargetValue,
      duration: duration,
      ease: 'power2.out',
      onUpdate: function() {
        setDisplayValue(parseFloat(obj.val.toFixed(decimals)))
      },
      onComplete: () => {
        setDisplayValue(newTargetValue)
      }
    })
  }, [value, duration, decimals])

  return (
    <div ref={counterRef} className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-red-700">
        {displayValue.toFixed(decimals)}{suffix}
      </div>
    </div>
  )
}

export default AnimatedCounter
