/**
 * Reservation API Functions
 * Purpose: Handle all reservation-related API calls
 * Inputs: Reservation data and query parameters
 * Outputs: API responses with reservation data
 */

import { apiClient } from './client'
import { CreateReservationInput } from '@/models/reservation'

const RESERVATION_BASE_URL = '/reservations'
const RESERVABLE_PLACES_URL = '/reservable-places'

// Get all reservations (admin)
export const getAllReservations = async (params?: {
  status?: string
  eventType?: string
  eventNature?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) => {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString())
    })
  }
  const response = await apiClient.get(`${RESERVATION_BASE_URL}?${queryParams}`) as any
  return response
}

// Get user's reservations
export const getMyReservations = async () => {
  const response = await apiClient.get(`${RESERVATION_BASE_URL}/my-reservations`) as any
  return response.data
}

// Generate PDF for reservation
export const generateReservationPDF = async (reservationId: string) => {
  const token = localStorage.getItem('token')
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  
  const response = await fetch(`${apiUrl}/api${RESERVATION_BASE_URL}/${reservationId}/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    let errorMessage = 'Failed to generate PDF'
    try {
      const error = await response.json()
      errorMessage = error.error || errorMessage
    } catch {
      errorMessage = `Server error: ${response.status} ${response.statusText}`
    }
    throw new Error(errorMessage)
  }
  
  const blob = await response.blob()
  return blob
}

// Get single reservation by ID
export const getReservationById = async (id: string) => {
  const response = await apiClient.get(`${RESERVATION_BASE_URL}/${id}`) as any
  return response.data
}

// Create new reservation
export const createReservation = async (data: CreateReservationInput) => {
  const response = await apiClient.post(RESERVATION_BASE_URL, data) as any
  return response.data
}

// Update reservation
export const updateReservation = async (id: string, data: Partial<CreateReservationInput>) => {
  const response = await apiClient.put(`${RESERVATION_BASE_URL}/${id}`, data) as any
  return response.data
}

// Delete reservation
export const deleteReservation = async (id: string) => {
  const response = await apiClient.delete(`${RESERVATION_BASE_URL}/${id}`) as any
  return response.data
}

// Approve reservation (admin)
export const approveReservation = async (id: string, notes?: string) => {
  const response = await apiClient.post(`${RESERVATION_BASE_URL}/${id}/approve`, { notes }) as any
  return response.data
}

// Reject reservation (admin)
export const rejectReservation = async (id: string, reason: string) => {
  const response = await apiClient.post(`${RESERVATION_BASE_URL}/${id}/reject`, { reason }) as any
  return response.data
}

// Cancel reservation (user)
export const cancelReservation = async (id: string) => {
  const response = await apiClient.post(`${RESERVATION_BASE_URL}/${id}/cancel`) as any
  return response.data
}

// Get all reservable places
export const getReservablePlaces = async (params?: {
  type?: 'building' | 'location' | 'openSpace'
  campusId?: string
  isReservable?: boolean
}) => {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString())
    })
  }
  const response = await apiClient.get(`${RESERVABLE_PLACES_URL}?${queryParams}`) as any
  return response.data
}

// Get reservable buildings
export const getReservableBuildings = async (campusId?: string) => {
  const queryParams = campusId ? `?campusId=${campusId}` : ''
  const response = await apiClient.get(`${RESERVABLE_PLACES_URL}/buildings${queryParams}`) as any
  return response.data
  return (response as any).data
}

// Get reservable locations
export const getReservableLocations = async (buildingId?: string) => {
  const queryParams = buildingId ? `?buildingId=${buildingId}` : ''
  const response = await apiClient.get(`${RESERVABLE_PLACES_URL}/locations${queryParams}`)
  return (response as any).data
}

// Get reservable open spaces
export const getReservableOpenSpaces = async (campusId?: string) => {
  const queryParams = campusId ? `?campusId=${campusId}` : ''
  const response = await apiClient.get(`${RESERVABLE_PLACES_URL}/open-spaces${queryParams}`)
  return (response as any).data
}

// Toggle place reservable status (admin)
export const togglePlaceReservable = async (
  type: 'building' | 'location' | 'openSpace',
  id: string,
  isReservable: boolean
) => {
  const response = await apiClient.patch(`${RESERVABLE_PLACES_URL}/${type}/${id}`, {
    isReservable
  })
  return (response as any).data
}

// Check availability for a place
export const checkAvailability = async (
  resourceType: 'building' | 'location' | 'openSpace',
  resourceId: string,
  startDate: string,
  endDate: string
) => {
  const response = await apiClient.post(`${RESERVATION_BASE_URL}/check-availability`, {
    resourceType,
    resourceId,
    startDate,
    endDate
  })
  return (response as any).data
}

// Get reservation statistics (admin)
export const getReservationStats = async () => {
  const response = await apiClient.get(`${RESERVATION_BASE_URL}/stats`)
  return (response as any).data
}
