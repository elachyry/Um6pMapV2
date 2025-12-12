/**
 * MyReservations Component
 * Purpose: Display user's own reservations with ability to cancel pending ones
 * Inputs: None (fetches user's reservations from API)
 * Outputs: List of user reservations with cancel functionality
 */

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, XCircle, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'

interface Reservation {
  id: string
  eventTitle: string
  eventType: string
  eventNature: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  status: string
  selectedLocationName: string
  selectedLocationType: string
  expectedParticipantCount: string
  createdAt: string
}

export default function MyReservations() {
  const toast = useToast()
  const { user } = useAuthStore()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMyReservations()
  }, [])

  const fetchMyReservations = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reservations?userId=${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      const result = await response.json()
      if (result.success) {
        setReservations(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (reservationId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return
    }

    setCancellingId(reservationId)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reservations/${reservationId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (response.ok) {
        toast.success('Reservation cancelled successfully')
        await fetchMyReservations()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to cancel reservation')
      }
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
      toast.error('Failed to cancel reservation')
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />
      case 'PENDING':
      case 'UNDER_REVIEW':
        return <Clock className="w-4 h-4" />
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Reservations</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your event reservations
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : reservations.length === 0 ? (
          /* Empty State */
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reservations yet</h3>
            <p className="text-gray-500">You haven't made any event reservations</p>
          </Card>
        ) : (
          /* Reservations Grid */
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {reservations.map((reservation) => (
              <Card 
                key={reservation.id}
                className="overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-b">
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(reservation.status)}`}>
                      {getStatusIcon(reservation.status)}
                      {reservation.status}
                    </span>
                  </div>
                  
                  {/* Event Icon */}
                  <div className="w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  
                  <h3 className="font-semibold text-lg line-clamp-2 mb-1 pr-20">
                    {reservation.eventTitle}
                  </h3>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-3">
                  {/* Event Type */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {reservation.eventType === 'institutional' ? 'Institutional' : 'Scientific'}
                    </Badge>
                    {reservation.eventNature && (
                      <Badge variant="outline" className="text-xs">
                        {reservation.eventNature === 'internal' ? 'Internal' : 'External'}
                      </Badge>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Location */}
                  {reservation.selectedLocationName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{reservation.selectedLocationName}</span>
                    </div>
                  )}

                  {/* Participants */}
                  {reservation.expectedParticipantCount && (
                    <div className="text-sm text-gray-600">
                      <strong>Participants:</strong> {reservation.expectedParticipantCount}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t flex gap-2">
                    {reservation.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleCancelReservation(reservation.id)}
                        disabled={cancellingId === reservation.id}
                      >
                        {cancellingId === reservation.id ? (
                          <>
                            <span className="inline-block w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
