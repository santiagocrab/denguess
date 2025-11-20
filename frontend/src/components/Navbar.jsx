import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const Navbar = () => {
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
    <nav className="fixed top-0 left-0 right-0 z-50 glass shadow-lg backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-red-600 to-red-700 p-2 rounded-xl">
                  <span className="text-2xl">🦟</span>
                </div>
              </div>
              <span className="text-2xl font-black gradient-text">Denguess</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive('/')
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                  : 'text-gray-700 hover:bg-white/50 hover:text-red-600'
              }`}
            >
              Home
            </Link>
            
            <div className="relative group">
              <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-1 ${
                barangays.some(b => isActive(b.path))
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                  : 'text-gray-700 hover:bg-white/50 hover:text-red-600'
              }`}>
                <span>Barangays</span>
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-64 rounded-xl shadow-2xl glass opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                <div className="py-2">
                  {barangays.map((barangay) => (
                    <Link
                      key={barangay.path}
                      to={barangay.path}
                      className={`block px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive(barangay.path)
                          ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 border-l-4 border-red-600'
                          : 'text-gray-700 hover:bg-white/50 hover:text-red-600'
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
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                  : 'text-gray-700 hover:bg-white/50 hover:text-red-600'
              }`}
            >
              Information
            </Link>
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive('/admin')
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                  : 'text-gray-700 hover:bg-white/50 hover:text-red-600'
              }`}
            >
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <svg
                className="h-6 w-6 text-gray-700"
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
        <div className="md:hidden border-t border-white/20">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/"
              className="block px-4 py-3 rounded-lg text-base font-semibold hover:bg-white/50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            {barangays.map((barangay) => (
              <Link
                key={barangay.path}
                to={barangay.path}
                className="block px-4 py-3 rounded-lg text-base font-semibold hover:bg-white/50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {barangay.name}
              </Link>
            ))}
            <Link
              to="/information"
              className="block px-4 py-3 rounded-lg text-base font-semibold hover:bg-white/50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Information
            </Link>
            <Link
              to="/admin"
              className="block px-4 py-3 rounded-lg text-base font-semibold hover:bg-white/50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
