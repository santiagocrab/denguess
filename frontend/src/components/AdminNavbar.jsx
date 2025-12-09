import { Link, useLocation } from 'react-router-dom'

const AdminNavbar = () => {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <Link to="/admin" className="flex items-center space-x-3 group">
              <div className="bg-red-600 p-2 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                <img 
                  src="/logo.png" 
                  alt="Denguess Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Admin Panel</span>
                <p className="text-xs text-gray-600">Denguess Management</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive('/admin')
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              ← Public Site
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default AdminNavbar
