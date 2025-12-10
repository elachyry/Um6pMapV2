/**
 * Admin Route Component
 * Purpose: Protect admin-only routes from regular users
 */

import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  // Only allow ADMIN and SUPER_ADMIN
  if (user?.userType !== 'ADMIN' && user?.userType !== 'SUPER_ADMIN') {
    return <Navigate to="/map" replace />
  }

  return <>{children}</>
}
