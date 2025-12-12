import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore } from './stores/themeStore'
import { ToastProvider } from './hooks/useToast'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Signup from './pages/Signup'
import MagicLogin from './pages/MagicLogin'
import VerifyEmail from './pages/VerifyEmail'
import VerifyEmailPending from './pages/VerifyEmailPending'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import Map from './pages/Map'
import TemporaryUsers from './pages/TemporaryUsers'
import PermanentUsers from './pages/PermanentUsers'
import AccessRequests from './pages/AccessRequests'
import Events from './pages/Events'
import QRCodes from './pages/QRCodes'
import RoleManagement from './pages/RoleManagement'
import RouteGeneration from './pages/RouteGeneration'
import MapManagement from './pages/MapManagement'
import { ReservationsManagement } from './pages/admin/ReservationsManagement'
import MyReservations from './pages/MyReservations'
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
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/magic-login" element={<MagicLogin />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Change Password - Protected but accessible to all authenticated users */}
          <Route 
            path="/change-password" 
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } 
          />

          {/* Map Route - Standalone (No Layout) */}
          <Route 
            path="/map" 
            element={
              <ProtectedRoute>
                <Map />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes with Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Layout />
                </AdminRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="my-reservations" element={<MyReservations />} />
            <Route path="temporary-users" element={<TemporaryUsers />} />
            <Route path="permanent-users" element={<PermanentUsers />} />
            <Route path="access-requests" element={<AccessRequests />} />
            <Route path="events" element={<Events />} />
            <Route path="qr-codes" element={<QRCodes />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="route-generation" element={<RouteGeneration />} />
            <Route path="map-management" element={<MapManagement />} />
            <Route path="reservations" element={<ReservationsManagement />} />
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
