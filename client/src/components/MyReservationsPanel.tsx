/**
 * MyReservationsPanel Component
 * Purpose: Display user's reservations in a modal panel on the map
 * Inputs: onClose callback
 * Outputs: Modal with user's reservations list
 */

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, XCircle, CheckCircle, AlertCircle, X, Users, FileText } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'

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

interface MyReservationsPanelProps {
  onClose: () => void
}

export function MyReservationsPanel({ onClose }: MyReservationsPanelProps) {
  const toast = useToast()
  const { user } = useAuthStore()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-card rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {selectedReservation && (
              <button
                onClick={() => setSelectedReservation(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors sm:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg sm:text-xl font-bold">
              {selectedReservation ? 'Reservation Details' : 'My Reservations'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reservations yet</h3>
              <p className="text-gray-500">You haven't made any event reservations</p>
            </div>
          ) : selectedReservation ? (
            /* Detail View */
            <div className="max-w-4xl mx-auto">
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-6 border-b">
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(selectedReservation.status)}`}>
                      {getStatusIcon(selectedReservation.status)}
                      {selectedReservation.status}
                    </span>
                  </div>
                  
                  <div className="w-16 h-16 rounded-lg bg-white/80 flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 pr-20">
                    {selectedReservation.eventTitle}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                      {selectedReservation.eventType === 'institutional' ? 'Institutional' : 'Scientific'}
                    </span>
                    {selectedReservation.eventNature && (
                      <span className="px-3 py-1 border border-border rounded text-sm">
                        {selectedReservation.eventNature === 'internal' ? 'Internal (UM6P)' : 'External'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details - Scrollable */}
                <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Event Details Section */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-base flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4" />
                      Event Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      {(selectedReservation as any).eventDescription && (
                        <div>
                          <span className="text-muted-foreground">Description:</span>
                          <p className="mt-1">{(selectedReservation as any).eventDescription}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Start:</span>
                          <p>{selectedReservation.startDate} {selectedReservation.startTime}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">End:</span>
                          <p>{selectedReservation.endDate} {selectedReservation.endTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  {selectedReservation.selectedLocationName && (
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-base flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4" />
                        Location
                      </h4>
                      <div className="text-sm">
                        <p className="font-medium">{selectedReservation.selectedLocationName}</p>
                        <p className="text-muted-foreground capitalize">{selectedReservation.selectedLocationType}</p>
                      </div>
                    </div>
                  )}

                  {/* Audience Section */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-base flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4" />
                      Target Audience
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedReservation.expectedParticipantCount && (
                        <div>
                          <span className="text-muted-foreground">Expected Participants:</span>
                          <p>{selectedReservation.expectedParticipantCount}</p>
                        </div>
                      )}
                      {(selectedReservation as any).targetProfiles && (
                        <div>
                          <span className="text-muted-foreground">Target Profiles:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {JSON.parse((selectedReservation as any).targetProfiles).map((profile: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">{profile}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {((selectedReservation as any).mainObjectives || (selectedReservation as any).expectedImpact) && (
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-base flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4" />
                        Objectives & Impact
                      </h4>
                      <div className="space-y-2 text-sm">
                        {(selectedReservation as any).mainObjectives && (
                          <div>
                            <span className="text-muted-foreground">Main Objectives:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {JSON.parse((selectedReservation as any).mainObjectives).map((obj: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">{obj}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(selectedReservation as any).expectedImpact && (
                          <div>
                            <span className="text-muted-foreground">Expected Impact:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {JSON.parse((selectedReservation as any).expectedImpact).map((impact: string, i: number) => (
                                <span key={i} className="px-2 py-1 border border-border rounded text-xs">{impact}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedReservation.status === 'PENDING' && (
                    <div className="pt-4 border-t">
                      <button
                        onClick={() => handleCancelReservation(selectedReservation.id)}
                        disabled={cancellingId === selectedReservation.id}
                        className="w-full sm:w-auto px-4 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      >
                        {cancellingId === selectedReservation.id ? (
                          <>
                            <span className="inline-block w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 inline mr-1" />
                            Cancel Reservation
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  onClick={() => setSelectedReservation(reservation)}
                  className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
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
                    
                    <h3 className="font-semibold text-base line-clamp-2 mb-1 pr-20">
                      {reservation.eventTitle}
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Event Type */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded">
                        {reservation.eventType === 'institutional' ? 'Institutional' : 'Scientific'}
                      </span>
                      {reservation.eventNature && (
                        <span className="px-2 py-1 border border-border rounded">
                          {reservation.eventNature === 'internal' ? 'Internal' : 'External'}
                        </span>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Location */}
                    {reservation.selectedLocationName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{reservation.selectedLocationName}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {reservation.status === 'PENDING' && (
                      <div className="pt-3 border-t">
                        <button
                          onClick={() => handleCancelReservation(reservation.id)}
                          disabled={cancellingId === reservation.id}
                          className="w-full px-3 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          {cancellingId === reservation.id ? (
                            <>
                              <span className="inline-block w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 inline mr-1" />
                              Cancel
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
