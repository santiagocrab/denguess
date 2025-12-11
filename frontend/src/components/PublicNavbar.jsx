import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const PublicNavbar = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const barangays = [
    { name: 'General Paulino Santos', path: '/general-paulino-santos' },
    { name: 'Morales', path: '/morales' },
    { name: 'Santa Cruz', path: '/santa-cruz' },
    { name: 'Sto. Niño', path: '/santo-nino' },
    { name: 'Zone II', path: '/zone-2' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-[#D32F2F] p-2 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                <img 
                  src="/logo.png" 
                  alt="Denguess Logo" 
                  className="w-8 h-8 object-contain logo-hover"
                />
              </div>
              <span className="text-2xl font-bold text-gray-900 group-hover:text-[#D32F2F] transition-colors">Denguess</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive('/')
                  ? 'bg-[#D32F2F] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Home
            </Link>
            
            <div className="relative group">
              <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-1 ${
                barangays.some(b => isActive(b.path))
                  ? 'bg-[#D32F2F] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                <span>Barangays</span>
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-64 rounded-lg shadow-xl bg-white border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                <div className="py-2">
                  {barangays.map((barangay) => (
                    <Link
                      key={barangay.path}
                      to={barangay.path}
                      className={`block px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive(barangay.path)
                          ? 'bg-red-50 text-red-700 border-l-4 border-[#D32F2F]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {barangay.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/information"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive('/information')
                  ? 'bg-[#D32F2F] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Information
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/"
              className="block px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            {barangays.map((barangay) => (
              <Link
                key={barangay.path}
                to={barangay.path}
                className="block px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsOpen(false)}
              >
                {barangay.name}
              </Link>
            ))}
            <Link
              to="/information"
              className="block px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Information
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default PublicNavbar
