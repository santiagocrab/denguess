import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LoadingScreen from './components/LoadingScreen'
import PublicNavbar from './components/PublicNavbar'
import AdminNavbar from './components/AdminNavbar'
import AdminDashboard from './pages/AdminDashboard'
import BarangayPage from './pages/BarangayPage'
import InformationDesk from './pages/InformationDesk'
import Home from './pages/Home'

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
    </Router>
  )
}

export default App
