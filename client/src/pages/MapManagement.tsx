import { useState, useRef, useEffect } from 'react'
import { useSidebar } from '@/components/Layout'
import { Map, Building2, Layers, FolderTree, Plus, MapPin, Route, Octagon, Trees, Tag, Phone, Settings, LayoutDashboard, FileDown, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Trash2, Edit, Power, X, Search, Clock } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BuildingForm } from '@/components/BuildingForm'
import LocationForm from '@/components/LocationForm'
import { OpenSpaceForm } from '@/components/OpenSpaceForm'
import { useToast } from '@/hooks/useToast'
import { useCampusStore } from '@/stores/campusStore'
import { useNavigationStore } from '@/stores/navigationStore'
import { importBuildings, getAllBuildings, getBuildingById, deleteBuilding, updateBuilding, createBuilding, ImportResult } from '@/api/buildingApi'
import { getLocations, createLocation, updateLocation, deleteLocation, toggleLocationReservable } from '@/api/locationApi'
import { importOpenSpaces, getOpenSpaces, deleteOpenSpace, toggleOpenSpaceActive, createOpenSpace, getOpenSpaceById, ImportResult as OpenSpaceImportResult } from '@/api/openSpaceApi'
import { getActiveCampuses } from '@/api/campusApi'
import { getAllCategories } from '@/api/categoryApi'
import { uploadBuildingImage, uploadBuildingDocument, reorderBuildingImages, reorderBuildingDocuments, uploadLocationImage, uploadLocationDocument, reorderLocationImages, reorderLocationDocuments, uploadOpenSpaceImage, uploadOpenSpaceDocument, reorderOpenSpaceImages, reorderOpenSpaceDocuments } from '@/api/uploadApi'
import MapSettings from './MapSettings'

type SectionType = 'overview' | 'buildings' | 'locations' | 'poi' | 'paths' | 'boundaries' | 'open-spaces' | 'categories' | 'emergency' | 'settings'

const sections: { id: SectionType; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'buildings', label: 'Buildings', icon: Building2 },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'poi', label: 'Points of Interest', icon: Map },
  { id: 'paths', label: 'Paths', icon: Route },
  { id: 'boundaries', label: 'Boundaries', icon: Octagon },
  { id: 'open-spaces', label: 'Open Spaces', icon: Trees },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'emergency', label: 'Emergency Contacts', icon: Phone },
  { id: 'settings', label: 'Map Settings', icon: Settings },
]

export default function MapManagement() {
  const toast = useToast()
  const { setIsCollapsed } = useSidebar()
  const { selectedCampusId } = useCampusStore()
  const { activeSection, setActiveSection } = useNavigationStore()
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Buildings state
  const [buildings, setBuildings] = useState<any[]>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBuildings, setTotalBuildings] = useState(0)
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const BUILDINGS_PER_PAGE = 12

  // Locations state
  const [locations, setLocations] = useState<any[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [locationPage, setLocationPage] = useState(1)
  const [locationTotalPages, setLocationTotalPages] = useState(1)
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null)
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('')
  const LOCATIONS_PER_PAGE = 12

  // OpenSpaces state
  const [openSpaces, setOpenSpaces] = useState<any[]>([])
  const [openSpacePage, setOpenSpacePage] = useState(1)
  const [openSpaceTotalPages, setOpenSpaceTotalPages] = useState(1)
  const [totalOpenSpaces, setTotalOpenSpaces] = useState(0)
  const [openSpaceSearchQuery, setOpenSpaceSearchQuery] = useState('')
  const [selectedOpenSpaceType, setSelectedOpenSpaceType] = useState('')
  const OPEN_SPACES_PER_PAGE = 12
  const openSpaceFileInputRef = useRef<HTMLInputElement>(null)
  const [isImportingOpenSpaces, setIsImportingOpenSpaces] = useState(false)
  const [openSpaceImportResult, setOpenSpaceImportResult] = useState<OpenSpaceImportResult | null>(null)
  const [showOpenSpaceForm, setShowOpenSpaceForm] = useState(false)
  const [editingOpenSpace, setEditingOpenSpace] = useState<any | null>(null)
  const [isSubmittingOpenSpace, setIsSubmittingOpenSpace] = useState(false)

  // Campuses state
  const [campuses, setCampuses] = useState<Array<{ id: string; name: string }>>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  // Form and Dialog state
  const [showBuildingForm, setShowBuildingForm] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<any | null>(null)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    variant: 'default' | 'danger' | 'warning'
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', variant: 'default', onConfirm: () => {} })

  /**
   * Fetch buildings from API
   * Purpose: Load buildings with pagination filtered by campus
   */
  const fetchBuildings = async () => {
    if (activeSection !== 'buildings') return
    if (!selectedCampusId) return
    
    setIsLoadingBuildings(true)
    try {
      const response = await getAllBuildings(currentPage, BUILDINGS_PER_PAGE, searchQuery, selectedCampusId, selectedCategory)
      setBuildings(response.data || [])
      setTotalPages(response.pagination?.totalPages || 1)
      setTotalBuildings(response.pagination?.total || 0)
    } catch (error: any) {
      console.error('Failed to fetch buildings:', error)
      toast.error(error.message || 'Failed to load buildings')
    } finally {
      setIsLoadingBuildings(false)
    }
  }

  /**
   * Fetch all buildings for dropdowns
   * Purpose: Load all buildings for the current campus (for location form)
   */
  const fetchAllBuildingsForDropdown = async () => {
    if (!selectedCampusId) return
    
    try {
      const response = await getAllBuildings(1, 1000, '', selectedCampusId, '')
      setBuildings(response.data || [])
    } catch (error: any) {
      console.error('Failed to fetch buildings for dropdown:', error)
    }
  }

  /**
   * Effect to collapse main sidebar on mount
   */
  useEffect(() => {
    setIsCollapsed(true)
    return () => setIsCollapsed(false) // Optional: expand when leaving
  }, [])

  /**
   * Effect to fetch campuses and categories on mount
   */
  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const response = await getActiveCampuses()
        setCampuses(response.data || [])
      } catch (error: any) {
        console.error('Failed to fetch campuses:', error)
        toast.error(error.message || 'Failed to load campuses')
      }
    }
    
    const fetchCategories = async () => {
      try {
        const response: any = await getAllCategories()
        setCategories(response.data || [])
      } catch (error: any) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCampuses()
    fetchCategories()
  }, [])

  /**
   * Effect to fetch buildings when section, page, or campus changes
   */
  useEffect(() => {
    fetchBuildings()
  }, [activeSection, currentPage, selectedCampusId, searchQuery, selectedCategory])
  
  /**
   * Effect to fetch locations when section, page, or campus changes
   */
  useEffect(() => {
    if (activeSection === 'locations' && selectedCampusId) {
      loadLocations()
      fetchAllBuildingsForDropdown() // Load buildings for the location form dropdown
    }
  }, [activeSection, locationPage, selectedCampusId])
  
  /**
   * Effect to fetch open spaces when section, page, or campus changes
   */
  useEffect(() => {
    if (activeSection === 'open-spaces' && selectedCampusId) {
      loadOpenSpaces()
    }
  }, [activeSection, openSpacePage, selectedCampusId, openSpaceSearchQuery, selectedOpenSpaceType])
  
  /**
   * Reset filters when changing sections
   */
  useEffect(() => {
    setSearchQuery('')
    setSelectedCategory('')
    setCurrentPage(1)
    setLocationSearchQuery('')
    setSelectedBuildingFilter('')
    setLocationPage(1)
    setOpenSpaceSearchQuery('')
    setSelectedOpenSpaceType('')
    setOpenSpacePage(1)
  }, [activeSection])

  /**
   * Handle building card click
   * Purpose: Show building details
   */
  const handleBuildingClick = (building: any) => {
    setSelectedBuilding(building)
  }

  /**
   * Handle delete building
   * Purpose: Delete a building
   */
  const handleDeleteBuilding = async (e: React.MouseEvent, buildingId: string) => {
    e.stopPropagation() // Prevent card click
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Building',
      message: `Are you sure you want to delete this building? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        setIsLoadingBuildings(true)
        try {
          await deleteBuilding(buildingId)
          await fetchBuildings()
          setConfirmDialog({ ...confirmDialog, isOpen: false })
          toast.success('Building deleted successfully')
        } catch (error: any) {
          console.error('Failed to delete building:', error)
          toast.error(error.message || 'Failed to delete building')
        } finally {
          setIsLoadingBuildings(false)
        }
      },
    })
  }

  /**
   * Handle edit building click
   * Purpose: Fetch complete building data and open edit form
   */
  const handleEditBuilding = async (e: React.MouseEvent, building: any) => {
    e.stopPropagation() // Prevent card click
    
    try {
      // Fetch complete building data with all relations
      const fullBuildingData = await getBuildingById(building.id)
      console.log('Full building data:', fullBuildingData)
      setEditingBuilding(fullBuildingData)
      setShowBuildingForm(true)
    } catch (error: any) {
      console.error('Failed to fetch building details:', error)
      toast.error(error.message || 'Failed to load building details')
    }
  }

  /**
   * Handle add new building
   * Purpose: Open form for new building
   */
  const handleAddBuilding = () => {
    setEditingBuilding(null)
    setShowBuildingForm(true)
  }

  /**
   * Handle toggle activation
   * Purpose: Activate/deactivate building
   */
  const handleToggleActivation = (e: React.MouseEvent, buildingId: string, _buildingName: string, currentStatus: boolean) => {
    e.stopPropagation() // Prevent card click
    
    setConfirmDialog({
      isOpen: true,
      title: `${currentStatus ? 'Deactivate' : 'Activate'} Building`,
      message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this building?`,
      variant: 'warning',
      onConfirm: async () => {
        setIsLoadingBuildings(true)
        try {
          await updateBuilding(buildingId, { isActive: !currentStatus })
          await fetchBuildings()
          setConfirmDialog({ ...confirmDialog, isOpen: false })
          toast.success(`Building ${currentStatus ? 'deactivated' : 'activated'} successfully`)
        } catch (error: any) {
          console.error('Failed to toggle activation:', error)
          toast.error(error.message || 'Failed to update building status')
        } finally {
          setIsLoadingBuildings(false)
        }
      },
    })
  }

  /**
   * Handle building form submit
   * Purpose: Create or update building with all related data
   */
  const handleBuildingFormSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      console.log('Building form data:', data)
      
      // Prepare main building data
      const buildingData = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        campusId: selectedCampusId,
        categoryId: data.categoryId || null,
        address: data.address || null,
        coordinates: data.coordinates || null,
        height: data.height || 5,
        floorPlans: data.floorPlans || null,
        capacity: data.capacity || null,
        isReservable: data.isReservable || false,
        isActive: data.isActive ?? true,
        facilities: data.facilities && data.facilities.length > 0 ? JSON.stringify(data.facilities) : null,
        // 3D Model Configuration
        modelId: data.modelId || null,
        modelScale: data.modelScale || 1.0,
        modelRotationX: data.modelRotationX || 0.0,
        modelRotationY: data.modelRotationY || 0.0,
        modelRotationZ: data.modelRotationZ || 0.0,
        modelOffsetX: data.modelOffsetX || 0.0,
        modelOffsetY: data.modelOffsetY || 0.0,
        modelOffsetZ: data.modelOffsetZ || 0.0,
      }

      let buildingId: string
      const isUpdate = !!editingBuilding

      if (editingBuilding) {
        // Update existing building
        await updateBuilding(editingBuilding.id, buildingData)
        buildingId = editingBuilding.id
      } else {
        // Create new building
        const response = await createBuilding(buildingData)
        buildingId = response.id
      }

      // Save relations by sending complete building data with relations
      // The backend should handle these in the update/create
      const relationsData: any = {}
      
      if (data.operatingHours && data.operatingHours.length > 0) {
        relationsData.operatingHours = data.operatingHours
        console.log('Operating hours to save:', data.operatingHours.length)
      }
      
      if (data.contactInfo && data.contactInfo.length > 0) {
        relationsData.contactInfo = data.contactInfo
        console.log('Contact info to save:', data.contactInfo.length)
      }
      
      if (data.amenities && data.amenities.length > 0) {
        relationsData.amenities = data.amenities
        console.log('Amenities to save:', data.amenities.length)
      }

      // If there are relations to save, make a second update call
      if (Object.keys(relationsData).length > 0) {
        try {
          await updateBuilding(buildingId, relationsData)
          console.log('Relations saved successfully')
        } catch (error) {
          console.error('Failed to save relations:', error)
          toast.error('Building saved, but some details may not have been saved')
        }
      }
      
      // Upload new images to Cloudinary
      let uploadedImagesCount = 0
      let failedImagesCount = 0
      if (data.images && data.images.length > 0) {
        const newImages = data.images.filter((img: any) => img.file && !img.id)
        
        if (newImages.length > 0) {
          console.log(`Uploading ${newImages.length} images to Cloudinary...`)
          
          for (const image of newImages) {
            try {
              await uploadBuildingImage(buildingId, image.file, image.caption || '')
              uploadedImagesCount++
              console.log(`✅ Image ${uploadedImagesCount}/${newImages.length} uploaded successfully`)
            } catch (error: any) {
              failedImagesCount++
              console.error('Failed to upload image:', error)
              toast.error(`Failed to upload image: ${error.message}`)
            }
          }
        }
      }
      
      // Upload new documents to Cloudinary
      let uploadedDocsCount = 0
      let failedDocsCount = 0
      if (data.documents && data.documents.length > 0) {
        const newDocs = data.documents.filter((doc: any) => doc.file && !doc.id)
        
        if (newDocs.length > 0) {
          console.log(`Uploading ${newDocs.length} documents to Cloudinary...`)
          
          for (const doc of newDocs) {
            try {
              await uploadBuildingDocument(buildingId, doc.file, doc.title || doc.file.name)
              uploadedDocsCount++
              console.log(`✅ Document ${uploadedDocsCount}/${newDocs.length} uploaded successfully`)
            } catch (error: any) {
              failedDocsCount++
              console.error('Failed to upload document:', error)
              toast.error(`Failed to upload document: ${error.message}`)
            }
          }
        }
      }
      
      // Update image display order if reordered
      if (data.images && data.images.length > 0) {
        const existingImages = data.images.filter((img: any) => img.id)
        if (existingImages.length > 0) {
          try {
            const reorderData = existingImages.map((img: any) => ({
              id: img.id,
              displayOrder: img.displayOrder
            }))
            await reorderBuildingImages(buildingId, reorderData)
            console.log('✅ Image order updated')
          } catch (error: any) {
            console.error('Failed to reorder images:', error)
            // Don't show error toast for reorder - not critical
          }
        }
      }
      
      // Update document display order if reordered
      if (data.documents && data.documents.length > 0) {
        const existingDocs = data.documents.filter((doc: any) => doc.id)
        if (existingDocs.length > 0) {
          try {
            const reorderData = existingDocs.map((doc: any) => ({
              id: doc.id,
              displayOrder: doc.displayOrder
            }))
            await reorderBuildingDocuments(buildingId, reorderData)
            console.log('✅ Document order updated')
          } catch (error: any) {
            console.error('Failed to reorder documents:', error)
            // Don't show error toast for reorder - not critical
          }
        }
      }
      
      // Show success message after ALL operations complete
      const totalUploaded = uploadedImagesCount + uploadedDocsCount
      const totalFailed = failedImagesCount + failedDocsCount
      
      if (totalFailed === 0) {
        toast.success(
          isUpdate 
            ? `Building updated successfully${totalUploaded > 0 ? ` with ${totalUploaded} file(s)` : ''}` 
            : `Building created successfully${totalUploaded > 0 ? ` with ${totalUploaded} file(s)` : ''}`
        )
      } else {
        toast.warning(
          `Building ${isUpdate ? 'updated' : 'created'} but ${totalFailed} file(s) failed to upload`
        )
      }
      
      setShowBuildingForm(false)
      setEditingBuilding(null)
      await fetchBuildings()
    } catch (error: any) {
      console.error('Failed to save building:', error)
      toast.error(error.message || 'Failed to save building')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle import button click
   * Purpose: Trigger file input click
   */
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  /**
   * Handle file selection
   * Purpose: Read and import GeoJSON file
   * Input: File selection event
   * Output: Import results or error
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!selectedCampusId) {
      setImportError('Please select a campus first')
      return
    }

    // Reset previous results
    setImportResult(null)
    setImportError(null)

    // Validate file type
    if (!file.name.endsWith('.json') && !file.name.endsWith('.geojson')) {
      setImportError('Please select a valid GeoJSON file (.json or .geojson)')
      return
    }

    setIsImporting(true)

    try {
      // Read file content
      const fileContent = await file.text()
      const geojsonData = JSON.parse(fileContent)

      // Validate GeoJSON structure
      if (geojsonData.type !== 'FeatureCollection' || !Array.isArray(geojsonData.features)) {
        throw new Error('Invalid GeoJSON format. Expected a FeatureCollection.')
      }

      // Import buildings
      const result = await importBuildings(geojsonData, selectedCampusId)
      setImportResult(result)
      
      // Refresh buildings list
      await fetchBuildings()

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Import error:', error)
      setImportError(error.message || 'Failed to import buildings')
    } finally {
      setIsImporting(false)
    }
  }

  /**
   * Load locations
   * Purpose: Fetch locations with pagination filtered by campus
   */
  const loadLocations = async () => {
    if (!selectedCampusId) return
    setIsLoadingLocations(true)
    try {
      const response: any = await getLocations(locationPage, LOCATIONS_PER_PAGE, undefined, selectedCampusId)
      setLocations(response.data || [])
      setLocationTotalPages(response.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to load locations:', error)
      toast.error('Failed to load locations')
    } finally {
      setIsLoadingLocations(false)
    }
  }

  /**
   * Filter locations
   * Purpose: Filter by search and building
   */
  const filteredLocations = locations.filter((location) => {
    const matchesSearch = !locationSearchQuery || 
      location.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
      location.roomNumber?.toLowerCase().includes(locationSearchQuery.toLowerCase())
    
    const matchesBuilding = !selectedBuildingFilter || location.buildingId === selectedBuildingFilter
    
    return matchesSearch && matchesBuilding
  })

  /**
   * Handle edit location
   * Purpose: Open form with location data
   */
  const handleEditLocation = (location: any) => {
    setEditingLocation(location)
    setShowLocationForm(true)
  }

  /**
   * Handle delete location
   * Purpose: Delete location with confirmation
   */
  const handleDeleteLocation = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Location',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteLocation(id)
          toast.success('Location deleted successfully')
          loadLocations()
        } catch (error) {
          console.error('Failed to delete location:', error)
          toast.error('Failed to delete location')
        }
      }
    })
  }

  /**
   * Handle toggle location activation
   * Purpose: Activate/deactivate location
   */
  const handleToggleLocationReservable = (id: string, name: string, currentStatus: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: currentStatus ? 'Deactivate Location' : 'Activate Location',
      message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} "${name}"?`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          await toggleLocationReservable(id)
          toast.success(`Location ${currentStatus ? 'deactivated' : 'activated'} successfully`)
          loadLocations()
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error) {
          console.error('Failed to toggle location status:', error)
          toast.error('Failed to update location status')
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      }
    })
  }

  /**
   * Handle location form submit
   * Purpose: Create or update location with images and documents
   */
  const handleLocationFormSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      console.log('Location form data:', data)
      
      // Prepare main location data
      const locationData = {
        name: data.name,
        buildingId: data.buildingId,
        floor: data.floor,
        roomNumber: data.roomNumber || null,
        description: data.description || null,
        coordinates: data.coordinates || null,
        locationType: data.locationType || 'room',
        capacity: data.capacity || null,
        isReservable: data.isReservable || false,
        facilities: data.facilities && data.facilities.length > 0 ? JSON.stringify(data.facilities) : null,
      }

      let locationId: string
      const isUpdate = !!editingLocation

      if (editingLocation) {
        // Update existing location
        await updateLocation(editingLocation.id, locationData)
        locationId = editingLocation.id
      } else {
        // Create new location
        const response: any = await createLocation(locationData)
        locationId = response.id
      }

      // Save relations (operating hours and contact info)
      const relationsData: any = {}
      
      if (data.operatingHours && data.operatingHours.length > 0) {
        relationsData.operatingHours = data.operatingHours
        console.log('Operating hours to save:', data.operatingHours.length)
      }
      
      if (data.contactInfo && data.contactInfo.length > 0) {
        relationsData.contactInfo = data.contactInfo
        console.log('Contact info to save:', data.contactInfo.length)
      }

      // If there are relations to save, make a second update call
      if (Object.keys(relationsData).length > 0) {
        try {
          await updateLocation(locationId, relationsData)
          console.log('Relations saved successfully')
        } catch (error) {
          console.error('Failed to save relations:', error)
          toast.error('Location saved, but some details may not have been saved')
        }
      }
      
      // Upload new images
      let uploadedImagesCount = 0
      let failedImagesCount = 0
      if (data.images && data.images.length > 0) {
        const newImages = data.images.filter((img: any) => img.file && !img.id)
        
        if (newImages.length > 0) {
          console.log(`Uploading ${newImages.length} images...`)
          
          for (const image of newImages) {
            try {
              await uploadLocationImage(locationId, image.file, image.caption || '')
              uploadedImagesCount++
              console.log(`✅ Image ${uploadedImagesCount}/${newImages.length} uploaded successfully`)
            } catch (error: any) {
              failedImagesCount++
              console.error('Failed to upload image:', error)
              toast.error(`Failed to upload image: ${error.message}`)
            }
          }
        }
      }
      
      // Upload new documents
      let uploadedDocsCount = 0
      let failedDocsCount = 0
      if (data.documents && data.documents.length > 0) {
        const newDocs = data.documents.filter((doc: any) => doc.file && !doc.id)
        
        if (newDocs.length > 0) {
          console.log(`Uploading ${newDocs.length} documents...`)
          
          for (const doc of newDocs) {
            try {
              await uploadLocationDocument(locationId, doc.file, doc.title || doc.name)
              uploadedDocsCount++
              console.log(`✅ Document ${uploadedDocsCount}/${newDocs.length} uploaded successfully`)
            } catch (error: any) {
              failedDocsCount++
              console.error('Failed to upload document:', error)
              toast.error(`Failed to upload document: ${error.message}`)
            }
          }
        }
      }

      // Reorder existing images (only when editing)
      if (isUpdate && data.images && data.images.length > 0) {
        const existingImages = data.images.filter((img: any) => img.id && !img.file)
        console.log('Existing images to reorder:', existingImages.length)
        
        if (existingImages.length > 0) {
          try {
            const imageOrder = existingImages.map((img: any, index: number) => ({
              id: img.id,
              displayOrder: index
            }))
            console.log('Reordering images:', imageOrder)
            await reorderLocationImages(locationId, imageOrder)
            console.log('✅ Images reordered successfully')
          } catch (error: any) {
            console.error('❌ Failed to reorder images:', error)
            toast.error(`Failed to reorder images: ${error.message}`)
          }
        }
      }

      // Reorder existing documents (only when editing)
      if (isUpdate && data.documents && data.documents.length > 0) {
        const existingDocs = data.documents.filter((doc: any) => doc.id && !doc.file)
        console.log('Existing documents to reorder:', existingDocs.length)
        
        if (existingDocs.length > 0) {
          try {
            const docOrder = existingDocs.map((doc: any, index: number) => ({
              id: doc.id,
              displayOrder: index
            }))
            console.log('Reordering documents:', docOrder)
            await reorderLocationDocuments(locationId, docOrder)
            console.log('✅ Documents reordered successfully')
          } catch (error: any) {
            console.error('❌ Failed to reorder documents:', error)
            toast.error(`Failed to reorder documents: ${error.message}`)
          }
        }
      }

      // Show success message
      const successMessage = isUpdate ? 'Location updated successfully' : 'Location created successfully'
      const detailsMessage = []
      if (uploadedImagesCount > 0) detailsMessage.push(`${uploadedImagesCount} image(s)`)
      if (uploadedDocsCount > 0) detailsMessage.push(`${uploadedDocsCount} document(s)`)
      
      if (detailsMessage.length > 0) {
        toast.success(`${successMessage} with ${detailsMessage.join(' and ')}`)
      } else {
        toast.success(successMessage)
      }

      if (failedImagesCount > 0 || failedDocsCount > 0) {
        toast.error(`Failed to upload ${failedImagesCount} image(s) and ${failedDocsCount} document(s)`)
      }

      setShowLocationForm(false)
      setEditingLocation(null)
      loadLocations()
    } catch (error: any) {
      console.error('Failed to save location:', error)
      toast.error(error.message || 'Failed to save location')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Load open spaces
   * Purpose: Fetch open spaces with pagination filtered by campus, search, and type
   */
  const loadOpenSpaces = async () => {
    if (!selectedCampusId) return
    try {
      const response: any = await getOpenSpaces(openSpacePage, OPEN_SPACES_PER_PAGE, openSpaceSearchQuery, selectedCampusId, selectedOpenSpaceType)
      setOpenSpaces(response.data || [])
      setOpenSpaceTotalPages(response.pagination?.totalPages || 1)
      setTotalOpenSpaces(response.pagination?.total || 0)
    } catch (error) {
      console.error('Failed to load open spaces:', error)
      toast.error('Failed to load open spaces')
    }
  }

  /**
   * Handle open space import
   * Purpose: Import open spaces from GeoJSON file
   */
  const handleOpenSpaceImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedCampusId) return

    // Reset previous results
    setOpenSpaceImportResult(null)

    setIsImportingOpenSpaces(true)

    try {
      const result = await importOpenSpaces(selectedCampusId, file)
      console.log('Import result:', result)
      
      if (!result || typeof result.imported === 'undefined') {
        throw new Error('Invalid response from server')
      }
      
      setOpenSpaceImportResult(result)
      
      // Refresh open spaces list
      await loadOpenSpaces()
      
      // Reset file input
      if (openSpaceFileInputRef.current) {
        openSpaceFileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(error.message || 'Failed to import open spaces')
    } finally {
      setIsImportingOpenSpaces(false)
    }
  }

  /**
   * Handle delete open space
   * Purpose: Delete open space with confirmation
   */
  const handleDeleteOpenSpace = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Open Space',
      message: `Are you sure you want to delete "${name}"?`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteOpenSpace(id)
          toast.success('Open space deleted successfully')
          loadOpenSpaces()
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error) {
          console.error('Failed to delete open space:', error)
          toast.error('Failed to delete open space')
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      }
    })
  }

  /**
   * Handle toggle open space active
   * Purpose: Activate/deactivate open space
   */
  const handleToggleOpenSpaceActive = (id: string, name: string, currentStatus: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: currentStatus ? 'Deactivate Open Space' : 'Activate Open Space',
      message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} "${name}"?`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          await toggleOpenSpaceActive(id)
          toast.success(`Open space ${currentStatus ? 'deactivated' : 'activated'} successfully`)
          loadOpenSpaces()
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error) {
          console.error('Failed to toggle open space status:', error)
          toast.error('Failed to update open space status')
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      }
    })
  }

  /**
   * Handle add new open space
   * Purpose: Open form for creating new open space
   */
  const handleAddOpenSpace = () => {
    setEditingOpenSpace(null)
    setShowOpenSpaceForm(true)
  }

  /**
   * Handle edit open space
   * Purpose: Open form for editing existing open space
   */
  const handleEditOpenSpace = async (openSpace: any) => {
    try {
      // Fetch full open space details
      const response: any = await getOpenSpaceById(openSpace.id)
      setEditingOpenSpace(response)
      setShowOpenSpaceForm(true)
    } catch (error) {
      console.error('Failed to fetch open space details:', error)
      toast.error('Failed to fetch open space details')
    }
  }

  /**
   * Handle open space form submit
   * Purpose: Create or update open space
   */
  const handleOpenSpaceFormSubmit = async (data: any) => {
    setIsSubmittingOpenSpace(true)
    try {
      console.log('Open space form data:', data)
      console.log('Contact Info:', data.contactInfo)
      console.log('Amenities:', data.amenities)
      console.log('Operating Hours:', data.operatingHours)
      
      const isUpdate = !!editingOpenSpace
      let openSpaceId: string

      const requestData = {
        ...data,
        campusId: selectedCampusId,
        accessibility: JSON.stringify(data.accessibility),
        operatingHours: data.operatingHours,
        contactInfo: data.contactInfo,
        amenities: data.amenities,
      }
      
      console.log('Request data being sent:', requestData)

      // Create or Update Open Space
      if (isUpdate) {
        openSpaceId = editingOpenSpace.id
      } else {
        const response: any = await createOpenSpace(requestData)
        openSpaceId = response.id
      }

      // Upload new images
      let uploadedImagesCount = 0
      let failedImagesCount = 0
      if (data.images && data.images.length > 0) {
        const newImages = data.images.filter((img: any) => img.file && !img.id)
        
        if (newImages.length > 0) {
          console.log(`Uploading ${newImages.length} images...`)
          
          for (const image of newImages) {
            try {
              await uploadOpenSpaceImage(openSpaceId, image.file, image.caption || '')
              uploadedImagesCount++
              console.log(`✅ Image ${uploadedImagesCount}/${newImages.length} uploaded successfully`)
            } catch (error: any) {
              failedImagesCount++
              console.error('Failed to upload image:', error)
              toast.error(`Failed to upload image: ${error.message}`)
            }
          }
        }
      }
      
      // Upload new documents
      let uploadedDocsCount = 0
      let failedDocsCount = 0
      if (data.documents && data.documents.length > 0) {
        const newDocs = data.documents.filter((doc: any) => doc.file && !doc.id)
        
        if (newDocs.length > 0) {
          console.log(`Uploading ${newDocs.length} documents...`)
          
          for (const doc of newDocs) {
            try {
              await uploadOpenSpaceDocument(openSpaceId, doc.file, doc.title || doc.file.name)
              uploadedDocsCount++
              console.log(`✅ Document ${uploadedDocsCount}/${newDocs.length} uploaded successfully`)
            } catch (error: any) {
              failedDocsCount++
              console.error('Failed to upload document:', error)
              toast.error(`Failed to upload document: ${error.message}`)
            }
          }
        }
      }
      
      // Reorder existing images (only when editing)
      if (isUpdate && data.images && data.images.length > 0) {
        const existingImages = data.images.filter((img: any) => img.id && !img.file)
        if (existingImages.length > 0) {
          try {
            const reorderData = existingImages.map((img: any) => ({
              id: img.id,
              displayOrder: img.displayOrder
            }))
            await reorderOpenSpaceImages(openSpaceId, reorderData)
            console.log('✅ Image order updated')
          } catch (error: any) {
            console.error('Failed to reorder images:', error)
          }
        }
      }
      
      // Reorder existing documents (only when editing)
      if (isUpdate && data.documents && data.documents.length > 0) {
        const existingDocs = data.documents.filter((doc: any) => doc.id && !doc.file)
        if (existingDocs.length > 0) {
          try {
            const reorderData = existingDocs.map((doc: any) => ({
              id: doc.id,
              displayOrder: doc.displayOrder
            }))
            await reorderOpenSpaceDocuments(openSpaceId, reorderData)
            console.log('✅ Document order updated')
          } catch (error: any) {
            console.error('Failed to reorder documents:', error)
          }
        }
      }

      // Show success message
      const successMessage = isUpdate ? 'Open space updated successfully' : 'Open space created successfully'
      const detailsMessage = []
      if (uploadedImagesCount > 0) detailsMessage.push(`${uploadedImagesCount} image(s)`)
      if (uploadedDocsCount > 0) detailsMessage.push(`${uploadedDocsCount} document(s)`)
      
      if (detailsMessage.length > 0) {
        toast.success(`${successMessage} with ${detailsMessage.join(' and ')}`)
      } else {
        toast.success(successMessage)
      }

      if (failedImagesCount > 0 || failedDocsCount > 0) {
        toast.error(`Failed to upload ${failedImagesCount} image(s) and ${failedDocsCount} document(s)`)
      }

      setShowOpenSpaceForm(false)
      setEditingOpenSpace(null)
      loadOpenSpaces()
    } catch (error: any) {
      console.error('Failed to save open space:', error)
      toast.error(error.message || 'Failed to save open space')
    } finally {
      setIsSubmittingOpenSpace(false)
    }
  }


  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-6">
      {/* Nested Sidebar - Hidden on mobile, auto-collapse on desktop */}
      <div 
        className={`hidden md:block flex-shrink-0 transition-[width] duration-300 ease-in-out ${
          isSidebarHovered ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <Card className="sticky top-6 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 rounded-md ${
                      activeSection === section.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
                    }`}
                    title={!isSidebarHovered ? section.label : ''}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className={`transition-opacity duration-200 whitespace-nowrap ${
                      isSidebarHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                    }`}>{section.label}</span>
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-3 md:space-y-6 min-w-0">
        {/* Mobile Section Selector */}
        <div className="md:hidden">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm font-medium"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">Map Management</h1>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {sections.find(s => s.id === activeSection)?.label}
            </p>
          </div>
          {activeSection !== 'overview' && activeSection !== 'settings' && (
            <div className="flex gap-2 flex-shrink-0">
              {['buildings', 'poi', 'open-spaces', 'paths', 'boundaries'].includes(activeSection) && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.geojson"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (activeSection === 'buildings') {
                        handleImportClick()
                      } else if (activeSection === 'open-spaces') {
                        openSpaceFileInputRef.current?.click()
                      }
                    }}
                    disabled={activeSection === 'buildings' ? isImporting : activeSection === 'open-spaces' ? isImportingOpenSpaces : false}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <FileDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">
                      {activeSection === 'buildings' && isImporting ? 'Importing...' : 
                       activeSection === 'open-spaces' && isImportingOpenSpaces ? 'Importing...' : 
                       'Import'}
                    </span>
                    <span className="xs:hidden">Import</span>
                  </Button>
                </>
              )}
              <Button 
                onClick={() => {
                  if (activeSection === 'buildings') {
                    handleAddBuilding()
                  } else if (activeSection === 'locations') {
                    setEditingLocation(null)
                    setShowLocationForm(true)
                  } else if (activeSection === 'open-spaces') {
                    handleAddOpenSpace()
                  }
                }} 
                size="sm" 
                className="text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Add New</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </div>
          )}
        </div>

        {/* Import Result Alert */}
        {importResult && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">Import Successful!</h3>
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-green-700">Total</p>
                      <p className="text-2xl font-bold text-green-900">{importResult.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Imported</p>
                      <p className="text-2xl font-bold text-green-900">{importResult.imported}</p>
                    </div>
                    <div>
                      <p className="text-sm text-orange-700">Duplicates</p>
                      <p className="text-2xl font-bold text-orange-900">{importResult.duplicates}</p>
                    </div>
                    <div>
                      <p className="text-sm text-red-700">Errors</p>
                      <p className="text-2xl font-bold text-red-900">{importResult.errors}</p>
                    </div>
                  </div>
                  {importResult.details.imported.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-green-800 mb-1">Imported Buildings:</p>
                      <p className="text-sm text-green-700">{importResult.details.imported.join(', ')}</p>
                    </div>
                  )}
                  {importResult.details.duplicates.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-orange-800 mb-1">Duplicates Skipped:</p>
                      <p className="text-sm text-orange-700">{importResult.details.duplicates.join(', ')}</p>
                    </div>
                  )}
                  {importResult.details.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                      {importResult.details.errors.map((err, idx) => (
                        <p key={idx} className="text-sm text-red-700">{err.name}: {err.error}</p>
                      ))}
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setImportResult(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Error Alert */}
        {importError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Import Failed</h3>
                  <p className="text-sm text-red-700">{importError}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setImportError(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section Content */}
        {activeSection === 'overview' && (
          <>
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Buildings" value="24" icon={Building2} />
              <StatCard title="Locations" value="156" icon={MapPin} />
              <StatCard title="Points of Interest" value="42" icon={Map} />
              <StatCard title="Categories" value="12" icon={Tag} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Paths" value="28" icon={Route} />
              <StatCard title="Boundaries" value="8" icon={Octagon} />
              <StatCard title="Open Spaces" value="15" icon={Trees} />
              <StatCard title="3D Models" value="8" icon={Layers} />
            </div>

            {/* Quick Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Updates</CardTitle>
                  <CardDescription>Latest changes to map data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span>Engineering Building updated</span>
                      <span className="ml-auto text-muted-foreground">2h ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Map className="w-4 h-4 text-primary" />
                      <span>New POI: Coffee Shop</span>
                      <span className="ml-auto text-muted-foreground">5h ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Layers className="w-4 h-4 text-primary" />
                      <span>3D model uploaded</span>
                      <span className="ml-auto text-muted-foreground">1d ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Map data health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Buildings Coverage</span>
                      <Badge variant="success">100%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">3D Models</span>
                      <Badge variant="warning">33%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Navigation Paths</span>
                      <Badge variant="success">95%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeSection === 'buildings' && (
        <>
          {/* Search and Filter Bar */}
          <Card className="mb-3 md:mb-6">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search buildings by name or description..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-10"
                  />
                </div>
                
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-10 px-3 pr-8 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm min-w-[180px]"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                {/* Clear Filters */}
                {(searchQuery || selectedCategory) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('')
                      setCurrentPage(1)
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
              
              {/* Results Count */}
              {!isLoadingBuildings && buildings.length > 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  Showing {buildings.length} of {totalBuildings} buildings
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Buildings Grid */}
          {isLoadingBuildings ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading buildings...</p>
              </div>
            </div>
          ) : buildings.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No buildings found</h3>
                  <p className="text-muted-foreground mb-4">Import buildings from GeoJSON to get started</p>
                  <Button onClick={handleImportClick}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Import Buildings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Buildings Cards Grid */}
              <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {buildings.map((building: any) => (
                  <Card 
                    key={building.id} 
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleBuildingClick(building)}
                  >
                    {/* Building Image */}
                    <div className="aspect-video bg-muted relative overflow-hidden group-hover:shadow-inner">
                      {building.images && building.images.length > 0 ? (
                        <img 
                          src={building.images[0].imageUrl} 
                          alt={building.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Building2 className="w-16 h-16 text-primary/40 group-hover:text-primary/60 transition-colors" />
                        </div>
                      )}
                      
                      {/* Status Dot */}
                      <div className="absolute top-3 left-3">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${building.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} title={building.isActive ? 'Active' : 'Inactive'} />
                      </div>

                      {/* Action Buttons Overlay - Always visible on mobile */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        <Button 
                          variant="secondary" 
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                          onClick={(e) => handleToggleActivation(e, building.id, building.name, building.isActive)}
                          title={building.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className={`w-4 h-4 ${building.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                          onClick={(e) => handleEditBuilding(e, building)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-red-50"
                          onClick={(e) => handleDeleteBuilding(e, building.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Building Info */}
                    <CardContent className="p-3 md:p-4">
                      <div className="mb-2">
                        <h3 className="font-semibold text-base md:text-lg line-clamp-1 mb-1">{building.name}</h3>
                        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mt-1">
                          {building.category && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{building.category.name}</Badge>
                          )}
                          {building.height && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">H: {building.height}m</Badge>
                          )}
                          {building.capacity && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">Cap: {building.capacity}</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2 min-h-[2.5rem]">
                        {building.description || 'No description available'}
                      </p>
                      <div className="flex gap-2 md:gap-3 text-xs text-muted-foreground flex-wrap">
                        {building.address && (
                          <span className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{building.address.split(',')[0]}</span>
                          </span>
                        )}
                        {building.modelId && (
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            3D Model
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Building Detail Modal */}
              {selectedBuilding && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4" onClick={() => setSelectedBuilding(null)}>
                  <Card className="w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                    <CardHeader className="sticky top-0 bg-background border-b z-10 p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg sm:text-2xl truncate">{selectedBuilding.name}</CardTitle>
                          <CardDescription className="mt-1 text-xs sm:text-sm truncate">
                            {selectedBuilding.campus?.name || 'No campus assigned'}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedBuilding(null)} className="flex-shrink-0">
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      {/* Building Image */}
                      {selectedBuilding.images && selectedBuilding.images.length > 0 ? (
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <img 
                            src={selectedBuilding.images[0].imageUrl} 
                            alt={selectedBuilding.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Building2 className="w-24 h-24 text-primary/40" />
                        </div>
                      )}

                      {/* Building Details */}
                      <div className="grid gap-4">
                        <div>
                          <h3 className="font-semibold mb-2">Description</h3>
                          <p className="text-muted-foreground">
                            {selectedBuilding.description || 'No description available'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold mb-2">Status</h3>
                            <Badge variant={selectedBuilding.isActive ? 'success' : 'secondary'}>
                              {selectedBuilding.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          {selectedBuilding.category && (
                            <div>
                              <h3 className="font-semibold mb-2">Category</h3>
                              <Badge variant="outline">{selectedBuilding.category.name}</Badge>
                            </div>
                          )}

                          {selectedBuilding.capacity && (
                            <div>
                              <h3 className="font-semibold mb-2">Capacity</h3>
                              <p className="text-muted-foreground">{selectedBuilding.capacity} people</p>
                            </div>
                          )}

                          <div>
                            <h3 className="font-semibold mb-2">Reservable</h3>
                            <Badge variant={selectedBuilding.isReservable ? 'success' : 'secondary'}>
                              {selectedBuilding.isReservable ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>

                        {selectedBuilding.address && (
                          <div>
                            <h3 className="font-semibold mb-2">Address</h3>
                            <p className="text-muted-foreground">{selectedBuilding.address}</p>
                          </div>
                        )}

                        {selectedBuilding.coordinates && (
                          <div>
                            <h3 className="font-semibold mb-2">Coordinates</h3>
                            <div className="bg-muted p-3 rounded-md">
                              <code className="text-xs text-muted-foreground break-all">
                                {JSON.stringify(JSON.parse(selectedBuilding.coordinates), null, 2).substring(0, 200)}...
                              </code>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <h3 className="font-semibold mb-1">Created</h3>
                            <p className="text-muted-foreground">
                              {new Date(selectedBuilding.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">Last Updated</h3>
                            <p className="text-muted-foreground">
                              {new Date(selectedBuilding.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Icon Only */}
                      <div className="flex gap-2 pt-4 border-t justify-center">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-10 w-10"
                          onClick={(e) => {
                            setSelectedBuilding(null)
                            handleEditBuilding(e as any, selectedBuilding)
                          }}
                          title="Edit Building"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-10 w-10"
                          onClick={(e) => {
                            handleToggleActivation(e as any, selectedBuilding.id, selectedBuilding.name, selectedBuilding.isActive)
                            setSelectedBuilding(null)
                          }}
                          title={selectedBuilding.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className={`w-4 h-4 ${selectedBuilding.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button 
                          variant="destructive"
                          size="icon"
                          className="h-10 w-10"
                          onClick={(e) => {
                            handleDeleteBuilding(e as any, selectedBuilding.id)
                            setSelectedBuilding(null)
                          }}
                          title="Delete Building"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Card className="mt-6">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * BUILDINGS_PER_PAGE) + 1} to {Math.min(currentPage * BUILDINGS_PER_PAGE, totalBuildings)} of {totalBuildings} buildings
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                                className="w-10"
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
        )}

        {activeSection === 'locations' && (
        <>
          {/* Search and Filter Bar */}
          <Card className="mb-3 md:mb-6">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search locations by name or room number..."
                    value={locationSearchQuery}
                    onChange={(e) => {
                      setLocationSearchQuery(e.target.value)
                      setLocationPage(1)
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Building Filter */}
                <select
                  value={selectedBuildingFilter}
                  onChange={(e) => {
                    setSelectedBuildingFilter(e.target.value)
                    setLocationPage(1)
                  }}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm min-w-[150px]"
                >
                  <option value="">All Buildings</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                Showing {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>

          {isLoadingLocations ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground">Loading locations...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredLocations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Locations Found</h3>
                <p className="text-muted-foreground mb-6">
                  {locationSearchQuery || selectedBuildingFilter
                    ? 'No locations match your search criteria.'
                    : 'Get started by adding your first location.'}
                </p>
                <Button onClick={() => {
                  setEditingLocation(null)
                  setShowLocationForm(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Location
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Locations Cards Grid */}
              <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredLocations.map((location: any) => (
                  <Card 
                    key={location.id} 
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => setSelectedLocation(location)}
                  >
                    {/* Location Image or Header */}
                    {location.images && location.images.length > 0 ? (
                      <div className="relative h-40 overflow-hidden bg-muted">
                        <img 
                          src={location.images[0].imageUrl} 
                          alt={location.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Status Dot on Image */}
                        <div className="absolute top-3 left-3">
                          <div className={`w-2 h-2 rounded-full shadow-sm ${location.isReservable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} title={location.isReservable ? 'Reservable' : 'Not Reservable'} />
                        </div>
                        {/* Action Buttons on Image */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                          <Button 
                            variant="secondary" 
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleLocationReservable(location.id, location.name, location.isReservable)
                            }}
                            title={location.isReservable ? 'Deactivate Location' : 'Activate Location'}
                          >
                            <Power className={`w-4 h-4 ${location.isReservable ? 'text-green-600' : 'text-gray-400'}`} />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditLocation(location)
                            }}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLocation(location.id, location.name)
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 relative">
                        {/* Status Dot */}
                        <div className="absolute top-3 left-3">
                          <div className={`w-2 h-2 rounded-full shadow-sm ${location.isReservable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`} title={location.isReservable ? 'Reservable' : 'Not Reservable'} />
                        </div>
                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                          <Button 
                            variant="secondary" 
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleLocationReservable(location.id, location.name, location.isReservable)
                            }}
                            title={location.isReservable ? 'Deactivate Location' : 'Activate Location'}
                          >
                            <Power className={`w-4 h-4 ${location.isReservable ? 'text-green-600' : 'text-gray-400'}`} />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditLocation(location)
                            }}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLocation(location.id, location.name)
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-6">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">{location.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {location.building?.name || 'No building'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Location Info */}
                    <CardContent className="p-3 md:p-4">
                      {/* Show name and building if image is present */}
                      {location.images && location.images.length > 0 && (
                        <div className="mb-3">
                          <h3 className="font-semibold text-base truncate">{location.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {location.building?.name || 'No building'}
                          </p>
                        </div>
                      )}
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mt-1">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{location.locationType}</Badge>
                          {location.floor !== null && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">Floor: {location.floor}</Badge>
                          )}
                          {location.roomNumber && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">Room: {location.roomNumber}</Badge>
                          )}
                          {location.capacity && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">Cap: {location.capacity}</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2 min-h-[2.5rem]">
                        {location.description || 'No description available'}
                      </p>
                      {location.facilities && JSON.parse(location.facilities).length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {JSON.parse(location.facilities).slice(0, 3).map((facility: string, idx: number) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-secondary/50 rounded-md truncate">
                              {facility}
                            </span>
                          ))}
                          {JSON.parse(location.facilities).length > 3 && (
                            <span className="text-xs px-2 py-0.5 bg-secondary/50 rounded-md">
                              +{JSON.parse(location.facilities).length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Location Detail Modal */}
              {selectedLocation && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4" onClick={() => setSelectedLocation(null)}>
                  <Card className="w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                    <CardHeader className="sticky top-0 bg-background border-b z-10 p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg sm:text-2xl truncate">{selectedLocation.name}</CardTitle>
                          <CardDescription className="mt-1 text-xs sm:text-sm truncate">
                            {selectedLocation.building?.name || 'No building assigned'}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLocation(null)} className="flex-shrink-0">
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      {/* Location Details */}
                      <div className="grid gap-4">
                        <div>
                          <h3 className="font-semibold mb-2">Description</h3>
                          <p className="text-muted-foreground">
                            {selectedLocation.description || 'No description available'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold mb-2">Status</h3>
                            <Badge variant={selectedLocation.isReservable ? 'success' : 'secondary'}>
                              {selectedLocation.isReservable ? 'Reservable' : 'Not Reservable'}
                            </Badge>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">Type</h3>
                            <Badge variant="outline">{selectedLocation.locationType}</Badge>
                          </div>

                          {selectedLocation.floor !== null && (
                            <div>
                              <h3 className="font-semibold mb-2">Floor</h3>
                              <p className="text-muted-foreground">{selectedLocation.floor}</p>
                            </div>
                          )}

                          {selectedLocation.roomNumber && (
                            <div>
                              <h3 className="font-semibold mb-2">Room Number</h3>
                              <p className="text-muted-foreground">{selectedLocation.roomNumber}</p>
                            </div>
                          )}

                          {selectedLocation.capacity && (
                            <div>
                              <h3 className="font-semibold mb-2">Capacity</h3>
                              <p className="text-muted-foreground">{selectedLocation.capacity} people</p>
                            </div>
                          )}
                        </div>

                        {selectedLocation.facilities && JSON.parse(selectedLocation.facilities).length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2">Facilities & Equipment</h3>
                            <div className="flex flex-wrap gap-2">
                              {JSON.parse(selectedLocation.facilities).map((facility: string, idx: number) => (
                                <Badge key={idx} variant="secondary">{facility}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <h3 className="font-semibold mb-1">Created</h3>
                            <p className="text-muted-foreground">
                              {new Date(selectedLocation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">Last Updated</h3>
                            <p className="text-muted-foreground">
                              {new Date(selectedLocation.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Icon Only */}
                      <div className="flex gap-2 pt-4 border-t justify-center">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => {
                            setSelectedLocation(null)
                            handleEditLocation(selectedLocation)
                          }}
                          title="Edit Location"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => {
                            handleToggleLocationReservable(selectedLocation.id, selectedLocation.name, selectedLocation.isReservable)
                            setSelectedLocation(null)
                          }}
                          title={selectedLocation.isReservable ? 'Deactivate Location' : 'Activate Location'}
                        >
                          <Power className={`w-4 h-4 ${selectedLocation.isReservable ? 'text-green-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button 
                          variant="destructive"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => {
                            handleDeleteLocation(selectedLocation.id, selectedLocation.name)
                            setSelectedLocation(null)
                          }}
                          title="Delete Location"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Pagination */}
              {locationTotalPages > 1 && (
                <Card className="mt-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {locationPage} of {locationTotalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocationPage(locationPage - 1)}
                          disabled={locationPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocationPage(locationPage + 1)}
                          disabled={locationPage === locationTotalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Location Form Modal */}
          {showLocationForm && (
            <LocationForm
              location={editingLocation}
              buildings={buildings}
              onSubmit={handleLocationFormSubmit}
              onCancel={() => {
                setShowLocationForm(false)
                setEditingLocation(null)
              }}
              isLoading={isSubmitting}
            />
          )}
        </>
      )}

        {activeSection === 'poi' && (
        <Card>
          <CardHeader>
            <CardTitle>Points of Interest</CardTitle>
            <CardDescription>Manage campus points of interest</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">POI management content coming soon...</p>
          </CardContent>
        </Card>
      )}

        {activeSection === 'paths' && (
        <Card>
          <CardHeader>
            <CardTitle>Paths & Routes</CardTitle>
            <CardDescription>Define walkways and navigation paths</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Path management content coming soon...</p>
          </CardContent>
        </Card>
      )}

        {activeSection === 'boundaries' && (
        <Card>
          <CardHeader>
            <CardTitle>Campus Boundaries</CardTitle>
            <CardDescription>Define campus and zone boundaries</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Boundary management content coming soon...</p>
          </CardContent>
        </Card>
      )}

        

        {activeSection === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>Location Categories</CardTitle>
            <CardDescription>Manage and organize location categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add New Category
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

        {activeSection === 'emergency' && (
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contacts</CardTitle>
            <CardDescription>Manage emergency contact information for different locations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Emergency contacts management content coming soon...</p>
          </CardContent>
        </Card>
      )}

        {activeSection === 'open-spaces' && (
        <>
          {/* Hidden file input for import */}
          <input
            ref={openSpaceFileInputRef}
            type="file"
            accept=".geojson,.json"
            onChange={handleOpenSpaceImport}
            className="hidden"
          />

          {/* Import Result Alert */}
          {openSpaceImportResult && (
            <Card className="border-green-200 bg-green-50 mb-3 md:mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-2">Import Complete</h4>
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-green-700">Total</p>
                        <p className="text-2xl font-bold text-green-900">{openSpaceImportResult.total}</p>
                      </div>
                      <div>
                        <p className="text-sm text-green-700">Imported</p>
                        <p className="text-2xl font-bold text-green-900">{openSpaceImportResult.imported}</p>
                      </div>
                      <div>
                        <p className="text-sm text-orange-700">Duplicates</p>
                        <p className="text-2xl font-bold text-orange-900">{openSpaceImportResult.duplicates}</p>
                      </div>
                      <div>
                        <p className="text-sm text-red-700">Errors</p>
                        <p className="text-2xl font-bold text-red-900">{openSpaceImportResult.errors}</p>
                      </div>
                    </div>
                    {openSpaceImportResult.details.imported.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-green-800 mb-1">Imported Open Spaces:</p>
                        <p className="text-sm text-green-700">{openSpaceImportResult.details.imported.join(', ')}</p>
                      </div>
                    )}
                    {openSpaceImportResult.details.duplicates.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-orange-800 mb-1">Duplicates Skipped:</p>
                        <p className="text-sm text-orange-700">{openSpaceImportResult.details.duplicates.join(', ')}</p>
                      </div>
                    )}
                    {openSpaceImportResult.details.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                        {openSpaceImportResult.details.errors.map((err, idx) => (
                          <p key={idx} className="text-sm text-red-700">{err.name}: {err.error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setOpenSpaceImportResult(null)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Filter Bar */}
          <Card className="mb-3 md:mb-6">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search open spaces by name or type..."
                    value={openSpaceSearchQuery}
                    onChange={(e) => {
                      setOpenSpaceSearchQuery(e.target.value)
                      setOpenSpacePage(1)
                    }}
                    className="pl-10"
                  />
                </div>
                
                {/* Type Filter */}
                <select
                  value={selectedOpenSpaceType}
                  onChange={(e) => {
                    setSelectedOpenSpaceType(e.target.value)
                    setOpenSpacePage(1)
                  }}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">All Types</option>
                  <option value="park">Park</option>
                  <option value="garden">Garden</option>
                  <option value="plaza">Plaza</option>
                  <option value="courtyard">Courtyard</option>
                  <option value="sports_field">Sports Field</option>
                  <option value="playground">Playground</option>
                  <option value="amphitheater">Amphitheater</option>
                  <option value="other">Other</option>
                </select>
                
                {/* Clear Filters */}
                {(openSpaceSearchQuery || selectedOpenSpaceType) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpenSpaceSearchQuery('')
                      setSelectedOpenSpaceType('')
                      setOpenSpacePage(1)
                    }}
                    className="whitespace-nowrap"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Results Count */}
              {totalOpenSpaces > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Showing {openSpaces.length} of {totalOpenSpaces} open spaces
                  {openSpaceSearchQuery && ` matching "${openSpaceSearchQuery}"`}
                  {selectedOpenSpaceType && ` in ${selectedOpenSpaceType} category`}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Spaces Cards Grid */}
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {openSpaces.map((openSpace: any) => (
              <Card 
                key={openSpace.id} 
                className="overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Open Space Image/Icon */}
                <div className="aspect-video bg-muted relative overflow-hidden group-hover:shadow-inner">
                  {openSpace.images && openSpace.images.length > 0 ? (
                    <img 
                      src={openSpace.images[0].imageUrl} 
                      alt={openSpace.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500/10 to-green-500/5">
                      <Trees className="w-16 h-16 text-green-500/40 group-hover:text-green-500/60 transition-colors" />
                    </div>
                  )}
                  
                  {/* Status Dot */}
                  <div className="absolute top-3 left-3">
                    <div className={`w-2 h-2 rounded-full shadow-sm ${openSpace.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} title={openSpace.isActive ? 'Active' : 'Inactive'} />
                  </div>

                  {/* Action Buttons Overlay - Always visible on mobile */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    <Button 
                      variant="secondary" 
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleOpenSpaceActive(openSpace.id, openSpace.name, openSpace.isActive)
                      }}
                      title={openSpace.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className={`w-4 h-4 ${openSpace.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditOpenSpace(openSpace)
                      }}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteOpenSpace(openSpace.id, openSpace.name)
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Open Space Info */}
                <CardContent className="p-3 md:p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-base md:text-lg line-clamp-1 mb-1">{openSpace.name}</h3>
                    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mt-1">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 capitalize">{openSpace.openSpaceType}</Badge>
                      {openSpace.capacity && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">Cap: {openSpace.capacity}</Badge>
                      )}
                      {openSpace.isReservable && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-green-600">Reservable</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2 min-h-[2.5rem]">
                    {openSpace.description || 'No description available'}
                  </p>
                  <div className="flex gap-2 md:gap-3 text-xs text-muted-foreground flex-wrap">
                    {openSpace.address && (
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{openSpace.address.split(',')[0]}</span>
                      </span>
                    )}
                    {openSpace.operatingHours && openSpace.operatingHours.length > 0 && (
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        Open Hours
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty state */}
          {openSpaces.length === 0 && !isImportingOpenSpaces && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trees className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Open Spaces Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by importing open spaces from a GeoJSON file
                </p>
                <Button onClick={() => openSpaceFileInputRef.current?.click()}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Import GeoJSON
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {openSpaceTotalPages > 1 && (
            <Card className="mt-6">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((openSpacePage - 1) * OPEN_SPACES_PER_PAGE) + 1} to {Math.min(openSpacePage * OPEN_SPACES_PER_PAGE, totalOpenSpaces)} of {totalOpenSpaces} open spaces
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenSpacePage(prev => Math.max(1, prev - 1))}
                      disabled={openSpacePage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, openSpaceTotalPages) }, (_, i) => {
                        let pageNum
                        if (openSpaceTotalPages <= 5) {
                          pageNum = i + 1
                        } else if (openSpacePage <= 3) {
                          pageNum = i + 1
                        } else if (openSpacePage >= openSpaceTotalPages - 2) {
                          pageNum = openSpaceTotalPages - 4 + i
                        } else {
                          pageNum = openSpacePage - 2 + i
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={openSpacePage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className="w-10"
                            onClick={() => setOpenSpacePage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenSpacePage(prev => Math.min(openSpaceTotalPages, prev + 1))}
                      disabled={openSpacePage === openSpaceTotalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
        )}

        {activeSection === 'settings' && (
          <MapSettings />
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* Building Form */}
      {showBuildingForm && (
        <BuildingForm
          building={editingBuilding}
          campuses={campuses}
          onSubmit={handleBuildingFormSubmit}
          onCancel={() => {
            setShowBuildingForm(false)
            setEditingBuilding(null)
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Open Space Form */}
      {showOpenSpaceForm && (
        <OpenSpaceForm
          openSpace={editingOpenSpace}
          campuses={campuses}
          onSubmit={handleOpenSpaceFormSubmit}
          onCancel={() => {
            setShowOpenSpaceForm(false)
            setEditingOpenSpace(null)
          }}
          isLoading={isSubmittingOpenSpace}
        />
      )}
    </div>
  )
}
