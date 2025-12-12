/**
 * ReservationsManagement Component
 * Purpose: Admin dashboard for managing reservations and reservable places
 * Inputs: None (fetches data from API)
 * Outputs: Reservation list and reservable places management
 */

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Filter,
  Search,
  Plus,
  Settings,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Trees,
  DollarSign,
  FileText,
  Download
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getAllReservations, generateReservationPDF } from '@/api/reservationApi'
import { useToast } from '@/hooks/useToast'
import { ReservationForm } from '@/components/ReservationForm'

// Tabs for the reservation management
enum ReservationTab {
  ALL_RESERVATIONS = 'all',
  CALENDAR = 'calendar',
  RESERVABLE_PLACES = 'reservablePlaces'
}

// Sub-tabs for Reservable Places
enum ReservablePlaceTab {
  BUILDINGS = 'buildings',
  LOCATIONS = 'locations',
  OPEN_SPACES = 'openSpaces'
}

// Mock data types (replace with actual API types)
interface Reservation {
  id: string
  projectLeaderName: string
  entityDepartment: string
  eventTitle: string
  eventType: string
  eventNature: string
  startDate: string
  endDate: string
  status: string
  validationStatus: string
  resourceType: string
  proposedVenue?: string
  submissionDate: string
  expectedParticipantCount: string
  estimatedBudget: string
}

interface ReservablePlace {
  id: string
  name: string
  type: 'building' | 'location' | 'openSpace'
  capacity?: number
  isReservable: boolean
  campus?: string
  description?: string
  imageUrl?: string
}

export function ReservationsManagement() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<ReservationTab>(ReservationTab.ALL_RESERVATIONS)
  const [activeSubTab, setActiveSubTab] = useState<ReservablePlaceTab>(ReservablePlaceTab.BUILDINGS)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reservationPage, setReservationPage] = useState(1)
  const [reservationTotalPages, setReservationTotalPages] = useState(1)
  const [totalReservations, setTotalReservations] = useState(0)
  const [isLoadingReservations, setIsLoadingReservations] = useState(false)
  
  // Buildings state with pagination
  const [buildings, setBuildings] = useState<ReservablePlace[]>([])
  const [buildingPage, setBuildingPage] = useState(1)
  const [buildingTotalPages, setBuildingTotalPages] = useState(1)
  const [totalBuildings, setTotalBuildings] = useState(0)
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false)
  
  // Locations state with pagination
  const [locations, setLocations] = useState<ReservablePlace[]>([])
  const [locationPage, setLocationPage] = useState(1)
  const [locationTotalPages, setLocationTotalPages] = useState(1)
  const [totalLocations, setTotalLocations] = useState(0)
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  
  // Open Spaces state with pagination
  const [openSpaces, setOpenSpaces] = useState<ReservablePlace[]>([])
  const [openSpacePage, setOpenSpacePage] = useState(1)
  const [openSpaceTotalPages, setOpenSpaceTotalPages] = useState(1)
  const [totalOpenSpaces, setTotalOpenSpaces] = useState(0)
  const [isLoadingOpenSpaces, setIsLoadingOpenSpaces] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showReservationDetail, setShowReservationDetail] = useState(false)
  const [showPlaceModal, setShowPlaceModal] = useState(false)
  
  // Approval/Rejection state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'review'>('approve')
  const [committeeComments, setCommitteeComments] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [showNewReservationForm, setShowNewReservationForm] = useState(false)
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  // Moroccan Holidays (2024-2025)
  const moroccanHolidays: { [key: string]: string } = {
    // 2024
    '2024-01-01': 'New Year\'s Day',
    '2024-01-11': 'Independence Manifesto Day',
    '2024-04-10': 'Eid al-Fitr (estimated)',
    '2024-04-11': 'Eid al-Fitr (estimated)',
    '2024-05-01': 'Labour Day',
    '2024-06-17': 'Eid al-Adha (estimated)',
    '2024-07-07': 'Islamic New Year (estimated)',
    '2024-07-30': 'Throne Day',
    '2024-08-14': 'Oued Ed-Dahab Day',
    '2024-08-20': 'Revolution Day',
    '2024-08-21': 'Youth Day',
    '2024-09-16': 'Mawlid (estimated)',
    '2024-11-06': 'Green March Day',
    '2024-11-18': 'Independence Day',
    // 2025
    '2025-01-01': 'New Year\'s Day',
    '2025-01-11': 'Independence Manifesto Day',
    '2025-03-30': 'Eid al-Fitr (estimated)',
    '2025-03-31': 'Eid al-Fitr (estimated)',
    '2025-05-01': 'Labour Day',
    '2025-06-06': 'Eid al-Adha (estimated)',
    '2025-06-26': 'Islamic New Year (estimated)',
    '2025-07-30': 'Throne Day',
    '2025-08-14': 'Oued Ed-Dahab Day',
    '2025-08-20': 'Revolution Day',
    '2025-08-21': 'Youth Day',
    '2025-09-04': 'Mawlid (estimated)',
    '2025-11-06': 'Green March Day',
    '2025-11-18': 'Independence Day',
  }
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [placeToToggle, setPlaceToToggle] = useState<{
    id: string
    name: string
    type: 'building' | 'location' | 'openSpace'
    currentStatus: boolean
  } | null>(null)
  
  // Constants for pagination
  const BUILDINGS_PER_PAGE = 12
  const LOCATIONS_PER_PAGE = 12
  const OPEN_SPACES_PER_PAGE = 12

  // Fetch reservations
  useEffect(() => {
    fetchReservations()
    fetchReservablePlaces()
  }, [])
  
  // Refetch reservations when filters or pagination change
  useEffect(() => {
    if (activeTab === ReservationTab.ALL_RESERVATIONS) {
      fetchReservations()
    }
  }, [reservationPage, statusFilter, typeFilter])

  // Fetch data when active tab or sub-tab changes
  useEffect(() => {
    if (activeTab === ReservationTab.RESERVABLE_PLACES) {
      if (activeSubTab === ReservablePlaceTab.BUILDINGS) {
        fetchBuildings()
      } else if (activeSubTab === ReservablePlaceTab.LOCATIONS) {
        fetchLocations()
      } else if (activeSubTab === ReservablePlaceTab.OPEN_SPACES) {
        fetchOpenSpaces()
      }
    }
  }, [activeTab, activeSubTab])

  // Fetch buildings when pagination or search changes
  useEffect(() => {
    if (activeTab === ReservationTab.RESERVABLE_PLACES && activeSubTab === ReservablePlaceTab.BUILDINGS) {
      fetchBuildings()
    }
  }, [buildingPage, searchQuery])

  // Fetch locations when pagination changes
  useEffect(() => {
    if (activeTab === ReservationTab.RESERVABLE_PLACES && activeSubTab === ReservablePlaceTab.LOCATIONS) {
      fetchLocations()
    }
  }, [locationPage, searchQuery])

  // Fetch open spaces when pagination or search changes
  useEffect(() => {
    if (activeTab === ReservationTab.RESERVABLE_PLACES && activeSubTab === ReservablePlaceTab.OPEN_SPACES) {
      fetchOpenSpaces()
    }
  }, [openSpacePage, searchQuery])

  const fetchReservations = async () => {
    setLoading(true)
    setIsLoadingReservations(true)
    try {
      const params: any = {
        page: reservationPage,
        limit: 20
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      if (typeFilter && typeFilter !== 'all') {
        params.eventType = typeFilter
      }
      
      const response = await getAllReservations(params)
      
      if (response.data) {
        setReservations(response.data)
        setTotalReservations(response.total || 0)
        setReservationTotalPages(response.totalPages || 1)
      }
    } catch (error: any) {
      console.error('Failed to fetch reservations:', error)
      toast.error(error.message || 'Failed to load reservations')
      setReservations([])
    } finally {
      setLoading(false)
      setIsLoadingReservations(false)
    }
  }

  const fetchReservablePlaces = async () => {
    // Trigger individual fetches based on active tab
    if (activeTab === ReservationTab.RESERVABLE_PLACES) {
      if (activeSubTab === ReservablePlaceTab.BUILDINGS) {
        fetchBuildings()
      } else if (activeSubTab === ReservablePlaceTab.LOCATIONS) {
        fetchLocations()
      } else if (activeSubTab === ReservablePlaceTab.OPEN_SPACES) {
        fetchOpenSpaces()
      }
    }
  }

  const fetchBuildings = async () => {
    setIsLoadingBuildings(true)
    try {
      const { getAllBuildings } = await import('../../api/buildingApi')
      const response = await getAllBuildings(buildingPage, BUILDINGS_PER_PAGE, searchQuery)
      
      const buildingsData = (response as any)?.data?.buildings || (response as any)?.data || []
      if (Array.isArray(buildingsData)) {
        const buildingsArray: ReservablePlace[] = buildingsData.map((building: any) => ({
          id: building.id,
          name: building.name,
          type: 'building' as const,
          capacity: building.capacity,
          isReservable: building.isReservable || false,
          campus: building.campus?.name,
          description: building.description,
          imageUrl: building.images?.[0]?.imageUrl
        }))
        
        // Sort reservable places to the top
        buildingsArray.sort((a, b) => {
          if (a.isReservable && !b.isReservable) return -1
          if (!a.isReservable && b.isReservable) return 1
          return a.name.localeCompare(b.name)
        })
        
        setBuildings(buildingsArray)
        setBuildingTotalPages((response as any)?.pagination?.totalPages || 1)
        setTotalBuildings((response as any)?.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch buildings:', error)
    } finally {
      setIsLoadingBuildings(false)
    }
  }

  const fetchLocations = async () => {
    setIsLoadingLocations(true)
    try {
      const { getLocations } = await import('../../api/locationApi')
      const response = await getLocations(locationPage, LOCATIONS_PER_PAGE)
      
      const locationsData = (response as any)?.data?.locations || (response as any)?.data || []
      if (Array.isArray(locationsData)) {
        const locationsArray: ReservablePlace[] = locationsData.map((location: any) => ({
          id: location.id,
          name: location.name,
          type: 'location' as const,
          capacity: location.capacity,
          isReservable: location.isReservable || false,
          campus: location.building?.campus?.name,
          description: location.description,
          imageUrl: location.images?.[0]?.imageUrl
        }))
        
        // Sort reservable places to the top
        locationsArray.sort((a, b) => {
          if (a.isReservable && !b.isReservable) return -1
          if (!a.isReservable && b.isReservable) return 1
          return a.name.localeCompare(b.name)
        })
        
        setLocations(locationsArray)
        setLocationTotalPages((response as any)?.pagination?.totalPages || 1)
        setTotalLocations((response as any)?.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setIsLoadingLocations(false)
    }
  }

  const fetchOpenSpaces = async () => {
    setIsLoadingOpenSpaces(true)
    try {
      const { getOpenSpaces } = await import('../../api/openSpaceApi')
      const response = await getOpenSpaces(openSpacePage, OPEN_SPACES_PER_PAGE, searchQuery)
      
      const openSpacesData = (response as any)?.data?.openSpaces || (response as any)?.data || []
      if (Array.isArray(openSpacesData)) {
        const openSpacesArray: ReservablePlace[] = openSpacesData.map((openSpace: any) => ({
          id: openSpace.id,
          name: openSpace.name,
          type: 'openSpace' as const,
          capacity: openSpace.capacity,
          isReservable: openSpace.isReservable || false,
          campus: openSpace.campus?.name,
          description: openSpace.description,
          imageUrl: openSpace.images?.[0]?.imageUrl
        }))
        
        // Sort reservable places to the top
        openSpacesArray.sort((a, b) => {
          if (a.isReservable && !b.isReservable) return -1
          if (!a.isReservable && b.isReservable) return 1
          return a.name.localeCompare(b.name)
        })
        
        setOpenSpaces(openSpacesArray)
        setOpenSpaceTotalPages((response as any)?.pagination?.totalPages || 1)
        setTotalOpenSpaces((response as any)?.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch open spaces:', error)
    } finally {
      setIsLoadingOpenSpaces(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'building':
        return <Building2 className="w-4 h-4" />
      case 'location':
        return <MapPin className="w-4 h-4" />
      case 'openSpace':
        return <MapPin className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.projectLeaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.entityDepartment.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter
    const matchesType = typeFilter === 'all' || reservation.eventType === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Filter functions for each type
  const getFilteredPlaces = (places: ReservablePlace[]) => {
    return places.filter(place => 
      place.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const filteredBuildings = getFilteredPlaces(buildings)
  const filteredLocations = getFilteredPlaces(locations)
  const filteredOpenSpaces = getFilteredPlaces(openSpaces)

  // Handle showing confirmation dialog
  const handleToggleClick = (placeId: string, placeType: 'building' | 'location' | 'openSpace') => {
    // Find the place to get current status
    let place: ReservablePlace | undefined
    if (placeType === 'building') {
      place = buildings.find(p => p.id === placeId)
    } else if (placeType === 'location') {
      place = locations.find(p => p.id === placeId)
    } else if (placeType === 'openSpace') {
      place = openSpaces.find(p => p.id === placeId)
    }
    
    if (!place) return

    setPlaceToToggle({
      id: placeId,
      name: place.name,
      type: placeType,
      currentStatus: place.isReservable
    })
    setShowConfirmDialog(true)
  }

  // Confirm and execute the toggle
  const confirmToggleReservable = async () => {
    if (!placeToToggle) return

    try {
      const newStatus = !placeToToggle.currentStatus

      // Import the appropriate API function
      if (placeToToggle.type === 'building') {
        const { updateBuilding } = await import('../../api/buildingApi')
        await updateBuilding(placeToToggle.id, { isReservable: newStatus })
        setBuildings(prev => prev.map(p =>
          p.id === placeToToggle.id ? { ...p, isReservable: newStatus } : p
        ))
      } else if (placeToToggle.type === 'location') {
        const { updateLocation } = await import('../../api/locationApi')
        await updateLocation(placeToToggle.id, { isReservable: newStatus })
        setLocations(prev => prev.map(p =>
          p.id === placeToToggle.id ? { ...p, isReservable: newStatus } : p
        ))
      } else if (placeToToggle.type === 'openSpace') {
        const { updateOpenSpace } = await import('../../api/openSpaceApi')
        await updateOpenSpace(placeToToggle.id, { isReservable: newStatus })
        setOpenSpaces(prev => prev.map(p =>
          p.id === placeToToggle.id ? { ...p, isReservable: newStatus } : p
        ))
      }

      console.log(`✅ ${placeToToggle.name} is now ${newStatus ? 'reservable' : 'not reservable'}`)
      
      // Close dialog and reset state
      setShowConfirmDialog(false)
      setPlaceToToggle(null)
    } catch (error) {
      console.error('Failed to update place:', error)
      alert('Failed to update reservable status. Please try again.')
    }
  }

  // Cancel confirmation
  const cancelToggle = () => {
    setShowConfirmDialog(false)
    setPlaceToToggle(null)
  }

  // Handle PDF download
  const handleDownloadPDF = async (reservationId: string, eventTitle: string) => {
    setIsDownloadingPDF(true)
    try {
      const blob = await generateReservationPDF(reservationId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reservation-${reservationId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success(`PDF downloaded successfully for "${eventTitle}"`)
    } catch (error) {
      console.error('Failed to download PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  // Handle approve/reject actions
  const handleApproveClick = () => {
    setApprovalAction('approve')
    setCommitteeComments('')
    setRejectionReason('')
    setShowApprovalDialog(true)
  }

  const handleRejectClick = () => {
    setApprovalAction('reject')
    setCommitteeComments('')
    setRejectionReason('')
    setReviewNotes('')
    setShowApprovalDialog(true)
  }

  const handleReviewClick = () => {
    setApprovalAction('review')
    setCommitteeComments('')
    setRejectionReason('')
    setReviewNotes('')
    setShowApprovalDialog(true)
  }

  const handleConfirmApproval = async (forceApprove = false) => {
    if (!selectedReservation) return
    
    // Validation
    if (approvalAction === 'review') {
      if (!reviewNotes.trim()) {
        toast.error('Review notes are required')
        return
      }
    } else {
      if (!committeeComments.trim()) {
        toast.error('Committee comments are required')
        return
      }
      
      if (approvalAction === 'reject' && !rejectionReason.trim()) {
        toast.error('Rejection reason is required')
        return
      }
    }
    
    setIsSubmittingApproval(true)
    
    try {
      const endpoint = approvalAction === 'approve' 
        ? `/api/reservations/${(selectedReservation as any).id}/approve`
        : approvalAction === 'reject'
        ? `/api/reservations/${(selectedReservation as any).id}/reject`
        : `/api/reservations/${(selectedReservation as any).id}/review`
      
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...(approvalAction === 'review' ? { reviewNotes } : { committeeComments }),
          ...(approvalAction === 'reject' && { rejectionReason }),
          ...(approvalAction === 'approve' && { forceApprove })
        })
      })
      
      const responseData = await apiResponse.json()
      
      // Handle conflict error
      if (apiResponse.status === 409 && responseData.code === 'EVENT_CONFLICT') {
        setIsSubmittingApproval(false)
        
        const conflictMessages = responseData.conflicts.map((c: any) => 
          `• ${c.eventTitle} (${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()})`
        ).join('\n')
        
        const confirmMessage = `⚠️ Event Conflict Detected!\n\nThe following events overlap with this reservation:\n${conflictMessages}\n\n${responseData.suggestions.join('\n')}\n\nDo you want to approve anyway?`
        
        if (window.confirm(confirmMessage)) {
          return handleConfirmApproval(true) // Retry with force approve
        }
        return
      }
      
      if (!apiResponse.ok) {
        throw new Error(responseData.error || `Failed to ${approvalAction} reservation`)
      }
      
      const actionText = approvalAction === 'approve' ? 'approved' : approvalAction === 'reject' ? 'rejected' : 'reviewed'
      toast.success(`Reservation ${actionText} successfully!`)
      
      // Refresh reservations list
      const refreshResponse = await getAllReservations({
        page: 1,
        limit: 50,
        status: statusFilter === 'all' ? undefined : statusFilter
      })
      
      if (refreshResponse.data) {
        setReservations(refreshResponse.data)
      }
      
      // Close dialogs
      setShowApprovalDialog(false)
      setShowReservationDetail(false)
      setSelectedReservation(null)
      
    } catch (error) {
      console.error(`Failed to ${approvalAction} reservation:`, error)
      toast.error(`Failed to ${approvalAction} reservation. Please try again.`)
    } finally {
      setIsSubmittingApproval(false)
    }
  }

  const renderPlacesGrid = (places: ReservablePlace[]) => {
    const filteredPlaces = places.filter(place => 
      place.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    return (
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPlaces.map((place) => (
          <Card 
            key={place.id} 
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm"
          >
            {/* Image Section */}
            <div className="aspect-video bg-muted relative overflow-hidden group-hover:shadow-inner">
              {place.imageUrl ? (
                <img 
                  src={place.imageUrl} 
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  {place.type === 'building' && <Building2 className="w-8 h-8 text-blue-600" />}
                  {place.type === 'location' && <MapPin className="w-8 h-8 text-green-600" />}
                  {place.type === 'openSpace' && <Trees className="w-8 h-8 text-purple-600" />}
                </div>
              )}
              
              {/* Reservable Badge */}
              {place.isReservable && (
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Reservable
                  </span>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {place.name}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize mb-1">
                    {place.type === 'openSpace' ? 'Open Space' : place.type}
                  </p>
                  {place.campus && (
                    <p className="text-xs text-muted-foreground">
                      📍 {place.campus}
                    </p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                {place.capacity && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{place.capacity} people</span>
                  </div>
                )}
                {place.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {place.description}
                  </p>
                )}
              </div>

              {/* Toggle Section */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleClick(place.id, place.type)
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      place.isReservable ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        place.isReservable ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-medium text-gray-700">
                    {place.isReservable ? 'Available' : 'Disabled'}
                  </span>
                </div>
                
                <div className={`w-2 h-2 rounded-full ${
                  place.isReservable ? 'bg-green-400' : 'bg-gray-300'
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Pagination component helper
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number,
    itemType: string,
    setPage: (page: number) => void
  ) => {
    if (totalPages <= 1) return null

    return (
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {itemType}
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reservations Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage event reservations and configure reservable places
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowNewReservationForm(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Reservation
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab(ReservationTab.ALL_RESERVATIONS)}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 ${
                activeTab === ReservationTab.ALL_RESERVATIONS
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              All Reservations
              {activeTab === ReservationTab.ALL_RESERVATIONS && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab(ReservationTab.CALENDAR)}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 ${
                activeTab === ReservationTab.CALENDAR
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
              {activeTab === ReservationTab.CALENDAR && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab(ReservationTab.RESERVABLE_PLACES)}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 ${
                activeTab === ReservationTab.RESERVABLE_PLACES
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Reservable Places
              {activeTab === ReservationTab.RESERVABLE_PLACES && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* All Reservations Tab */}
        {activeTab === ReservationTab.ALL_RESERVATIONS && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by event, leader, or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="INSTITUTIONAL">Institutional</option>
                    <option value="SCIENTIFIC_RESEARCH">Scientific & Research</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reservations Cards Grid */}
            {filteredReservations.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reservations found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query</p>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredReservations.map((reservation) => (
                  <Card 
                    key={reservation.id}
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedReservation(reservation)
                      setShowReservationDetail(true)
                    }}
                  >
                    {/* Header with gradient background */}
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
                      
                      <h3 className="font-semibold text-base md:text-lg line-clamp-2 mb-1 pr-20">
                        {reservation.eventTitle}
                      </h3>
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-3 md:p-4 space-y-3">
                      {/* Project Leader */}
                      <div className="flex items-start gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 line-clamp-1">{reservation.projectLeaderName}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{reservation.entityDepartment}</p>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {reservation.eventType === 'INSTITUTIONAL' ? 'Institutional' : 'Scientific'}
                        </Badge>
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          {reservation.eventNature}
                        </Badge>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {new Date(reservation.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(reservation.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {getResourceIcon(reservation.resourceType)}
                        <span className="line-clamp-1">{reservation.proposedVenue || 'Venue TBD'}</span>
                      </div>

                      {/* Footer Stats */}
                      <div className="pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{reservation.expectedParticipantCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{reservation.estimatedBudget}</span>
                        </div>
                      </div>

                      {/* Action Buttons - Visible on hover */}
                      <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button 
                          variant="secondary" 
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedReservation(reservation)
                            setShowReservationDetail(true)
                          }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredReservations.length > 0 && (
              <div className="mt-6">
                {renderPagination(
                  reservationPage,
                  reservationTotalPages,
                  totalReservations,
                  20,
                  'reservations',
                  setReservationPage
                )}
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === ReservationTab.CALENDAR && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11)
                      setCurrentYear(currentYear - 1)
                    } else {
                      setCurrentMonth(currentMonth - 1)
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    setCurrentMonth(today.getMonth())
                    setCurrentYear(today.getFullYear())
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0)
                      setCurrentYear(currentYear + 1)
                    } else {
                      setCurrentMonth(currentMonth + 1)
                    }
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mb-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-400"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm text-gray-600">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm text-gray-600">Rejected</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-gray-50 p-3 text-center font-semibold text-sm text-gray-700">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {(() => {
                const firstDay = new Date(currentYear, currentMonth, 1).getDay()
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
                const days = []

                // Empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                  days.push(
                    <div key={`empty-${i}`} className="bg-gray-50 min-h-[120px] p-2"></div>
                  )
                }

                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayReservations = reservations.filter((res: any) => {
                    const startDate = res.startDate
                    const endDate = res.endDate
                    return dateStr >= startDate && dateStr <= endDate
                  })

                  const today = new Date()
                  const currentDate = new Date(currentYear, currentMonth, day)
                  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                  
                  const isToday = 
                    day === today.getDate() &&
                    currentMonth === today.getMonth() &&
                    currentYear === today.getFullYear()
                  
                  const isPast = currentDate < todayDate
                  const holiday = moroccanHolidays[dateStr]

                  days.push(
                    <div
                      key={day}
                      className={`min-h-[120px] p-2 ${
                        isPast ? 'bg-gray-100' : 'bg-white'
                      } ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-sm font-medium ${
                          isToday ? 'text-primary' : 
                          isPast ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          {day}
                        </div>
                        {holiday && (
                          <div className="w-2 h-2 rounded-full bg-red-500" title={holiday}></div>
                        )}
                      </div>
                      
                      {holiday && (
                        <div className="text-xs text-red-600 font-medium mb-1 truncate" title={holiday}>
                          🇲🇦 {holiday}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {dayReservations.slice(0, 3).map((res: any) => {
                          const statusColor = 
                            res.status === 'PENDING' ? 'bg-yellow-400 hover:bg-yellow-500' :
                            res.status === 'APPROVED' ? 'bg-green-500 hover:bg-green-600' :
                            'bg-red-500 hover:bg-red-600'

                          return (
                            <button
                              key={res.id}
                              onClick={() => {
                                setSelectedReservation(res)
                                setShowReservationDetail(true)
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs text-white truncate transition-colors ${statusColor} ${
                                isPast ? 'opacity-60' : ''
                              }`}
                              title={res.eventTitle}
                            >
                              {res.eventTitle}
                            </button>
                          )
                        })}
                        {dayReservations.length > 3 && (
                          <div className={`text-xs px-2 ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                            +{dayReservations.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                return days
              })()}
            </div>
          </div>
        )}

        {/* Reservable Places Tab */}
        {activeTab === ReservationTab.RESERVABLE_PLACES && (
          <div>
            {/* Sub-tabs */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveSubTab(ReservablePlaceTab.BUILDINGS)}
                className={`pb-3 px-4 font-medium text-sm transition-colors relative flex items-center gap-2 ${
                  activeSubTab === ReservablePlaceTab.BUILDINGS
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Buildings
              </button>
              <button
                onClick={() => setActiveSubTab(ReservablePlaceTab.LOCATIONS)}
                className={`pb-3 px-4 font-medium text-sm transition-colors relative flex items-center gap-2 ${
                  activeSubTab === ReservablePlaceTab.LOCATIONS
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Locations
              </button>
              <button
                onClick={() => setActiveSubTab(ReservablePlaceTab.OPEN_SPACES)}
                className={`pb-3 px-4 font-medium text-sm transition-colors relative flex items-center gap-2 ${
                  activeSubTab === ReservablePlaceTab.OPEN_SPACES
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Trees className="w-4 h-4" />
                Open Spaces
              </button>
            </div>

            {/* Buildings Sub-tab */}
            {activeSubTab === ReservablePlaceTab.BUILDINGS && (
              <div>
            {/* Search Filter */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search buildings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {totalBuildings} buildings total
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoadingBuildings ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading buildings...</p>
                </div>
              </div>
            ) : buildings.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No buildings found</h3>
                  <p className="text-muted-foreground">Try adjusting your search query</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Buildings Grid */}
                {renderPlacesGrid(buildings, 'buildings')}
                
                {/* Pagination */}
                {renderPagination(
                  buildingPage,
                  buildingTotalPages,
                  totalBuildings,
                  BUILDINGS_PER_PAGE,
                  'buildings',
                  setBuildingPage
                )}
              </>
            )}
              </div>
            )}

            {/* Locations Sub-tab */}
            {activeSubTab === ReservablePlaceTab.LOCATIONS && (
              <div>
            {/* Search Filter */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {totalLocations} locations total
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoadingLocations ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading locations...</p>
                </div>
              </div>
            ) : locations.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations found</h3>
                  <p className="text-muted-foreground">Try adjusting your search query</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Locations Grid */}
                {renderPlacesGrid(locations, 'locations')}
                
                {/* Pagination */}
                {renderPagination(
                  locationPage,
                  locationTotalPages,
                  totalLocations,
                  LOCATIONS_PER_PAGE,
                  'locations',
                  setLocationPage
                )}
              </>
            )}
              </div>
            )}

            {/* Open Spaces Sub-tab */}
            {activeSubTab === ReservablePlaceTab.OPEN_SPACES && (
              <div>
            {/* Search Filter */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search open spaces..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {totalOpenSpaces} open spaces total
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoadingOpenSpaces ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading open spaces...</p>
                </div>
              </div>
            ) : openSpaces.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Trees className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No open spaces found</h3>
                  <p className="text-muted-foreground">Try adjusting your search query</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Open Spaces Grid */}
                {renderPlacesGrid(openSpaces, 'openSpaces')}
                
                {/* Pagination */}
                {renderPagination(
                  openSpacePage,
                  openSpaceTotalPages,
                  totalOpenSpaces,
                  OPEN_SPACES_PER_PAGE,
                  'open spaces',
                  setOpenSpacePage
                )}
              </>
            )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Reservation View Modal */}
      {showReservationDetail && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header - Sticky */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate">{(selectedReservation as any).eventTitle}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor((selectedReservation as any).status)}`}>
                    {getStatusIcon((selectedReservation as any).status)}
                    {(selectedReservation as any).status}
                  </span>
                  <span className="text-sm text-gray-500">
                    Submitted on {new Date((selectedReservation as any).createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReservationDetail(false)
                  setSelectedReservation(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Section 1: Applicant Information */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Applicant Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Project Leader</p>
                          <p className="font-medium">{(selectedReservation as any).projectLeaderName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="font-medium text-sm">{(selectedReservation as any).projectLeaderEmail}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="font-medium">{(selectedReservation as any).projectLeaderPhone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Entity</p>
                          <p className="font-medium">{(selectedReservation as any).entity || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Department</p>
                          <p className="font-medium">{(selectedReservation as any).department || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Submission Date</p>
                          <p className="font-medium">{new Date((selectedReservation as any).createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 2: Event Details */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        Event Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        <p className="text-sm">{(selectedReservation as any).eventDescription || 'No description provided'}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Event Nature</p>
                          <Badge variant="secondary">
                            {(selectedReservation as any).eventNature === 'internal' ? 'Internal (UM6P)' : 
                             (selectedReservation as any).eventNature === 'external' ? 'External' : 'N/A'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Event Type</p>
                          <Badge variant="secondary">{(selectedReservation as any).eventType}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Committee</p>
                          <p className="font-medium text-sm">{(selectedReservation as any).relevantCommittee || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Start</p>
                          <p className="font-medium text-sm">
                            {(selectedReservation as any).startDate} {(selectedReservation as any).startTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">End</p>
                          <p className="font-medium text-sm">
                            {(selectedReservation as any).endDate} {(selectedReservation as any).endTime}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estimated Duration</p>
                        <p className="font-medium">
                          {(() => {
                            const res = selectedReservation as any
                            if (res.startDate && res.endDate && res.startTime && res.endTime) {
                              const start = new Date(`${res.startDate}T${res.startTime}`)
                              const end = new Date(`${res.endDate}T${res.endTime}`)
                              const diffMs = end.getTime() - start.getTime()
                              const diffHours = diffMs / (1000 * 60 * 60)
                              const diffDays = Math.floor(diffHours / 24)
                              const remainingHours = diffHours % 24
                              
                              if (diffDays > 0) {
                                return `${diffDays} day${diffDays > 1 ? 's' : ''} ${remainingHours > 0 ? `and ${remainingHours.toFixed(1)} hour${remainingHours !== 1 ? 's' : ''}` : ''}`
                              } else {
                                return `${remainingHours.toFixed(1)} hour${remainingHours !== 1 ? 's' : ''}`
                              }
                            }
                            return res.estimatedDuration || 'N/A'
                          })()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 3: Event History & Impact */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Event History & Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Previous Edition</p>
                          <p className="font-medium">{(selectedReservation as any).hasPreviousEdition ? `Yes (${(selectedReservation as any).previousEditionYear})` : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Participant Count</p>
                          <p className="font-medium">{(selectedReservation as any).participantCount || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Media Visibility</p>
                          <Badge variant="outline">{(selectedReservation as any).mediaVisibility || 'N/A'}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">VIP Guests</p>
                          <p className="font-medium">{(selectedReservation as any).hasVIPGuests ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                      {(selectedReservation as any).vipGuestsDetails && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">VIP Details</p>
                          <p className="text-sm">{(selectedReservation as any).vipGuestsDetails}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 4: Objectives & Scope */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        Objectives & Scope
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Main Objectives</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).mainObjectives ? 
                            JSON.parse((selectedReservation as any).mainObjectives).map((obj: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{obj}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                        {(selectedReservation as any).mainObjectivesOther && (
                          <p className="text-sm mt-1"><strong>Other:</strong> {(selectedReservation as any).mainObjectivesOther}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Secondary Objectives</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).secondaryObjectives ? 
                            JSON.parse((selectedReservation as any).secondaryObjectives).map((obj: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{obj}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Geographical Scope</p>
                        <Badge variant="outline">{(selectedReservation as any).geographicalScope || 'N/A'}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expected Impact</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).expectedImpact ? 
                            JSON.parse((selectedReservation as any).expectedImpact).map((impact: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{impact}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 4b: Target Audience */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-600" />
                        Target Audience
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Target Profiles</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).targetProfiles ? 
                            JSON.parse((selectedReservation as any).targetProfiles).map((profile: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{profile}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expected Participant Count</p>
                        <p className="font-medium">{(selectedReservation as any).expectedParticipantCount || 'N/A'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 4c: Governance & Partners */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-600" />
                        Governance & Partners
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Event Manager</p>
                        {(selectedReservation as any).eventManagerName ? (
                          <div className="bg-gray-50 p-2 rounded text-sm">
                            <p><strong>Name:</strong> {(selectedReservation as any).eventManagerName}</p>
                            {(selectedReservation as any).eventManagerPosition && (
                              <p><strong>Position:</strong> {(selectedReservation as any).eventManagerPosition}</p>
                            )}
                            {(selectedReservation as any).eventManagerContact && (
                              <p><strong>Contact:</strong> {(selectedReservation as any).eventManagerContact}</p>
                            )}
                          </div>
                        ) : <span className="text-sm text-gray-400">N/A</span>}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Organizing Committee</p>
                        {(selectedReservation as any).organizingCommittee ? (
                          <div className="space-y-2">
                            {JSON.parse((selectedReservation as any).organizingCommittee).map((member: any, i: number) => (
                              <div key={i} className="bg-gray-50 p-2 rounded text-sm border-l-2 border-primary">
                                <p><strong>Name:</strong> {member.name}</p>
                                <p><strong>Role:</strong> {member.role}</p>
                                <p><strong>Entity:</strong> {member.entity}</p>
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-sm text-gray-400">N/A</span>}
                      </div>
                      {(selectedReservation as any).associatedPartners && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Associated Partners</p>
                          <p className="text-sm">{(selectedReservation as any).associatedPartners}</p>
                        </div>
                      )}
                      {(selectedReservation as any).protocolSupportRequired && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Protocol Support Required</p>
                          <div className="flex flex-wrap gap-1">
                            {(selectedReservation as any).protocolSupport ? 
                              JSON.parse((selectedReservation as any).protocolSupport).map((support: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{support}</Badge>
                              )) : <span className="text-sm text-gray-400">N/A</span>
                            }
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 4d: Program & Logistics */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-rose-600" />
                        Program & Logistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Program Format</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).programFormat ? 
                            JSON.parse((selectedReservation as any).programFormat).map((format: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{format}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                      </div>
                      {(selectedReservation as any).speakersStatus && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Speakers Status</p>
                          <p className="text-sm">{(selectedReservation as any).speakersStatus}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Side Activities</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).sideActivities ? 
                            JSON.parse((selectedReservation as any).sideActivities).map((activity: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{activity}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Required Equipment</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).requiredEquipment ? 
                            JSON.parse((selectedReservation as any).requiredEquipment).map((equipment: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{equipment}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                      </div>
                      {(selectedReservation as any).needsTransportAccommodation && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Transport & Accommodation</p>
                          <p className="text-sm">{(selectedReservation as any).transportAccommodationDetails || 'Required'}</p>
                        </div>
                      )}
                      {(selectedReservation as any).otherSpecificNeeds && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Other Specific Needs</p>
                          <p className="text-sm">{(selectedReservation as any).otherSpecificNeedsDetails || 'Yes'}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 4e: Communication & Visibility */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        Communication & Visibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Communication Objectives</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).communicationObjectives ? 
                            JSON.parse((selectedReservation as any).communicationObjectives).map((obj: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{obj}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Planned Actions</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).plannedActions ? 
                            JSON.parse((selectedReservation as any).plannedActions).map((action: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{action}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expected Visibility Level</p>
                        <Badge variant="secondary">{(selectedReservation as any).expectedVisibilityLevel || 'N/A'}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 5: Budget Details */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-yellow-600" />
                        Budget Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Overall Estimate</p>
                          <p className="font-bold text-lg">{(selectedReservation as any).overallEstimate || 'N/A'} MAD</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Estimated Sponsorship</p>
                          <p className="font-medium">{(selectedReservation as any).estimatedSponsorship || 'N/A'} MAD</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Agency</p>
                          <p className="font-medium">{(selectedReservation as any).agencyEstimate || '0'} MAD</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Catering</p>
                          <p className="font-medium">{(selectedReservation as any).cateringEstimate || '0'} MAD</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Transport</p>
                          <p className="font-medium">{(selectedReservation as any).transportEstimate || '0'} MAD</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Accommodation</p>
                          <p className="font-medium">{(selectedReservation as any).accommodationEstimate || '0'} MAD</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Flight</p>
                          <p className="font-medium">{(selectedReservation as any).flightEstimate || '0'} MAD</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Budget Estimate</p>
                          <p className="font-medium">{(selectedReservation as any).estimatedBudget || '0'} MAD</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Funding Sources</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedReservation as any).fundingSources ? 
                            JSON.parse((selectedReservation as any).fundingSources).map((source: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{source}</Badge>
                            )) : <span className="text-sm text-gray-400">N/A</span>
                          }
                        </div>
                      </div>
                      {(selectedReservation as any).budgetComments && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Comments</p>
                          <p className="text-sm">{(selectedReservation as any).budgetComments}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 6: Event Location */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        Event Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Location Type</p>
                          <Badge variant="secondary">{(selectedReservation as any).selectedLocationType || 'N/A'}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Location Name</p>
                          <p className="font-medium">{(selectedReservation as any).selectedLocationName || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Documents & Actions */}
                <div className="space-y-6">
                  {/* Documents Section */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-pink-600" />
                        Supporting Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {(selectedReservation as any).documents ? (
                        <div className="space-y-2">
                          {JSON.parse((selectedReservation as any).documents).map((doc: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <p className="text-xs text-gray-500">{doc.type}</p>
                              </div>
                              <a
                                href={doc.url}
                                download={doc.name}
                                className="p-1 hover:bg-white rounded"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // For Cloudinary URLs, we need to fetch and download with proper filename
                                  fetch(doc.url)
                                    .then(response => response.blob())
                                    .then(blob => {
                                      const url = window.URL.createObjectURL(blob)
                                      const link = document.createElement('a')
                                      link.href = url
                                      link.download = doc.name
                                      document.body.appendChild(link)
                                      link.click()
                                      document.body.removeChild(link)
                                      window.URL.revokeObjectURL(url)
                                    })
                                    .catch(error => {
                                      console.error('Download failed:', error)
                                      toast.error('Failed to download document')
                                    })
                                  e.preventDefault()
                                }}
                                title="Download document"
                              >
                                <Download className="w-4 h-4 text-green-600" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">No documents uploaded</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Validation Status */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                        Validation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <Badge variant="outline">{(selectedReservation as any).validationStatus}</Badge>
                      </div>
                      {(selectedReservation as any).committeeComments && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Committee Comments</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{(selectedReservation as any).committeeComments}</p>
                        </div>
                      )}
                      {(selectedReservation as any).reviewNotes && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Review Notes</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{(selectedReservation as any).reviewNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <CardTitle className="text-lg">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Expected Participants</span>
                        <span className="font-medium">{(selectedReservation as any).expectedParticipantCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-medium">
                          {(() => {
                            const res = selectedReservation as any
                            if (res.startDate && res.endDate && res.startTime && res.endTime) {
                              const start = new Date(`${res.startDate}T${res.startTime}`)
                              const end = new Date(`${res.endDate}T${res.endTime}`)
                              const diffMs = end.getTime() - start.getTime()
                              const diffHours = diffMs / (1000 * 60 * 60)
                              const diffDays = Math.floor(diffHours / 24)
                              const remainingHours = diffHours % 24
                              
                              if (diffDays > 0) {
                                return `${diffDays} day${diffDays > 1 ? 's' : ''} ${remainingHours > 0 ? `and ${remainingHours.toFixed(1)} hour${remainingHours !== 1 ? 's' : ''}` : ''}`
                              } else {
                                return `${remainingHours.toFixed(1)} hour${remainingHours !== 1 ? 's' : ''}`
                              }
                            }
                            return res.estimatedDuration || 'N/A'
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Visibility</span>
                        <span className="font-medium">{(selectedReservation as any).expectedVisibilityLevel || 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {((selectedReservation as any).status === 'APPROVED' || (selectedReservation as any).status === 'REJECTED') && (
                  <Button
                    variant="outline"
                    className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => handleDownloadPDF((selectedReservation as any).id, (selectedReservation as any).eventTitle)}
                    disabled={isDownloadingPDF}
                  >
                    {isDownloadingPDF ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReservationDetail(false)
                    setSelectedReservation(null)
                  }}
                >
                  Close
                </Button>
                {((selectedReservation as any).status === 'PENDING' || (selectedReservation as any).status === 'UNDER_REVIEW') && (
                  <>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={handleRejectClick}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    {(selectedReservation as any).status === 'PENDING' && (
                      <Button
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={handleReviewClick}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    )}
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleApproveClick}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onCancel={cancelToggle}
        onConfirm={confirmToggleReservable}
        title="Toggle Reservable Status"
        message={
          placeToToggle 
            ? `Are you sure you want to ${placeToToggle.currentStatus ? 'disable' : 'enable'} reservations for "${placeToToggle.name}"? ${
                placeToToggle.currentStatus 
                  ? 'Staff will no longer be able to select this place for reservations.' 
                  : 'Staff will be able to select this place for reservations.'
              }`
            : ''
        }
        confirmText={placeToToggle?.currentStatus ? 'Disable' : 'Enable'}
        variant={placeToToggle?.currentStatus ? 'danger' : 'default'}
      />

      {/* Approval/Rejection Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {approvalAction === 'approve' ? 'Approve Reservation' : approvalAction === 'reject' ? 'Reject Reservation' : 'Review Reservation'}
              </h2>
              <button
                onClick={() => setShowApprovalDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Review Notes - For review action */}
              {approvalAction === 'review' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter your review notes about this reservation..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes will be saved for internal review
                  </p>
                </div>
              ) : (
                /* Committee Comments - Required for approve/reject */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Committee Comments <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={committeeComments}
                    onChange={(e) => setCommitteeComments(e.target.value)}
                    placeholder="Enter committee comments about this reservation..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These comments will be visible to the applicant
                  </p>
                </div>
              )}

              {/* Rejection Reason - Required only for rejection */}
              {approvalAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejecting this reservation..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide a clear explanation for the rejection
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalDialog(false)}
                  disabled={isSubmittingApproval}
                >
                  Cancel
                </Button>
                <Button
                  className={
                    approvalAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : approvalAction === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }
                  onClick={() => handleConfirmApproval()}
                  disabled={isSubmittingApproval}
                >
                  {isSubmittingApproval ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      {approvalAction === 'approve' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Approval
                        </>
                      ) : approvalAction === 'reject' ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Confirm Rejection
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Submit Review
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Reservation Form Modal */}
      {showNewReservationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ReservationForm
              user={(window as any).currentUser || { firstName: '', lastName: '', email: '' }}
              onClose={() => setShowNewReservationForm(false)}
              onSubmit={async () => {
                setShowNewReservationForm(false)
                await fetchReservations()
                toast.success('Reservation submitted successfully!')
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
