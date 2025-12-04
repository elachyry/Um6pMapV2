import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore } from './stores/themeStore'
import { ToastProvider } from './hooks/useToast'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TemporaryUsers from './pages/TemporaryUsers'
import PermanentUsers from './pages/PermanentUsers'
import AccessRequests from './pages/AccessRequests'
import Events from './pages/Events'
import QRCodes from './pages/QRCodes'
import RoleManagement from './pages/RoleManagement'
import RouteGeneration from './pages/RouteGeneration'
import MapManagement from './pages/MapManagement'
import Reservations from './pages/Reservations'
import DatabaseBackup from './pages/DatabaseBackup'
import CampusManagement from './pages/CampusManagement'

function App() {
  const { theme } = useThemeStore()

  // Apply theme to document root
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="temporary-users" element={<TemporaryUsers />} />
            <Route path="permanent-users" element={<PermanentUsers />} />
            <Route path="access-requests" element={<AccessRequests />} />
            <Route path="events" element={<Events />} />
            <Route path="qr-codes" element={<QRCodes />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="route-generation" element={<RouteGeneration />} />
            <Route path="map-management" element={<MapManagement />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="database-backup" element={<DatabaseBackup />} />
            <Route path="campus" element={<CampusManagement />} />
          </Route>
        </Routes>
      </Router>
    </div>
    </ToastProvider>
  )
}

export default App
