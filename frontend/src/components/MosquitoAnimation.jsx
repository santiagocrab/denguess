import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const MosquitoAnimation = ({ count = 15 }) => {
  const [mosquitoes, setMosquitoes] = useState([])

  useEffect(() => {
    // Generate mosquitoes that fly horizontally from left to right
    const newMosquitoes = Array.from({ length: count }, (_, i) => ({
      id: i,
      startY: 10 + (Math.random() * 80), // Spread vertically across screen (10% to 90%)
      duration: 8 + Math.random() * 12, // 8-20 seconds for variety
      delay: Math.random() * 5, // Staggered start times
      size: 20 + Math.random() * 25, // 20-45px for variety
      verticalDrift: -15 + Math.random() * 30, // -15% to +15% vertical movement
      speed: 0.7 + Math.random() * 0.6, // Speed variation
    }))
    setMosquitoes(newMosquitoes)
  }, [count])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {mosquitoes.map((mosquito) => {
        // Create smooth horizontal path with slight vertical drift
        const midY = mosquito.startY + (mosquito.verticalDrift * 0.5)
        const endY = mosquito.startY + mosquito.verticalDrift
        
        return (
          <motion.div
            key={mosquito.id}
            className="absolute"
            style={{
              willChange: 'transform',
            }}
            initial={{
              x: '-100px', // Start off-screen left
              y: `${mosquito.startY}%`,
              rotate: 0,
            }}
            animate={{
              x: ['-100px', 'calc(100vw + 100px)'], // Fly from left to right (off-screen)
              y: [
                `${mosquito.startY}%`,
                `${midY}%`,
                `${endY}%`,
              ],
              rotate: [0, 8, -8, 12, -12, 8, 0],
            }}
            transition={{
              duration: mosquito.duration * mosquito.speed,
              delay: mosquito.delay,
              repeat: Infinity,
              ease: 'linear', // Linear for smooth horizontal movement
              times: [0, 0.5, 1],
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 0.95, 1.05, 1],
                opacity: [0.4, 0.8, 0.6, 0.9, 0.4],
              }}
              transition={{
                duration: 0.8 + Math.random() * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                fontSize: `${mosquito.size}px`,
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
                display: 'inline-block',
              }}
            >
              🦟
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default MosquitoAnimation
