import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import LoadingScreen from './components/LoadingScreen'
import PublicNavbar from './components/PublicNavbar'
import AdminNavbar from './components/AdminNavbar'

// Lazy load pages for faster initial load
const Home = lazy(() => import('./pages/Home'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const BarangayPage = lazy(() => import('./pages/BarangayPage'))
const InformationDesk = lazy(() => import('./pages/InformationDesk'))

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Skip loading screen in development for faster startup
    // Only show in production for polished experience
    if (import.meta.env.DEV) {
      setLoading(false)
    } else {
      // Minimal loading time for smooth transition in production
      const timer = setTimeout(() => {
        setLoading(false)
      }, 200) // Reduced to 0.2 seconds for faster load

      return () => clearTimeout(timer)
    }
  }, [])

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />
  }

  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div></div>}>
        <Routes>
          {/* Admin Routes - Separate Layout */}
          <Route
            path="/admin"
            element={
              <div className="min-h-screen bg-gray-50">
                <AdminNavbar />
                <div className="pt-20">
                  <AdminDashboard />
                </div>
              </div>
            }
          />

          {/* Public Routes - Public Layout */}
          <Route
            path="/"
            element={
              <div className="min-h-screen bg-gray-50">
                <PublicNavbar />
                <Home />
              </div>
            }
          />
          <Route
            path="/general-paulino-santos"
            element={
              <div className="min-h-screen bg-gray-50">
                <PublicNavbar />
                <BarangayPage barangay="General Paulino Santos" />
              </div>
            }
          />
          <Route
            path="/morales"
            element={
              <div className="min-h-screen bg-gray-50">
                <PublicNavbar />
                <BarangayPage barangay="Morales" />
              </div>
            }
          />
          <Route
            path="/santa-cruz"
            element={
              <div className="min-h-screen bg-gray-50">
                <PublicNavbar />
                <BarangayPage barangay="Santa Cruz" />
              </div>
            }
          />
          <Route
            path="/santo-nino"
            element={
              <div className="min-h-screen bg-gray-50">
                <PublicNavbar />
                <BarangayPage barangay="Sto. Niño" />
              </div>
            }
          />
          <Route
            path="/zone-2"
            element={
              <div className="min-h-screen bg-gray-50">
                <PublicNavbar />
                <BarangayPage barangay="Zone II" />
              </div>
            }
          />
          <Route
            path="/information"
            element={
              <div className="min-h-screen bg-gray-50">
                <PublicNavbar />
                <InformationDesk />
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
