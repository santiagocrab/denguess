import { useState } from 'react'
import { motion } from 'framer-motion'

const InformationDesk = () => {
  return (
    <motion.div
      className="min-h-screen pt-20 bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Dengue Information Desk
          </h1>
          <p className="text-lg text-gray-600">
            Learn about dengue prevention, symptoms, and treatment
          </p>
        </motion.div>

        {/* Video Section */}
        <motion.div
          className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Educational Video</h2>
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/p3kZjyTxisk"
              title="Dengue Prevention Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </motion.div>

        {/* Information Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Symptoms */}
          <motion.div
            className="bg-white rounded-xl p-8 shadow-lg border border-gray-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Symptoms</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Fever (2-7 days)</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Severe headache</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Eye pain</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Muscle and joint pain</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Rash</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Nausea and vomiting</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Bleeding signs</span>
              </li>
            </ul>
          </motion.div>

          {/* Prevention */}
          <motion.div
            className="bg-white rounded-xl p-8 shadow-lg border border-gray-200"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Prevention Tips</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Eliminate standing water</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Use mosquito repellent</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Wear long sleeves and pants</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Use mosquito nets</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Keep surroundings clean</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Cover water containers</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Warning Section */}
        <motion.div
          className="bg-red-50 rounded-xl p-8 border-2 border-red-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-red-900 mb-4">⚠️ Important Warning</h2>
          <p className="text-red-800 mb-4">
            Delikado kag makapatay ang dengue kun indi dayon maatubang. Kon pabayaan, ini nga masakit mahimo magdulot sang internal nga pagdurugo, shock, kag iban pa nga mabudlay nga komplikasyon.
          </p>
          <p className="text-red-800">
            Dengue is dangerous and can be fatal if not addressed immediately. When left untreated, it can lead to internal bleeding, shock, and other severe complications.
          </p>
        </motion.div>

        {/* When to Seek Help */}
        <motion.div
          className="bg-yellow-50 rounded-xl p-8 border-2 border-yellow-200 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-yellow-900 mb-4">When to Seek Medical Help</h2>
          <p className="text-yellow-800 mb-4">
            Seek immediate medical attention if you experience:
          </p>
          <ul className="space-y-2 text-yellow-800">
            <li>• Severe abdominal pain</li>
            <li>• Persistent vomiting</li>
            <li>• Bleeding from nose or gums</li>
            <li>• Difficulty breathing</li>
            <li>• Fatigue or restlessness</li>
            <li>• Rapid decrease in platelet count</li>
          </ul>
        </motion.div>

        {/* Medical Centers */}
        <motion.div
          className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Medical Centers in Koronadal City</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allah Valley Medical Specialists Center */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Allah Valley Medical Specialists Center</h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-start">
                  <span className="text-blue-600 mr-2">📍</span>
                  <span>General Santos Drive 9506 Koronadal City</span>
                </p>
                <p className="flex items-start">
                  <span className="text-blue-600 mr-2">📞</span>
                  <span>Phone: <a href="tel:+639491631598" className="text-blue-600 hover:underline">+63 949 163 1598</a></span>
                </p>
              </div>
            </div>

            {/* Dr. Arturo P. Pingoy Medical Center */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dr. Arturo P. Pingoy Medical Center</h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-start">
                  <span className="text-blue-600 mr-2">📍</span>
                  <span>General Santos Drive 9506 Koronadal City</span>
                </p>
                <p className="flex items-start">
                  <span className="text-blue-600 mr-2">📞</span>
                  <span>
                    Phone: <a href="tel:+63832282202" className="text-blue-600 hover:underline">+63 83 228 2202</a>;{' '}
                    <a href="tel:+639174090537" className="text-blue-600 hover:underline">+63 917 409 0537</a>
                  </span>
                </p>
              </div>
            </div>

            {/* Socomedics Medical Center */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Socomedics Medical Center</h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-start">
                  <span className="text-blue-600 mr-2">📍</span>
                  <span>Judge Alba Avenue 9506 Koronadal</span>
                </p>
                <p className="flex items-start">
                  <span className="text-blue-600 mr-2">📞</span>
                  <span>Phone: <a href="tel:+63832288202" className="text-blue-600 hover:underline">(083) 228-8202</a></span>
                </p>
              </div>
            </div>

            {/* South Cotabato Provincial Hospital */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">South Cotabato Provincial Hospital - Department of Health</h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-start">
                  <span className="text-blue-600 mr-2">📍</span>
                  <span>Emilio Aguinaldo Street 9506 Koronadal</span>
                </p>
                <p className="flex items-start">
                  <span className="text-blue-600 mr-2">📞</span>
                  <span>Phone: <a href="tel:+63832284571" className="text-blue-600 hover:underline">+6383 2284571</a></span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default InformationDesk
