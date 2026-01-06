import React from 'react'

const RiskLegend = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg border border-gray-200 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Risk Level Guide</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 flex items-center space-x-3">
          <div className="text-3xl">🟢</div>
          <div>
            <h4 className="text-lg font-bold text-green-800">Low Risk</h4>
            <p className="text-sm text-green-700">Probability &lt; 30%</p>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200 flex items-center space-x-3">
          <div className="text-3xl">🟠</div>
          <div>
            <h4 className="text-lg font-bold text-yellow-800">Moderate Risk</h4>
            <p className="text-sm text-yellow-700">Probability 30-60%</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200 flex items-center space-x-3">
          <div className="text-3xl">🔴</div>
          <div>
            <h4 className="text-lg font-bold text-red-800">High Risk</h4>
            <p className="text-sm text-red-700">Probability &gt; 60%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiskLegend
