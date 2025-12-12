/**
 * MapSidebar Component
 * Purpose: Left sidebar for map with agenda and reservation functionality
 * Inputs: user data, onReservationClick callback
 * Outputs: Sidebar with conditional buttons based on user role
 */

import { Calendar, MapPin } from 'lucide-react'
import { Button } from './ui/Button'

interface MapSidebarProps {
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    userType?: string
  }
  onReservationClick: () => void
  onAgendaClick: () => void
}

export function MapSidebar({ user, onReservationClick, onAgendaClick }: MapSidebarProps) {
  // Check if user is permanent staff
  const isPermanentStaff = user?.userType === 'PERMANENT' || user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN'

  return (
    <div className="fixed left-0 top-20 w-16 h-[calc(100vh-5rem)] bg-white border-r border-gray-200 shadow-lg z-30">
      {/* Content */}
      <div className="flex flex-col items-center p-2 space-y-2">
        {/* Agenda Button */}
        <Button
          onClick={onAgendaClick}
          variant="outline"
          size="sm"
          className="w-12 h-12 p-0 flex items-center justify-center"
        >
          <Calendar className="w-5 h-5 text-blue-600" />
        </Button>

        {/* Reservation Button - Only for permanent staff */}
        {isPermanentStaff && (
          <Button
            onClick={onReservationClick}
            size="sm"
            className="w-12 h-12 p-0 flex items-center justify-center"
          >
            <MapPin className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
