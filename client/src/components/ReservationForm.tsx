/**
 * ReservationForm Component
 * Purpose: Multi-step form for UM6P event reservation application
 * Follows official UM6P Event Application Form structure
 * Inputs: user, onClose, onSubmit callbacks
 * Outputs: Complete validated reservation form with progress saving
 */

import { useState, useEffect } from 'react'
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Calendar, 
  History, 
  Target, 
  Globe, 
  Users, 
  Building, 
  PlayCircle, 
  Truck, 
  Megaphone, 
  DollarSign, 
  CheckCircle,
  FileText,
  Eye,
  MapPin
} from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { CreateReservationInput } from '../models/reservation'
import { useToast } from '@/hooks/useToast'
import { getAllBuildings } from '../api/buildingApi'
import { getLocations } from '../api/locationApi'
import { getOpenSpaces } from '../api/openSpaceApi'
import { getActiveCampuses } from '../api/campusApi'

// Helper Components
const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium mb-2">
    {children}
    <span className="text-red-500 ml-1">*</span>
  </label>
)

const OptionalLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium mb-2">
    {children}
  </label>
)

const Input = ({ 
  className = '', 
  error,
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & { 
  className?: string
  error?: string 
}) => (
  <div className="w-full">
    <input
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
        error ? 'border-red-500' : 'border-gray-300'
      } ${className}`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

const Textarea = ({ 
  className = '', 
  error,
  ...props 
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { 
  className?: string
  error?: string 
}) => (
  <div className="w-full">
    <textarea
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
        error ? 'border-red-500' : 'border-gray-300'
      } ${className}`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

const Select = ({ 
  className = '', 
  error,
  children,
  ...props 
}: React.SelectHTMLAttributes<HTMLSelectElement> & { 
  className?: string
  error?: string 
}) => (
  <div className="w-full">
    <select
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
        error ? 'border-red-500' : 'border-gray-300'
      } ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

const Checkbox = ({ 
  label, 
  checked, 
  onChange,
  className = ''
}: { 
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) => (
  <label className={`flex items-center space-x-2 cursor-pointer ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
    />
    <span className="text-sm">{label}</span>
  </label>
)

const RadioGroup = ({ 
  options, 
  value, 
  onChange,
  name,
  error
}: { 
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  name: string
  error?: string
}) => (
  <div className="space-y-2">
    {options.map((option) => (
      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
        />
        <span className="text-sm">{option.label}</span>
      </label>
    ))}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

interface ReservationFormProps {
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    department?: string
  }
  onClose: () => void
  onSubmit: (data: CreateReservationInput) => void
}

// Form steps configuration
const FORM_STEPS = [
  { id: 'applicant', title: 'Applicant Info', icon: User },
  { id: 'event', title: 'Event Details', icon: Calendar },
  { id: 'history', title: 'Event History', icon: History },
  { id: 'objectives', title: 'Objectives', icon: Target },
  { id: 'scope', title: 'Scope & Impact', icon: Globe },
  { id: 'audience', title: 'Target Audience', icon: Users },
  { id: 'governance', title: 'Governance', icon: Building },
  { id: 'program', title: 'Program', icon: PlayCircle },
  { id: 'logistics', title: 'Logistics', icon: Truck },
  { id: 'communication', title: 'Communication', icon: Megaphone },
  { id: 'budget', title: 'Budget', icon: DollarSign },
  { id: 'location', title: 'Event Location', icon: MapPin },
  { id: 'documents', title: 'Documents', icon: FileText },
  { id: 'review', title: 'Review', icon: Eye },
  { id: 'validation', title: 'Validation', icon: CheckCircle }
]

const STORAGE_KEY = 'reservation_form_progress'

export function ReservationForm({ user, onClose, onSubmit }: ReservationFormProps) {
  const toast = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [campuses, setCampuses] = useState<any[]>([])
  const [availableLocations, setAvailableLocations] = useState<any[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [blockedDates, setBlockedDates] = useState<{startDate: string, endDate: string, eventTitle: string}[]>([])
  const [loadingBlockedDates, setLoadingBlockedDates] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>({
    // Pre-fill from user data
    projectLeaderName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    projectLeaderEmail: user?.email || '',
    projectLeaderPhone: (user as any)?.phone || '',
    entity: (user as any)?.entity || '',
    department: user?.department || '',
    submissionDate: new Date().toISOString().split('T')[0],
    
    // Initialize all fields
    eventTitle: '',
    eventNature: '',
    eventType: '',
    relevantCommittee: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    estimatedDuration: '',
    estimatedDurationOther: '',
    proposedVenue: '',
    venueOther: '',
    
    // Event History
    hasPreviousEdition: false,
    previousEditionYear: '',
    participantCount: '',
    mediaVisibility: '',
    hasVIPGuests: false,
    vipGuestsDetails: '',
    
    // Objectives
    mainObjectives: [] as string[],
    mainObjectivesOther: '',
    secondaryObjectives: [] as string[],
    
    // Scope & Impact
    geographicalScope: '',
    expectedImpact: [] as string[],
    
    // Target Audience
    targetProfiles: [] as string[],
    expectedParticipantCount: '',
    
    // Governance
    eventManagerName: '',
    eventManagerPosition: '',
    eventManagerContact: '',
    organizingCommittee: [{ name: '', role: '', entity: '' }] as Array<{ name: string; role: string; entity: string }>,
    associatedPartners: '',
    protocolSupportRequired: null as boolean | null,
    protocolSupport: [] as string[],
    
    // Program
    programFormat: [] as string[],
    programFormatOther: '',
    speakersStatus: '',
    sideActivities: [] as string[],
    sideActivitiesOther: '',
    
    // Logistics
    requiredSpaces: [] as string[],
    requiredSpacesOther: '',
    requiredEquipment: [] as string[],
    requiredEquipmentOther: '',
    needsTransportAccommodation: null as boolean | null,
    transportAccommodationDetails: '',
    otherSpecificNeeds: null as boolean | null,
    otherSpecificNeedsDetails: '',
    
    // Communication
    communicationObjectives: [] as string[],
    communicationObjectivesOther: '',
    plannedActions: [] as string[],
    plannedActionsOther: '',
    expectedVisibilityLevel: '',
    
    // Budget
    estimatedBudget: '',
    agencyEstimate: '',
    cateringEstimate: '',
    transportEstimate: '',
    accommodationEstimate: '',
    flightEstimate: '',
    overallEstimate: '',
    fundingSources: [] as string[],
    fundingSourcesOther: '',
    estimatedSponsorship: '',
    budgetComments: '',
    
    // Location
    selectedCampusId: '',
    selectedLocationId: '',
    selectedLocationType: '', // 'location', 'building', or 'openSpace'
    selectedLocationName: '',
    
    // Documents
    uploadedDocuments: [] as Array<{ name: string; file: File; type: string }>,
    
    // Validation
    validationStatus: 'pending',
    committeeComments: ''
  })

  // Fetch campuses on mount
  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const response = await getActiveCampuses()
        if (response.success && response.data) {
          setCampuses(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch campuses:', error)
      }
    }
    fetchCampuses()
  }, [])

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const savedData = JSON.parse(saved)
        const loadedData = savedData.formData || {}
        
        // Ensure organizingCommittee is always an array
        if (loadedData.organizingCommittee && !Array.isArray(loadedData.organizingCommittee)) {
          loadedData.organizingCommittee = [{ name: '', role: '', entity: '' }]
        } else if (!loadedData.organizingCommittee) {
          loadedData.organizingCommittee = [{ name: '', role: '', entity: '' }]
        }
        
        setFormData((prev: any) => ({ ...prev, ...loadedData }))
        setCurrentStep(savedData.currentStep || 0)
      } catch (error) {
        console.error('Failed to load saved progress:', error)
      }
    }
  }, [])

  // Auto-validate when formData changes (fixes auto-fill issue)
  useEffect(() => {
    // Clear errors for current step when data changes
    const stepId = FORM_STEPS[currentStep].id
    const stepErrors = validateStep(stepId)
    if (Object.keys(stepErrors).length === 0) {
      setErrors({})
    }
  }, [formData, currentStep])

  // Save progress
  const saveProgress = (data: any, step: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        formData: data,
        currentStep: step,
        savedAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  // Update form data
  const updateFormData = (updates: Partial<typeof formData>) => {
    const newData = { ...formData, ...updates }
    setFormData(newData)
    saveProgress(newData, currentStep)
  }

  // Validation functions
  const validateStep = (stepId: string): Record<string, string> => {
    const errors: Record<string, string> = {}

    switch (stepId) {
      case 'applicant':
        if (!formData.projectLeaderName?.trim()) errors.projectLeaderName = 'Project Leader Name is required'
        if (!formData.projectLeaderEmail?.trim()) errors.projectLeaderEmail = 'Email is required'
        if (!formData.entity?.trim()) errors.entity = 'Entity is required'
        if (!formData.department?.trim()) errors.department = 'Department is required'
        if (!formData.submissionDate) errors.submissionDate = 'Submission Date is required'
        break

      case 'event':
        if (!formData.eventTitle?.trim()) errors.eventTitle = 'Event Title is required'
        if (!formData.eventNature) errors.eventNature = 'Event Nature is required'
        if (!formData.eventType) errors.eventType = 'Event Type is required'
        if (!formData.relevantCommittee) errors.relevantCommittee = 'Relevant Committee is required'
        break

      case 'history':
        if (formData.hasPreviousEdition && !formData.previousEditionYear?.trim()) {
          errors.previousEditionYear = 'Previous edition year is required'
        }
        if (formData.hasPreviousEdition && !formData.participantCount) {
          errors.participantCount = 'Participant count is required'
        }
        if (formData.hasPreviousEdition && !formData.mediaVisibility) {
          errors.mediaVisibility = 'Media visibility is required'
        }
        if (formData.hasVIPGuests && !formData.vipGuestsDetails?.trim()) {
          errors.vipGuestsDetails = 'Please specify VIP guests'
        }
        break

      case 'objectives':
        if (!formData.mainObjectives || formData.mainObjectives.length === 0) {
          errors.mainObjectives = 'At least one main objective is required'
        }
        if (formData.mainObjectives?.includes('other') && !formData.mainObjectivesOther?.trim()) {
          errors.mainObjectivesOther = 'Please specify other objective'
        }
        break

      case 'scope':
        if (!formData.geographicalScope) errors.geographicalScope = 'Geographical Scope is required'
        if (!formData.expectedImpact || formData.expectedImpact.length === 0) {
          errors.expectedImpact = 'At least one expected impact is required'
        }
        break

      case 'audience':
        if (!formData.targetProfiles || formData.targetProfiles.length === 0) {
          errors.targetProfiles = 'At least one target profile is required'
        }
        if (!formData.expectedParticipantCount?.trim()) {
          errors.expectedParticipantCount = 'Expected participant count is required'
        }
        break

      case 'governance':
        if (!formData.eventManagerName?.trim()) errors.eventManagerName = 'Event Manager Name is required'
        if (!formData.eventManagerPosition?.trim()) errors.eventManagerPosition = 'Event Manager Position is required'
        if (!formData.eventManagerContact?.trim()) errors.eventManagerContact = 'Event Manager Contact is required'
        
        // Validate organizing committee
        if (!formData.organizingCommittee || formData.organizingCommittee.length === 0) {
          errors.organizingCommittee = 'At least one organizing committee member is required'
        } else {
          const hasEmptyMember = formData.organizingCommittee.some((member: any) => 
            !member.name?.trim() || !member.role?.trim() || !member.entity?.trim()
          )
          if (hasEmptyMember) {
            errors.organizingCommittee = 'All committee member fields are required'
          }
        }
        
        if (!formData.associatedPartners) errors.associatedPartners = 'Associated Partners status is required'
        break

      case 'program':
        if (!formData.programFormat || formData.programFormat.length === 0) {
          errors.programFormat = 'At least one program format is required'
        }
        if (!formData.speakersStatus) errors.speakersStatus = 'Speakers status is required'
        break

      case 'logistics':
        if (!formData.requiredEquipment || formData.requiredEquipment.length === 0) {
          errors.requiredEquipment = 'At least one equipment type is required'
        }
        break

      case 'communication':
        if (!formData.communicationObjectives || formData.communicationObjectives.length === 0) {
          errors.communicationObjectives = 'At least one communication objective is required'
        }
        if (!formData.plannedActions || formData.plannedActions.length === 0) {
          errors.plannedActions = 'At least one planned action is required'
        }
        if (!formData.expectedVisibilityLevel) {
          errors.expectedVisibilityLevel = 'Expected visibility level is required'
        }
        break

      case 'budget':
        if (!formData.estimatedBudget) errors.estimatedBudget = 'Estimated budget range is required'
        if (!formData.fundingSources || formData.fundingSources.length === 0) {
          errors.fundingSources = 'At least one funding source is required'
        }
        if (formData.fundingSources?.includes('other') && !formData.fundingSourcesOther?.trim()) {
          errors.fundingSourcesOther = 'Please specify other funding source'
        }
        break

      case 'location':
        if (!formData.selectedCampusId) errors.selectedCampusId = 'Please select a campus'
        if (!formData.selectedLocationId) errors.selectedLocationId = 'Please select an event location'
        break

      case 'documents':
        // Documents are required for Scientific & Research events
        if (formData.eventType === 'scientific') {
          if (!formData.uploadedDocuments || formData.uploadedDocuments.length === 0) {
            errors.uploadedDocuments = 'At least one document is required for Scientific & Research events'
          }
        }
        break

      case 'review':
        // No validation needed for review step
        break
    }

    return errors
  }

  const handleNext = () => {
    const stepId = FORM_STEPS[currentStep].id
    const stepErrors = validateStep(stepId)
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setErrors({})
    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    saveProgress(formData, nextStep)
  }

  const handlePrevious = () => {
    setErrors({})
    const prevStep = currentStep - 1
    setCurrentStep(prevStep)
    saveProgress(formData, prevStep)
  }

  const handleSubmit = () => {
    const stepId = FORM_STEPS[currentStep].id
    const stepErrors = validateStep(stepId)
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    // Show confirmation dialog
    setShowConfirmDialog(true)
  }

  const confirmSubmit = async () => {
    setIsSubmitting(true)
    
    // Clear any previous errors
    setErrors({})
    
    try {
      // Check authentication first
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('You must be logged in to submit a reservation. Please log in and try again.')
      }
      
      // Prepare form data for submission
      const submissionData = new FormData()
      
      // Add all form fields
      Object.keys(formData).forEach((key) => {
        const value = formData[key]
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            submissionData.append(key, JSON.stringify(value))
          } else if (typeof value === 'object') {
            submissionData.append(key, JSON.stringify(value))
          } else {
            submissionData.append(key, String(value))
          }
        }
      })

      // Add document files
      console.log('📄 Documents to upload:', formData.uploadedDocuments?.length || 0)
      if (formData.uploadedDocuments && formData.uploadedDocuments.length > 0) {
        formData.uploadedDocuments.forEach((doc: any, index: number) => {
          if (doc.file) {
            console.log(`📎 Adding document ${index + 1}:`, doc.name, doc.file.size, 'bytes')
            submissionData.append('documents', doc.file)
          } else {
            console.warn(`⚠️ Document ${index + 1} has no file:`, doc)
          }
        })
      } else {
        console.log('ℹ️ No documents to upload')
      }

      // Call API using the API client base URL
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      
      const response = await fetch(`${apiUrl}/api/reservations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: submissionData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to submit reservation'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorJson.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (result.success) {
        // Clear saved progress
        localStorage.removeItem(STORAGE_KEY)
        
        // Show success toast
        toast.success('Reservation submitted successfully! You will receive a confirmation email shortly.')
        
        // Close form
        onClose()
        
        // Call onSubmit callback if provided
        if (onSubmit) {
          onSubmit(formData as CreateReservationInput)
        }
      } else {
        throw new Error(result.error || 'Failed to submit reservation')
      }
    } catch (error: any) {
      console.error('Error submitting reservation:', error)
      // Show error toast
      toast.error(error.message || 'Failed to submit reservation. Please try again.')
      // Also set error state for display in dialog
      setErrors({ submit: error.message || 'Failed to submit reservation. Please try again.' })
    } finally {
      setIsSubmitting(false)
      setShowConfirmDialog(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    const stepId = FORM_STEPS[currentStep].id

    switch (stepId) {
      case 'applicant':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">1. Applicant Information</h3>
            
            <div>
              <RequiredLabel>
                Project Leader Full Name
              </RequiredLabel>
              <Input
                value={formData.projectLeaderName}
                onChange={(e) => updateFormData({ projectLeaderName: e.target.value })}
                placeholder="Enter full name"
                error={errors.projectLeaderName}
              />
            </div>

            <div>
              <RequiredLabel>
                Email
              </RequiredLabel>
              <Input
                type="email"
                value={formData.projectLeaderEmail}
                onChange={(e) => updateFormData({ projectLeaderEmail: e.target.value })}
                placeholder="Enter email address"
                error={errors.projectLeaderEmail}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.projectLeaderPhone}
                onChange={(e) => updateFormData({ projectLeaderPhone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <RequiredLabel>
                Entity
              </RequiredLabel>
              <Input
                value={formData.entity}
                onChange={(e) => updateFormData({ entity: e.target.value })}
                placeholder="Enter entity name"
                error={errors.entity}
              />
            </div>

            <div>
              <RequiredLabel>
                Department
              </RequiredLabel>
              <Input
                value={formData.department}
                onChange={(e) => updateFormData({ department: e.target.value })}
                placeholder="Enter department"
                error={errors.department}
              />
            </div>

            <div>
              <RequiredLabel>
                Submission Date
              </RequiredLabel>
              <Input
                type="date"
                value={formData.submissionDate}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Automatically set to today's date</p>
            </div>
          </div>
        )

      case 'event':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">2. General Information about the Event</h3>
            
            <div>
              <RequiredLabel>
                Event Title
              </RequiredLabel>
              <Input
                value={formData.eventTitle}
                onChange={(e) => updateFormData({ eventTitle: e.target.value })}
                placeholder="Enter event title"
                error={errors.eventTitle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Event Description
              </label>
              <textarea
                value={formData.eventDescription}
                onChange={(e) => updateFormData({ eventDescription: e.target.value })}
                placeholder="Provide a brief description of the event"
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <RequiredLabel>
                Nature of the Event
              </RequiredLabel>
              <RadioGroup
                name="eventNature"
                value={formData.eventNature}
                onChange={(value) => updateFormData({ eventNature: value })}
                options={[
                  { value: 'internal', label: 'Internal (UM6P)' },
                  { value: 'external', label: 'External (External institution)' }
                ]}
                error={errors.eventNature}
              />
            </div>

            <div>
              <RequiredLabel>
                Type of Event
              </RequiredLabel>
              <div className="space-y-3">
                <label className="flex items-start space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="eventType"
                    value="institutional"
                    checked={formData.eventType === 'institutional'}
                    onChange={(e) => updateFormData({ eventType: e.target.value, relevantCommittee: 'institutional' })}
                    className="w-4 h-4 mt-1 text-primary border-gray-300 focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium">Institutional</div>
                    <div className="text-sm text-gray-600">
                      Events that align with UM6P's institutional identity, positioning, and strategic partnerships.
                      Examples: official ceremonies, inaugurations, visits, forums, summits, or partnership signings.
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="eventType"
                    value="scientific"
                    checked={formData.eventType === 'scientific'}
                    onChange={(e) => updateFormData({ eventType: e.target.value, relevantCommittee: 'scientific' })}
                    className="w-4 h-4 mt-1 text-primary border-gray-300 focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium">Scientific & Research</div>
                    <div className="text-sm text-gray-600">
                      Events focused on research, knowledge sharing, and academic collaboration.
                      Examples: conferences, symposia, workshops, colloquia, summer schools, or scientific seminars.
                    </div>
                  </div>
                </label>
              </div>
              {errors.eventType && <p className="text-red-500 text-xs mt-1">{errors.eventType}</p>}
            </div>

            {formData.eventType && (
              <div>
                <RequiredLabel>
                  Relevant Committee
                </RequiredLabel>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  {formData.relevantCommittee === 'institutional' && (
                    <div>
                      <div className="font-medium text-lg mb-2">Institutional</div>
                      <div className="text-sm text-gray-600">
                        Mr. Ahmed LAZRAK – Contact: ahmed.lazrak@um6p.ma
                      </div>
                    </div>
                  )}
                  {formData.relevantCommittee === 'scientific' && (
                    <div>
                      <div className="font-medium text-lg mb-2">Scientific & Research</div>
                      <div className="text-sm text-gray-600">
                        Mr. Hicham El Gourgue – Contact: hicham.gourgue@um6p.ma<br />
                        Mr. Alami Jones – Contact: jones.alami@um6p.ma
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Event dates and times will be selected after choosing your venue in the Location section.
              </p>
            </div>
          </div>
        )

      case 'history':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">3. Event History</h3>
            
            <div>
              <OptionalLabel>
                Previous Edition
              </OptionalLabel>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasPreviousEdition"
                    checked={formData.hasPreviousEdition === true}
                    onChange={() => updateFormData({ hasPreviousEdition: true })}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasPreviousEdition"
                    checked={formData.hasPreviousEdition === false}
                    onChange={() => updateFormData({ hasPreviousEdition: false, previousEditionYear: '', participantCount: '', mediaVisibility: '' })}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formData.hasPreviousEdition && (
              <>
                <div>
                  <RequiredLabel>
                    Year of Previous Edition
                  </RequiredLabel>
                  <Select
                    value={formData.previousEditionYear}
                    onChange={(e) => updateFormData({ previousEditionYear: e.target.value })}
                    error={errors.previousEditionYear}
                  >
                    <option value="">Select year</option>
                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <RequiredLabel>
                    Number of Participants
                  </RequiredLabel>
                  <RadioGroup
                    name="participantCount"
                    value={formData.participantCount}
                    onChange={(value) => updateFormData({ participantCount: value })}
                    options={[
                      { value: '<300', label: '< 300' },
                      { value: '400-500', label: '400 – 500' },
                      { value: '>500', label: '> 500' }
                    ]}
                    error={errors.participantCount}
                  />
                </div>

                <div>
                  <RequiredLabel>
                    Media Visibility
                  </RequiredLabel>
                  <RadioGroup
                    name="mediaVisibility"
                    value={formData.mediaVisibility}
                    onChange={(value) => updateFormData({ mediaVisibility: value })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' }
                    ]}
                    error={errors.mediaVisibility}
                  />
                </div>
              </>
            )}

            <div>
              <OptionalLabel>
                VIP Guests
              </OptionalLabel>
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasVIPGuests"
                      checked={formData.hasVIPGuests === true}
                      onChange={() => updateFormData({ hasVIPGuests: true })}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasVIPGuests"
                      checked={formData.hasVIPGuests === false}
                      onChange={() => updateFormData({ hasVIPGuests: false, vipGuestsDetails: '' })}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.hasVIPGuests && (
                  <Textarea
                    value={formData.vipGuestsDetails}
                    onChange={(e) => updateFormData({ vipGuestsDetails: e.target.value })}
                    placeholder="Please specify VIP guests"
                    rows={3}
                    error={errors.vipGuestsDetails}
                  />
                )}
              </div>
            </div>
          </div>
        )

      case 'objectives':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">4. Objectives</h3>
            
            <div>
              <RequiredLabel>
                Main Objectives
              </RequiredLabel>
              <div className="space-y-2">
                {[
                  { value: 'visibility', label: "Enhance UM6P's visibility" },
                  { value: 'project', label: 'Highlight a project, program, or strategic initiative' },
                  { value: 'partnerships', label: 'Strengthen relationships with institutional or academic partners' },
                  { value: 'engagement', label: 'Foster engagement within UM6P community' }
                ].map((obj) => (
                  <Checkbox
                    key={obj.value}
                    label={obj.label}
                    checked={formData.mainObjectives?.includes(obj.value)}
                    onChange={(checked) => {
                      const current = formData.mainObjectives || []
                      updateFormData({
                        mainObjectives: checked
                          ? [...current, obj.value]
                          : current.filter((v: string) => v !== obj.value)
                      })
                    }}
                  />
                ))}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    label="Other:"
                    checked={formData.mainObjectives?.includes('other')}
                    onChange={(checked) => {
                      const current = formData.mainObjectives || []
                      updateFormData({
                        mainObjectives: checked
                          ? [...current, 'other']
                          : current.filter((v: string) => v !== 'other')
                      })
                    }}
                  />
                  {formData.mainObjectives?.includes('other') && (
                    <Input
                      value={formData.mainObjectivesOther}
                      onChange={(e) => updateFormData({ mainObjectivesOther: e.target.value })}
                      placeholder="Specify other objective"
                      className="flex-1"
                      error={errors.mainObjectivesOther}
                    />
                  )}
                </div>
              </div>
              {errors.mainObjectives && <p className="text-red-500 text-xs mt-1">{errors.mainObjectives}</p>}
            </div>

            <div>
              <OptionalLabel>
                Secondary Objectives
              </OptionalLabel>
              <div className="space-y-2">
                {[
                  { value: 'media', label: 'Increase media and digital visibility' },
                  { value: 'networking', label: 'Facilitate collaboration and networking opportunities' },
                  { value: 'materials', label: 'Produce promotional materials (photo, video, press)' }
                ].map((obj) => (
                  <Checkbox
                    key={obj.value}
                    label={obj.label}
                    checked={formData.secondaryObjectives?.includes(obj.value)}
                    onChange={(checked) => {
                      const current = formData.secondaryObjectives || []
                      updateFormData({
                        secondaryObjectives: checked
                          ? [...current, obj.value]
                          : current.filter((v: string) => v !== obj.value)
                      })
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case 'scope':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">5. Scope & Expected Impact</h3>
            
            <div>
              <RequiredLabel>
                Geographical Scope
              </RequiredLabel>
              <RadioGroup
                name="geographicalScope"
                value={formData.geographicalScope}
                onChange={(value) => updateFormData({ geographicalScope: value })}
                options={[
                  { value: 'internal', label: 'Internal' },
                  { value: 'national', label: 'National' },
                  { value: 'international', label: 'International' }
                ]}
                error={errors.geographicalScope}
              />
            </div>

            <div>
              <RequiredLabel>
                Expected Impact
              </RequiredLabel>
              <div className="space-y-2">
                {[
                  { value: 'visibility', label: 'External visibility' },
                  { value: 'engagement', label: 'Internal engagement' },
                  { value: 'partnership', label: 'Partnership development' },
                  { value: 'academic', label: 'Academic or scientific impact' }
                ].map((impact) => (
                  <Checkbox
                    key={impact.value}
                    label={impact.label}
                    checked={formData.expectedImpact?.includes(impact.value)}
                    onChange={(checked) => {
                      const current = formData.expectedImpact || []
                      updateFormData({
                        expectedImpact: checked
                          ? [...current, impact.value]
                          : current.filter((v: string) => v !== impact.value)
                      })
                    }}
                  />
                ))}
              </div>
              {errors.expectedImpact && <p className="text-red-500 text-xs mt-1">{errors.expectedImpact}</p>}
            </div>
          </div>
        )

      case 'audience':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">6. Target Audience</h3>
            
            <div>
              <RequiredLabel>
                Profiles
              </RequiredLabel>
              <div className="space-y-2">
                {[
                  { value: 'institutional', label: 'Institutional' },
                  { value: 'researchers', label: 'Researchers' },
                  { value: 'students', label: 'Students' },
                  { value: 'media', label: 'Media' },
                  { value: 'partners', label: 'External partners' }
                ].map((profile) => (
                  <Checkbox
                    key={profile.value}
                    label={profile.label}
                    checked={formData.targetProfiles?.includes(profile.value)}
                    onChange={(checked) => {
                      const current = formData.targetProfiles || []
                      updateFormData({
                        targetProfiles: checked
                          ? [...current, profile.value]
                          : current.filter((v: string) => v !== profile.value)
                      })
                    }}
                  />
                ))}
              </div>
              {errors.targetProfiles && <p className="text-red-500 text-xs mt-1">{errors.targetProfiles}</p>}
            </div>

            <div>
              <RequiredLabel>
                Expected Number of Participants
              </RequiredLabel>
              <Input
                type="number"
                value={formData.expectedParticipantCount}
                onChange={(e) => updateFormData({ expectedParticipantCount: e.target.value })}
                placeholder="Enter expected number"
                error={errors.expectedParticipantCount}
              />
            </div>
          </div>
        )

      case 'governance':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">7. Governance & Partners</h3>
            
            <div className="space-y-3">
              <h4 className="font-medium">Event Manager</h4>
              <div>
                <RequiredLabel>Name</RequiredLabel>
                <Input
                  value={formData.eventManagerName}
                  onChange={(e) => updateFormData({ eventManagerName: e.target.value })}
                  placeholder="Full name"
                  error={errors.eventManagerName}
                />
              </div>
              <div>
                <RequiredLabel>Position</RequiredLabel>
                <Input
                  value={formData.eventManagerPosition}
                  onChange={(e) => updateFormData({ eventManagerPosition: e.target.value })}
                  placeholder="Position/Title"
                  error={errors.eventManagerPosition}
                />
              </div>
              <div>
                <RequiredLabel>Contact</RequiredLabel>
                <Input
                  value={formData.eventManagerContact}
                  onChange={(e) => updateFormData({ eventManagerContact: e.target.value })}
                  placeholder="Email or phone"
                  error={errors.eventManagerContact}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Organizing Committee</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = formData.organizingCommittee || []
                    updateFormData({
                      organizingCommittee: [...current, { name: '', role: '', entity: '' }]
                    })
                  }}
                >
                  + Add Member
                </Button>
              </div>
              {formData.organizingCommittee?.map((member: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                  {formData.organizingCommittee.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.organizingCommittee.filter((_: any, i: number) => i !== index)
                        updateFormData({ organizingCommittee: updated })
                      }}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div>
                    <RequiredLabel>Name</RequiredLabel>
                    <Input
                      value={member.name}
                      onChange={(e) => {
                        const updated = [...formData.organizingCommittee]
                        updated[index].name = e.target.value
                        updateFormData({ organizingCommittee: updated })
                      }}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <RequiredLabel>Role</RequiredLabel>
                    <Input
                      value={member.role}
                      onChange={(e) => {
                        const updated = [...formData.organizingCommittee]
                        updated[index].role = e.target.value
                        updateFormData({ organizingCommittee: updated })
                      }}
                      placeholder="Role in committee"
                    />
                  </div>
                  <div>
                    <RequiredLabel>Represented Entity</RequiredLabel>
                    <Input
                      value={member.entity}
                      onChange={(e) => {
                        const updated = [...formData.organizingCommittee]
                        updated[index].entity = e.target.value
                        updateFormData({ organizingCommittee: updated })
                      }}
                      placeholder="Organization/Department"
                    />
                  </div>
                </div>
              ))}
              {errors.organizingCommittee && <p className="text-red-500 text-xs mt-1">{errors.organizingCommittee}</p>}
            </div>

            <div>
              <RequiredLabel>
                Associated Partners
              </RequiredLabel>
              <RadioGroup
                name="associatedPartners"
                value={formData.associatedPartners}
                onChange={(value) => updateFormData({ associatedPartners: value })}
                options={[
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'discussion', label: 'Under discussion' },
                  { value: 'none', label: 'None' }
                ]}
                error={errors.associatedPartners}
              />
            </div>

            <div>
              <OptionalLabel>
                Protocol Support Required
              </OptionalLabel>
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="protocolSupportRequired"
                      checked={formData.protocolSupportRequired === true}
                      onChange={() => updateFormData({ protocolSupportRequired: true })}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="protocolSupportRequired"
                      checked={formData.protocolSupportRequired === false}
                      onChange={() => updateFormData({ protocolSupportRequired: false, protocolSupport: [] })}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.protocolSupportRequired && (
                  <div className="pl-6 space-y-2">
                    <div className="text-sm font-medium mb-2">If yes:</div>
                    {[
                      { value: 'presidency', label: 'Presidency' },
                      { value: 'communication', label: 'Communication' },
                      { value: 'security', label: 'Security' },
                      { value: 'logistics', label: 'Logistics' }
                    ].map((support) => (
                      <Checkbox
                        key={support.value}
                        label={support.label}
                        checked={formData.protocolSupport?.includes(support.value)}
                        onChange={(checked) => {
                          const current = formData.protocolSupport || []
                          updateFormData({
                            protocolSupport: checked
                              ? [...current, support.value]
                              : current.filter((v: string) => v !== support.value)
                          })
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'program':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">8. Preliminary Program</h3>
            
            <div>
              <RequiredLabel>
                Format
              </RequiredLabel>
              <div className="space-y-2">
                {[
                  { value: 'plenary', label: 'Plenary' },
                  { value: 'panels', label: 'Panels' },
                  { value: 'signature', label: 'Signature' },
                  { value: 'roundtable', label: 'Round Table' },
                  { value: 'exhibition', label: 'Exhibition' }
                ].map((format) => (
                  <Checkbox
                    key={format.value}
                    label={format.label}
                    checked={formData.programFormat?.includes(format.value)}
                    onChange={(checked) => {
                      const current = formData.programFormat || []
                      updateFormData({
                        programFormat: checked
                          ? [...current, format.value]
                          : current.filter((v: string) => v !== format.value)
                      })
                    }}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    label="Other:"
                    checked={formData.programFormat?.includes('other')}
                    onChange={(checked) => {
                      const current = formData.programFormat || []
                      updateFormData({
                        programFormat: checked
                          ? [...current, 'other']
                          : current.filter((v: string) => v !== 'other'),
                        programFormatOther: checked ? formData.programFormatOther : ''
                      })
                    }}
                  />
                  {formData.programFormat?.includes('other') && (
                    <Input
                      value={formData.programFormatOther}
                      onChange={(e) => updateFormData({ programFormatOther: e.target.value })}
                      placeholder="Specify format"
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
              {errors.programFormat && <p className="text-red-500 text-xs mt-1">{errors.programFormat}</p>}
            </div>

            <div>
              <RequiredLabel>
                Speakers
              </RequiredLabel>
              <RadioGroup
                name="speakersStatus"
                value={formData.speakersStatus}
                onChange={(value) => updateFormData({ speakersStatus: value })}
                options={[
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'progress', label: 'In progress' }
                ]}
                error={errors.speakersStatus}
              />
            </div>

            <div>
              <OptionalLabel>
                Side Activities
              </OptionalLabel>
              <div className="space-y-2">
                {[
                  { value: 'visit', label: 'Visit' },
                  { value: 'demonstration', label: 'Demonstration' },
                  { value: 'networking', label: 'Networking' },
                  { value: 'training', label: 'Training' }
                ].map((activity) => (
                  <Checkbox
                    key={activity.value}
                    label={activity.label}
                    checked={formData.sideActivities?.includes(activity.value)}
                    onChange={(checked) => {
                      const current = formData.sideActivities || []
                      updateFormData({
                        sideActivities: checked
                          ? [...current, activity.value]
                          : current.filter((v: string) => v !== activity.value)
                      })
                    }}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    label="Other:"
                    checked={formData.sideActivities?.includes('other')}
                    onChange={(checked) => {
                      const current = formData.sideActivities || []
                      updateFormData({
                        sideActivities: checked
                          ? [...current, 'other']
                          : current.filter((v: string) => v !== 'other'),
                        sideActivitiesOther: checked ? formData.sideActivitiesOther : ''
                      })
                    }}
                  />
                  {formData.sideActivities?.includes('other') && (
                    <Input
                      value={formData.sideActivitiesOther}
                      onChange={(e) => updateFormData({ sideActivitiesOther: e.target.value })}
                      placeholder="Specify activity"
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'logistics':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">9. Logistics & Infrastructure</h3>
            <div>
              <RequiredLabel>
                Required Equipment
              </RequiredLabel>
              <div className="space-y-2">
                {[
                  { value: 'audiovisual', label: 'Audiovisual' },
                  { value: 'mapping', label: 'Mapping' },
                  { value: 'recording', label: 'Recording' },
                  { value: 'translation', label: 'Translation' },
                  { value: 'streaming', label: 'Streaming' }
                ].map((equipment) => (
                  <Checkbox
                    key={equipment.value}
                    label={equipment.label}
                    checked={formData.requiredEquipment?.includes(equipment.value)}
                    onChange={(checked) => {
                      const current = formData.requiredEquipment || []
                      updateFormData({
                        requiredEquipment: checked
                          ? [...current, equipment.value]
                          : current.filter((v: string) => v !== equipment.value)
                      })
                    }}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    label="Other:"
                    checked={formData.requiredEquipment?.includes('other')}
                    onChange={(checked) => {
                      const current = formData.requiredEquipment || []
                      updateFormData({
                        requiredEquipment: checked
                          ? [...current, 'other']
                          : current.filter((v: string) => v !== 'other'),
                        requiredEquipmentOther: checked ? formData.requiredEquipmentOther : ''
                      })
                    }}
                  />
                  {formData.requiredEquipment?.includes('other') && (
                    <Input
                      value={formData.requiredEquipmentOther}
                      onChange={(e) => updateFormData({ requiredEquipmentOther: e.target.value })}
                      placeholder="Specify equipment"
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
              {errors.requiredEquipment && <p className="text-red-500 text-xs mt-1">{errors.requiredEquipment}</p>}
            </div>

            <div>
              <OptionalLabel>
                Transport / Accommodation / Catering
              </OptionalLabel>
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="needsTransportAccommodation"
                      checked={formData.needsTransportAccommodation === true}
                      onChange={() => updateFormData({ needsTransportAccommodation: true })}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="needsTransportAccommodation"
                      checked={formData.needsTransportAccommodation === false}
                      onChange={() => updateFormData({ needsTransportAccommodation: false, transportAccommodationDetails: '' })}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.needsTransportAccommodation && (
                  <Textarea
                    value={formData.transportAccommodationDetails}
                    onChange={(e) => updateFormData({ transportAccommodationDetails: e.target.value })}
                    placeholder="Specify details in logistics annex"
                    rows={3}
                  />
                )}
              </div>
            </div>

            <div>
              <OptionalLabel>
                Other Specific Needs
              </OptionalLabel>
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="otherSpecificNeeds"
                      checked={formData.otherSpecificNeeds === true}
                      onChange={() => updateFormData({ otherSpecificNeeds: true })}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="otherSpecificNeeds"
                      checked={formData.otherSpecificNeeds === false}
                      onChange={() => updateFormData({ otherSpecificNeeds: false, otherSpecificNeedsDetails: '' })}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.otherSpecificNeeds && (
                  <Textarea
                    value={formData.otherSpecificNeedsDetails}
                    onChange={(e) => updateFormData({ otherSpecificNeedsDetails: e.target.value })}
                    placeholder="Please specify"
                    rows={3}
                  />
                )}
              </div>
            </div>
          </div>
        )

      case 'communication':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">10. Communication & Visibility</h3>
            
            <div>
              <RequiredLabel>
                Communication Objectives
              </RequiredLabel>
              <div className="space-y-2">
                {[
                  { value: 'image', label: 'Institutional image' },
                  { value: 'press', label: 'Press relations' },
                  { value: 'social', label: 'Social media' }
                ].map((objective) => (
                  <Checkbox
                    key={objective.value}
                    label={objective.label}
                    checked={formData.communicationObjectives?.includes(objective.value)}
                    onChange={(checked) => {
                      const current = formData.communicationObjectives || []
                      updateFormData({
                        communicationObjectives: checked
                          ? [...current, objective.value]
                          : current.filter((v: string) => v !== objective.value)
                      })
                    }}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    label="Other:"
                    checked={formData.communicationObjectives?.includes('other')}
                    onChange={(checked) => {
                      const current = formData.communicationObjectives || []
                      updateFormData({
                        communicationObjectives: checked
                          ? [...current, 'other']
                          : current.filter((v: string) => v !== 'other'),
                        communicationObjectivesOther: checked ? formData.communicationObjectivesOther : ''
                      })
                    }}
                  />
                  {formData.communicationObjectives?.includes('other') && (
                    <Input
                      value={formData.communicationObjectivesOther}
                      onChange={(e) => updateFormData({ communicationObjectivesOther: e.target.value })}
                      placeholder="Specify objective"
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
              {errors.communicationObjectives && <p className="text-red-500 text-xs mt-1">{errors.communicationObjectives}</p>}
            </div>

            <div>
              <RequiredLabel>
                Planned Actions
              </RequiredLabel>
              <div className="space-y-2">
                {[
                  { value: 'branding', label: 'Branding' },
                  { value: 'video', label: 'Video' },
                  { value: 'photography', label: 'Photography' },
                  { value: 'press', label: 'Press release' }
                ].map((action) => (
                  <Checkbox
                    key={action.value}
                    label={action.label}
                    checked={formData.plannedActions?.includes(action.value)}
                    onChange={(checked) => {
                      const current = formData.plannedActions || []
                      updateFormData({
                        plannedActions: checked
                          ? [...current, action.value]
                          : current.filter((v: string) => v !== action.value)
                      })
                    }}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    label="Other:"
                    checked={formData.plannedActions?.includes('other')}
                    onChange={(checked) => {
                      const current = formData.plannedActions || []
                      updateFormData({
                        plannedActions: checked
                          ? [...current, 'other']
                          : current.filter((v: string) => v !== 'other'),
                        plannedActionsOther: checked ? formData.plannedActionsOther : ''
                      })
                    }}
                  />
                  {formData.plannedActions?.includes('other') && (
                    <Input
                      value={formData.plannedActionsOther}
                      onChange={(e) => updateFormData({ plannedActionsOther: e.target.value })}
                      placeholder="Specify action"
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
              {errors.plannedActions && <p className="text-red-500 text-xs mt-1">{errors.plannedActions}</p>}
            </div>

            <div>
              <RequiredLabel>
                Expected Visibility Level
              </RequiredLabel>
              <RadioGroup
                name="expectedVisibilityLevel"
                value={formData.expectedVisibilityLevel}
                onChange={(value) => updateFormData({ expectedVisibilityLevel: value })}
                options={[
                  { value: 'internal', label: 'Internal' },
                  { value: 'national', label: 'National' },
                  { value: 'international', label: 'International' }
                ]}
                error={errors.expectedVisibilityLevel}
              />
            </div>
          </div>
        )

      case 'budget':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">11. Provisional Budget</h3>
            
            <div>
              <RequiredLabel>
                Estimated Total Budget (MAD)
              </RequiredLabel>
              <RadioGroup
                name="estimatedBudget"
                value={formData.estimatedBudget}
                onChange={(value) => updateFormData({ estimatedBudget: value })}
                options={[
                  { value: '<800K', label: '< 800K' },
                  { value: '800K-1.5M', label: '800K – 1.5M' },
                  { value: '>1.5M', label: '> 1.5M' }
                ]}
                error={errors.estimatedBudget}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <OptionalLabel>Agency Estimate</OptionalLabel>
                <Input
                  value={formData.agencyEstimate}
                  onChange={(e) => updateFormData({ agencyEstimate: e.target.value })}
                  placeholder="Amount in MAD"
                />
              </div>

              <div>
                <OptionalLabel>Catering Estimate</OptionalLabel>
                <Input
                  value={formData.cateringEstimate}
                  onChange={(e) => updateFormData({ cateringEstimate: e.target.value })}
                  placeholder="Amount in MAD"
                />
              </div>

              <div>
                <OptionalLabel>Transport Estimate</OptionalLabel>
                <Input
                  value={formData.transportEstimate}
                  onChange={(e) => updateFormData({ transportEstimate: e.target.value })}
                  placeholder="Amount in MAD"
                />
              </div>

              <div>
                <OptionalLabel>Accommodation Estimate</OptionalLabel>
                <Input
                  value={formData.accommodationEstimate}
                  onChange={(e) => updateFormData({ accommodationEstimate: e.target.value })}
                  placeholder="Amount in MAD"
                />
              </div>

              <div>
                <OptionalLabel>Flight Ticketing Estimate</OptionalLabel>
                <Input
                  value={formData.flightEstimate}
                  onChange={(e) => updateFormData({ flightEstimate: e.target.value })}
                  placeholder="Amount in MAD"
                />
              </div>

              <div>
                <OptionalLabel>Overall Estimate (internal + external services)</OptionalLabel>
                <Input
                  value={formData.overallEstimate}
                  onChange={(e) => updateFormData({ overallEstimate: e.target.value })}
                  placeholder="Total amount in MAD"
                />
              </div>
            </div>

            <div>
              <RequiredLabel>
                Funding Sources
              </RequiredLabel>
              <div className="space-y-2">
                {[
                  { value: 'entity', label: 'Hosting Entity' },
                  { value: 'partners', label: 'Partners' },
                  { value: 'sponsorship', label: 'Sponsorship' }
                ].map((source) => (
                  <Checkbox
                    key={source.value}
                    label={source.label}
                    checked={formData.fundingSources?.includes(source.value)}
                    onChange={(checked) => {
                      const current = formData.fundingSources || []
                      updateFormData({
                        fundingSources: checked
                          ? [...current, source.value]
                          : current.filter((v: string) => v !== source.value)
                      })
                    }}
                  />
                ))}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    label="Other:"
                    checked={formData.fundingSources?.includes('other')}
                    onChange={(checked) => {
                      const current = formData.fundingSources || []
                      updateFormData({
                        fundingSources: checked
                          ? [...current, 'other']
                          : current.filter((v: string) => v !== 'other')
                      })
                    }}
                  />
                  {formData.fundingSources?.includes('other') && (
                    <Input
                      value={formData.fundingSourcesOther}
                      onChange={(e) => updateFormData({ fundingSourcesOther: e.target.value })}
                      placeholder="Specify other source"
                      className="flex-1"
                      error={errors.fundingSourcesOther}
                    />
                  )}
                </div>
              </div>
              {errors.fundingSources && <p className="text-red-500 text-xs mt-1">{errors.fundingSources}</p>}
            </div>

            <div>
              <OptionalLabel>Estimated Sponsorship Budget</OptionalLabel>
              <Input
                value={formData.estimatedSponsorship}
                onChange={(e) => updateFormData({ estimatedSponsorship: e.target.value })}
                placeholder="Amount in MAD"
              />
            </div>

            <div>
              <OptionalLabel>Comments</OptionalLabel>
              <Textarea
                value={formData.budgetComments}
                onChange={(e) => updateFormData({ budgetComments: e.target.value })}
                placeholder="Additional budget comments"
                rows={3}
              />
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">12. Event Location</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Select your event location:</strong> First choose a campus, then select a suitable venue based on your expected attendance.
              </p>
            </div>

            {/* Campus Selection */}
            <div>
              <RequiredLabel>Select Campus</RequiredLabel>
              <select
                value={formData.selectedCampusId}
                onChange={async (e) => {
                  const campusId = e.target.value
                  updateFormData({ 
                    selectedCampusId: campusId,
                    selectedLocationId: '',
                    selectedLocationType: '',
                    selectedLocationName: ''
                  })
                  
                  if (campusId) {
                    setLoadingLocations(true)
                    try {
                      // Fetch all reservable locations for this campus
                      const [locationsRes, buildingsRes, openSpacesRes] = await Promise.all([
                        getLocations(1, 100, undefined, campusId),
                        getAllBuildings(1, 100, '', campusId),
                        getOpenSpaces(1, 100, '', campusId)
                      ])
                      
                      console.log('API Responses:', { locationsRes, buildingsRes, openSpacesRes })
                      
                      const locations: any[] = []
                      
                      // Add locations (handle both response formats)
                      const locData = (locationsRes as any)?.data || (locationsRes as any)?.locations || []
                      if (Array.isArray(locData)) {
                        locData
                          .filter((loc: any) => loc.isReservable)
                          .forEach((loc: any) => {
                            locations.push({
                              id: loc.id,
                              name: loc.name,
                              type: 'location',
                              capacity: loc.capacity || 0,
                              buildingName: loc.building?.name || 'Unknown Building'
                            })
                          })
                      }
                      
                      // Add buildings (handle both response formats)
                      const buildData = (buildingsRes as any)?.data || (buildingsRes as any)?.buildings || []
                      if (Array.isArray(buildData)) {
                        buildData
                          .filter((building: any) => building.isReservable)
                          .forEach((building: any) => {
                            locations.push({
                              id: building.id,
                              name: building.name,
                              type: 'building',
                              capacity: building.capacity || 0,
                              buildingName: building.name
                            })
                          })
                      }
                      
                      // Add open spaces (handle both response formats)
                      const spaceData = (openSpacesRes as any)?.data || (openSpacesRes as any)?.openSpaces || []
                      if (Array.isArray(spaceData)) {
                        spaceData
                          .filter((space: any) => space.isReservable)
                          .forEach((space: any) => {
                            locations.push({
                              id: space.id,
                              name: space.name,
                              type: 'openSpace',
                              capacity: space.capacity || 0,
                              buildingName: 'Open Space'
                            })
                          })
                      }
                      
                      console.log('Total locations found:', locations.length, locations)
                      setAvailableLocations(locations)
                    } catch (error) {
                      console.error('Failed to fetch locations:', error)
                      setAvailableLocations([])
                    } finally {
                      setLoadingLocations(false)
                    }
                  } else {
                    setAvailableLocations([])
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a campus</option>
                {campuses.map((campus: any) => (
                  <option key={campus.id} value={campus.id}>{campus.name}</option>
                ))}
              </select>
              {errors.selectedCampusId && <p className="text-red-500 text-xs mt-1">{errors.selectedCampusId}</p>}
            </div>

            {/* Location Selection */}
            {formData.selectedCampusId && (
              <div>
                <RequiredLabel>Select Event Venue</RequiredLabel>
                {loadingLocations ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Loading available venues...</p>
                  </div>
                ) : availableLocations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No reservable venues available for this campus</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableLocations
                      .filter((location: any) => {
                        // Filter based on expected participant count
                        const expectedCount = parseInt(formData.expectedParticipantCount) || 0
                        if (expectedCount === 0) return true
                        return location.capacity >= expectedCount
                      })
                      .sort((a: any, b: any) => a.capacity - b.capacity)
                      .map((location: any) => (
                        <label
                          key={location.id}
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.selectedLocationId === location.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedLocation"
                            value={location.id}
                            checked={formData.selectedLocationId === location.id}
                            onChange={async () => {
                              updateFormData({
                                selectedLocationId: location.id,
                                selectedLocationType: location.type,
                                selectedLocationName: location.name,
                                startDate: '', // Reset dates when location changes
                                endDate: ''
                              })
                              
                              // Fetch blocked dates for this location
                              setLoadingBlockedDates(true)
                              try {
                                const response = await fetch(
                                  `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reservations/blocked-dates?locationId=${location.id}&locationType=${location.type}`,
                                  {
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    }
                                  }
                                )
                                const result = await response.json()
                                if (result.success) {
                                  setBlockedDates(result.data)
                                }
                              } catch (error) {
                                console.error('Failed to fetch blocked dates:', error)
                                setBlockedDates([])
                              } finally {
                                setLoadingBlockedDates(false)
                              }
                            }}
                            className="w-4 h-4 mt-1 text-primary border-gray-300 focus:ring-primary"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{location.name}</div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                location.type === 'location' ? 'bg-blue-100 text-blue-700' :
                                location.type === 'building' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {location.type === 'location' ? 'Room' :
                                 location.type === 'building' ? 'Building' : 'Open Space'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <p>{location.buildingName}</p>
                              <p className="flex items-center gap-1 mt-1">
                                <Users className="w-3 h-3" />
                                Capacity: {location.capacity} people
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    {availableLocations.filter((location: any) => {
                      const expectedCount = parseInt(formData.expectedParticipantCount) || 0
                      if (expectedCount === 0) return true
                      return location.capacity >= expectedCount
                    }).length === 0 && (
                      <div className="text-center py-8 text-amber-600 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50">
                        <p className="font-medium">No venues match your capacity requirements</p>
                        <p className="text-sm mt-1">Expected participants: {formData.expectedParticipantCount}</p>
                        <p className="text-xs mt-2">Consider reducing the expected participant count or contact administration for larger venues.</p>
                      </div>
                    )}
                  </div>
                )}
                {errors.selectedLocationId && <p className="text-red-500 text-xs mt-1">{errors.selectedLocationId}</p>}
              </div>
            )}

            {formData.selectedLocationId && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">✓ Selected Venue</h4>
                  <p className="text-sm text-green-700">
                    <strong>{formData.selectedLocationName}</strong> has been selected for your event.
                  </p>
                </div>

                {/* Date Selection - Only shown after location is selected */}
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-lg">Select Event Dates</h4>
                  
                  {loadingBlockedDates ? (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm">Checking availability...</p>
                    </div>
                  ) : blockedDates.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h5 className="font-medium text-amber-800 mb-2">⚠️ Unavailable Dates</h5>
                      <p className="text-sm text-amber-700 mb-2">The following dates are already reserved for this venue:</p>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {blockedDates.map((blocked, idx) => (
                          <li key={idx}>
                            • {new Date(blocked.startDate).toLocaleDateString()} - {new Date(blocked.endDate).toLocaleDateString()}: <strong>{blocked.eventTitle}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">✓ No conflicts found. You can select any available dates.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <RequiredLabel>Start Date</RequiredLabel>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => {
                          const selectedDate = e.target.value
                          if (!selectedDate) {
                            updateFormData({ startDate: '' })
                            return
                          }
                          
                          // Check if date is blocked
                          const conflictingEvent = blockedDates.find(blocked => {
                            const start = new Date(blocked.startDate)
                            start.setHours(0, 0, 0, 0)
                            const end = new Date(blocked.endDate)
                            end.setHours(23, 59, 59, 999)
                            const selected = new Date(selectedDate)
                            selected.setHours(12, 0, 0, 0)
                            return selected >= start && selected <= end
                          })
                          
                          if (conflictingEvent) {
                            toast.error(`❌ This date is blocked by: ${conflictingEvent.eventTitle}`)
                            // Reset to empty
                            setTimeout(() => {
                              e.target.value = ''
                              updateFormData({ startDate: '' })
                            }, 100)
                            return
                          }
                          
                          updateFormData({ startDate: selectedDate })
                        }}
                        onBlur={(e) => {
                          const selectedDate = e.target.value
                          if (!selectedDate) return
                          
                          const conflictingEvent = blockedDates.find(blocked => {
                            const start = new Date(blocked.startDate)
                            start.setHours(0, 0, 0, 0)
                            const end = new Date(blocked.endDate)
                            end.setHours(23, 59, 59, 999)
                            const selected = new Date(selectedDate)
                            selected.setHours(12, 0, 0, 0)
                            return selected >= start && selected <= end
                          })
                          
                          if (conflictingEvent) {
                            toast.error(`❌ Cannot select blocked date: ${conflictingEvent.eventTitle}`)
                            e.target.value = ''
                            updateFormData({ startDate: '' })
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors.startDate ? 'border-red-500' : 
                          formData.startDate && blockedDates.some(blocked => {
                            const start = new Date(blocked.startDate)
                            start.setHours(0, 0, 0, 0)
                            const end = new Date(blocked.endDate)
                            end.setHours(23, 59, 59, 999)
                            const selected = new Date(formData.startDate)
                            selected.setHours(12, 0, 0, 0)
                            return selected >= start && selected <= end
                          }) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                      {formData.startDate && blockedDates.some(blocked => {
                        const start = new Date(blocked.startDate)
                        start.setHours(0, 0, 0, 0)
                        const end = new Date(blocked.endDate)
                        end.setHours(23, 59, 59, 999)
                        const selected = new Date(formData.startDate)
                        selected.setHours(12, 0, 0, 0)
                        return selected >= start && selected <= end
                      }) && (
                        <p className="text-red-500 text-xs mt-1 font-semibold">⚠️ This date is blocked - please select another date</p>
                      )}
                    </div>
                    <div>
                      <RequiredLabel>Start Time</RequiredLabel>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => updateFormData({ startTime: e.target.value })}
                        error={errors.startTime}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <RequiredLabel>End Date</RequiredLabel>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => {
                          const selectedDate = e.target.value
                          if (!selectedDate) {
                            updateFormData({ endDate: '' })
                            return
                          }
                          
                          // Check if date range overlaps with blocked dates
                          const conflictingEvent = blockedDates.find(blocked => {
                            const blockedStart = new Date(blocked.startDate)
                            blockedStart.setHours(0, 0, 0, 0)
                            const blockedEnd = new Date(blocked.endDate)
                            blockedEnd.setHours(23, 59, 59, 999)
                            const selectedStart = new Date(formData.startDate)
                            selectedStart.setHours(0, 0, 0, 0)
                            const selectedEnd = new Date(selectedDate)
                            selectedEnd.setHours(23, 59, 59, 999)
                            // Check for any overlap
                            return (selectedStart <= blockedEnd && selectedEnd >= blockedStart)
                          })
                          
                          if (conflictingEvent) {
                            toast.error(`❌ Date range conflicts with: ${conflictingEvent.eventTitle}`)
                            // Reset to empty
                            setTimeout(() => {
                              e.target.value = ''
                              updateFormData({ endDate: '' })
                            }, 100)
                            return
                          }
                          
                          updateFormData({ endDate: selectedDate })
                        }}
                        onBlur={(e) => {
                          const selectedDate = e.target.value
                          if (!selectedDate || !formData.startDate) return
                          
                          const conflictingEvent = blockedDates.find(blocked => {
                            const blockedStart = new Date(blocked.startDate)
                            blockedStart.setHours(0, 0, 0, 0)
                            const blockedEnd = new Date(blocked.endDate)
                            blockedEnd.setHours(23, 59, 59, 999)
                            const selectedStart = new Date(formData.startDate)
                            selectedStart.setHours(0, 0, 0, 0)
                            const selectedEnd = new Date(selectedDate)
                            selectedEnd.setHours(23, 59, 59, 999)
                            return (selectedStart <= blockedEnd && selectedEnd >= blockedStart)
                          })
                          
                          if (conflictingEvent) {
                            toast.error(`❌ Cannot select conflicting date range: ${conflictingEvent.eventTitle}`)
                            e.target.value = ''
                            updateFormData({ endDate: '' })
                          }
                        }}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors.endDate ? 'border-red-500' : 
                          formData.startDate && formData.endDate && blockedDates.some(blocked => {
                            const blockedStart = new Date(blocked.startDate)
                            blockedStart.setHours(0, 0, 0, 0)
                            const blockedEnd = new Date(blocked.endDate)
                            blockedEnd.setHours(23, 59, 59, 999)
                            const selectedStart = new Date(formData.startDate)
                            selectedStart.setHours(0, 0, 0, 0)
                            const selectedEnd = new Date(formData.endDate)
                            selectedEnd.setHours(23, 59, 59, 999)
                            return (selectedStart <= blockedEnd && selectedEnd >= blockedStart)
                          }) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                      {formData.startDate && formData.endDate && blockedDates.some(blocked => {
                        const blockedStart = new Date(blocked.startDate)
                        blockedStart.setHours(0, 0, 0, 0)
                        const blockedEnd = new Date(blocked.endDate)
                        blockedEnd.setHours(23, 59, 59, 999)
                        const selectedStart = new Date(formData.startDate)
                        selectedStart.setHours(0, 0, 0, 0)
                        const selectedEnd = new Date(formData.endDate)
                        selectedEnd.setHours(23, 59, 59, 999)
                        return (selectedStart <= blockedEnd && selectedEnd >= blockedStart)
                      }) && (
                        <p className="text-red-500 text-xs mt-1 font-semibold">⚠️ Date range conflicts - please select different dates</p>
                      )}
                    </div>
                    <div>
                      <RequiredLabel>End Time</RequiredLabel>
                      <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => updateFormData({ endTime: e.target.value })}
                        error={errors.endTime}
                      />
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && formData.startTime && formData.endTime && (() => {
                    const start = new Date(`${formData.startDate}T${formData.startTime}`)
                    const end = new Date(`${formData.endDate}T${formData.endTime}`)
                    const diffMs = end.getTime() - start.getTime()
                    const diffHours = diffMs / (1000 * 60 * 60)
                    const diffDays = Math.floor(diffHours / 24)
                    const remainingHours = diffHours % 24

                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Duration:</strong> {diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''} and ` : ''}{remainingHours.toFixed(1)} hour{remainingHours !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
        )

      case 'documents':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">13. Supporting Documents</h3>
            
            {formData.eventType === 'scientific' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Required:</strong> For Scientific & Research events, you must upload at least one supporting document.
                </p>
              </div>
            )}

            {formData.eventType !== 'scientific' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Optional:</strong> You may upload supporting documents for your event application.
                </p>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${formData.eventType === 'scientific' ? 'text-red-600' : 'text-gray-700'}`}>
                {formData.eventType === 'scientific' ? 'Upload Documents*' : 'Upload Documents (Optional)'}
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    const newDocs = files.map(file => ({
                      name: file.name,
                      file: file,
                      type: file.type
                    }))
                    updateFormData({
                      uploadedDocuments: [...(formData.uploadedDocuments || []), ...newDocs]
                    })
                  }}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload documents</p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Max 10MB each)</p>
                </label>
              </div>

              {formData.uploadedDocuments && formData.uploadedDocuments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Uploaded Documents:</p>
                  {formData.uploadedDocuments.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.uploadedDocuments.filter((_: any, i: number) => i !== index)
                          updateFormData({ uploadedDocuments: updated })
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.uploadedDocuments && <p className="text-red-500 text-xs mt-1">{errors.uploadedDocuments}</p>}
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium mb-2">Recommended Documents:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Event concept note or proposal</li>
                <li>Preliminary program or agenda</li>
                <li>Budget breakdown details</li>
                <li>Partner agreements or letters of intent</li>
                <li>Speaker confirmations</li>
                <li>Venue layout or floor plans</li>
              </ul>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">13. Review Your Application</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Review all information below.</strong> Click "Edit" on any section to make changes before final submission.
              </p>
            </div>

            {/* 1. Applicant Information */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <User className="w-4 h-4" />
                  1. Applicant Information
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(0)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Project Leader:</strong> {formData.projectLeaderName || 'Not specified'}</p>
                <p><strong>Email:</strong> {formData.projectLeaderEmail || 'Not specified'}</p>
                <p><strong>Phone:</strong> {formData.projectLeaderPhone || 'Not specified'}</p>
                <p><strong>Department:</strong> {formData.department || 'Not specified'}</p>
                <p><strong>Entity:</strong> {formData.entity || 'Not specified'}</p>
              </div>
            </div>

            {/* 2. Event Details */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  2. Event Details
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(1)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Event Title:</strong> {formData.eventTitle || 'Not specified'}</p>
                <p><strong>Event Type:</strong> {formData.eventType || 'Not specified'}</p>
                <p><strong>Relevant Committee:</strong> {formData.relevantCommittee === 'institutional' ? 'Institutional Committee' : formData.relevantCommittee === 'scientific' ? 'Scientific & Research Committee' : 'Not specified'}</p>
                <p><strong>Start Date & Time:</strong> {formData.startDate && formData.startTime ? `${formData.startDate} at ${formData.startTime}` : 'Not specified'}</p>
                <p><strong>End Date & Time:</strong> {formData.endDate && formData.endTime ? `${formData.endDate} at ${formData.endTime}` : 'Not specified'}</p>
                <p><strong>Description:</strong> {formData.eventDescription || 'Not specified'}</p>
              </div>
            </div>

            {/* 3. Event History */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <History className="w-4 h-4" />
                  3. Event History
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(2)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Previous Edition:</strong> {formData.hasPreviousEdition === true ? 'Yes' : formData.hasPreviousEdition === false ? 'No' : 'Not specified'}</p>
                {formData.hasPreviousEdition && (
                  <>
                    <p><strong>Year:</strong> {formData.previousEditionYear || 'Not specified'}</p>
                    <p><strong>Participants:</strong> {formData.participantCount || 'Not specified'}</p>
                    <p><strong>Media Visibility:</strong> {formData.mediaVisibility || 'Not specified'}</p>
                  </>
                )}
                <p><strong>VIP Guests:</strong> {formData.hasVIPGuests === true ? 'Yes' : formData.hasVIPGuests === false ? 'No' : 'Not specified'}</p>
                {formData.hasVIPGuests && formData.vipGuestsDetails && (
                  <p><strong>VIP Details:</strong> {formData.vipGuestsDetails}</p>
                )}
              </div>
            </div>

            {/* 4. Objectives */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  4. Objectives
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(3)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Main Objectives:</strong> {formData.mainObjectives?.length > 0 ? formData.mainObjectives.join(', ') : 'Not specified'}</p>
                {formData.mainObjectives?.includes('other') && formData.mainObjectivesOther && (
                  <p><strong>Other Objective:</strong> {formData.mainObjectivesOther}</p>
                )}
                <p><strong>Secondary Objectives:</strong> {formData.secondaryObjectives?.length > 0 ? formData.secondaryObjectives.join(', ') : 'None'}</p>
              </div>
            </div>

            {/* 5. Scope & Impact */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  5. Scope & Expected Impact
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(4)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Geographical Scope:</strong> {formData.geographicalScope || 'Not specified'}</p>
                <p><strong>Expected Impact:</strong> {formData.expectedImpact?.length > 0 ? formData.expectedImpact.join(', ') : 'Not specified'}</p>
              </div>
            </div>

            {/* 6. Target Audience */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  6. Target Audience
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(5)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Profiles:</strong> {formData.targetProfiles?.length > 0 ? formData.targetProfiles.join(', ') : 'Not specified'}</p>
                <p><strong>Expected Participants:</strong> {formData.expectedParticipantCount || 'Not specified'}</p>
              </div>
            </div>

            {/* 7. Governance & Partners */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  7. Governance & Partners
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(6)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Event Manager:</strong> {formData.eventManagerName || 'Not specified'}</p>
                <p><strong>Position:</strong> {formData.eventManagerPosition || 'Not specified'}</p>
                <p><strong>Contact:</strong> {formData.eventManagerContact || 'Not specified'}</p>
                <div>
                  <strong>Organizing Committee:</strong>
                  {formData.organizingCommittee?.length > 0 ? (
                    <ul className="ml-4 mt-1 space-y-1">
                      {formData.organizingCommittee.map((member: any, idx: number) => (
                        <li key={idx}>• {member.name} - {member.role} ({member.entity})</li>
                      ))}
                    </ul>
                  ) : 'Not specified'}
                </div>
                <p><strong>Associated Partners:</strong> {formData.associatedPartners || 'Not specified'}</p>
                <p><strong>Protocol Support:</strong> {formData.protocolSupportRequired === true ? 'Yes' : formData.protocolSupportRequired === false ? 'No' : 'Not specified'}</p>
                {formData.protocolSupportRequired && formData.protocolSupport?.length > 0 && (
                  <p><strong>Support Types:</strong> {formData.protocolSupport.join(', ')}</p>
                )}
              </div>
            </div>

            {/* 8. Preliminary Program */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  8. Preliminary Program
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(7)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Format:</strong> {formData.programFormat?.length > 0 ? formData.programFormat.join(', ') : 'Not specified'}</p>
                {formData.programFormat?.includes('other') && formData.programFormatOther && (
                  <p><strong>Other Format:</strong> {formData.programFormatOther}</p>
                )}
                <p><strong>Speakers Status:</strong> {formData.speakersStatus || 'Not specified'}</p>
                <p><strong>Side Activities:</strong> {formData.sideActivities?.length > 0 ? formData.sideActivities.join(', ') : 'None'}</p>
                {formData.sideActivities?.includes('other') && formData.sideActivitiesOther && (
                  <p><strong>Other Activity:</strong> {formData.sideActivitiesOther}</p>
                )}
              </div>
            </div>

            {/* 9. Logistics & Infrastructure */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  9. Logistics & Infrastructure
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(8)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Required Equipment:</strong> {formData.requiredEquipment?.length > 0 ? formData.requiredEquipment.join(', ') : 'Not specified'}</p>
                {formData.requiredEquipment?.includes('other') && formData.requiredEquipmentOther && (
                  <p><strong>Other Equipment:</strong> {formData.requiredEquipmentOther}</p>
                )}
                <p><strong>Transport/Accommodation/Catering:</strong> {formData.needsTransportAccommodation === true ? 'Yes' : formData.needsTransportAccommodation === false ? 'No' : 'Not specified'}</p>
                {formData.needsTransportAccommodation && formData.transportAccommodationDetails && (
                  <p><strong>Details:</strong> {formData.transportAccommodationDetails}</p>
                )}
                <p><strong>Other Specific Needs:</strong> {formData.otherSpecificNeeds === true ? 'Yes' : formData.otherSpecificNeeds === false ? 'No' : 'Not specified'}</p>
                {formData.otherSpecificNeeds && formData.otherSpecificNeedsDetails && (
                  <p><strong>Details:</strong> {formData.otherSpecificNeedsDetails}</p>
                )}
              </div>
            </div>

            {/* 10. Communication & Visibility */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  10. Communication & Visibility
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(9)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Communication Objectives:</strong> {formData.communicationObjectives?.length > 0 ? formData.communicationObjectives.join(', ') : 'Not specified'}</p>
                {formData.communicationObjectives?.includes('other') && formData.communicationObjectivesOther && (
                  <p><strong>Other Objective:</strong> {formData.communicationObjectivesOther}</p>
                )}
                <p><strong>Planned Actions:</strong> {formData.plannedActions?.length > 0 ? formData.plannedActions.join(', ') : 'Not specified'}</p>
                {formData.plannedActions?.includes('other') && formData.plannedActionsOther && (
                  <p><strong>Other Action:</strong> {formData.plannedActionsOther}</p>
                )}
                <p><strong>Expected Visibility Level:</strong> {formData.expectedVisibilityLevel || 'Not specified'}</p>
              </div>
            </div>

            {/* 11. Provisional Budget */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  11. Provisional Budget
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(10)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Estimated Budget:</strong> {formData.estimatedBudget || 'Not specified'}</p>
                {formData.agencyEstimate && <p><strong>Agency Estimate:</strong> {formData.agencyEstimate} MAD</p>}
                {formData.cateringEstimate && <p><strong>Catering Estimate:</strong> {formData.cateringEstimate} MAD</p>}
                {formData.transportEstimate && <p><strong>Transport Estimate:</strong> {formData.transportEstimate} MAD</p>}
                {formData.accommodationEstimate && <p><strong>Accommodation Estimate:</strong> {formData.accommodationEstimate} MAD</p>}
                {formData.flightEstimate && <p><strong>Flight Estimate:</strong> {formData.flightEstimate} MAD</p>}
                {formData.overallEstimate && <p><strong>Overall Estimate:</strong> {formData.overallEstimate} MAD</p>}
                <p><strong>Funding Sources:</strong> {formData.fundingSources?.length > 0 ? formData.fundingSources.join(', ') : 'Not specified'}</p>
                {formData.fundingSources?.includes('other') && formData.fundingSourcesOther && (
                  <p><strong>Other Source:</strong> {formData.fundingSourcesOther}</p>
                )}
                {formData.estimatedSponsorship && <p><strong>Estimated Sponsorship:</strong> {formData.estimatedSponsorship} MAD</p>}
                {formData.budgetComments && <p><strong>Comments:</strong> {formData.budgetComments}</p>}
              </div>
            </div>

            {/* 12. Event Location */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  12. Event Location
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(11)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Campus:</strong> {campuses.find((c: any) => c.id === formData.selectedCampusId)?.name || 'Not selected'}</p>
                <p><strong>Venue:</strong> {formData.selectedLocationName || 'Not selected'}</p>
                <p><strong>Venue Type:</strong> {
                  formData.selectedLocationType === 'location' ? 'Room' :
                  formData.selectedLocationType === 'building' ? 'Building' :
                  formData.selectedLocationType === 'openSpace' ? 'Open Space' : 'Not selected'
                }</p>
              </div>
            </div>

            {/* 13. Supporting Documents */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  13. Supporting Documents
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(12)}>Edit</Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Documents Uploaded:</strong> {formData.uploadedDocuments?.length || 0}</p>
                {formData.uploadedDocuments && formData.uploadedDocuments.length > 0 && (
                  <ul className="ml-4 space-y-1">
                    {formData.uploadedDocuments.map((doc: any, idx: number) => (
                      <li key={idx}>• {doc.name}</li>
                    ))}
                  </ul>
                )}
                {formData.eventType === 'scientific' && (!formData.uploadedDocuments || formData.uploadedDocuments.length === 0) && (
                  <p className="text-red-600">⚠️ Documents are required for Scientific & Research events</p>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-green-800 mb-2">✓ Ready to Submit</h4>
              <p className="text-sm text-green-700">
                Please review all sections above. If everything is correct, click "Next" to proceed to the validation section and submit your application.
              </p>
            </div>
          </div>
        )

      case 'validation':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">14. Validation & Follow-up</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This section will be completed by the relevant committee after submission.
                You have already reviewed your application in the previous step.
              </p>
            </div>

            <div>
              <OptionalLabel>Relevant Committee</OptionalLabel>
              <div className="p-4 bg-gray-50 rounded border space-y-2">
                <p className="text-sm font-medium">
                  {formData.relevantCommittee === 'institutional' ? 'Institutional Committee' :
                   formData.relevantCommittee === 'scientific' ? 'Scientific & Research Committee' :
                   'Not selected'}
                </p>
                {formData.relevantCommittee === 'institutional' && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Contact Person:</strong> Mr. Ahmed LAZRAK</p>
                    <p><strong>Email:</strong> ahmed.lazrak@um6p.ma</p>
                    <p className="text-xs mt-2 italic">
                      This committee handles institutional events, ceremonies, partnerships, and strategic initiatives.
                    </p>
                  </div>
                )}
                {formData.relevantCommittee === 'scientific' && (
                  <div className="text-sm text-gray-600 space-y-2">
                    <div>
                      <p><strong>Contact Person:</strong> Mr. Hicham El Gourgue</p>
                      <p><strong>Email:</strong> hicham.gourgue@um6p.ma</p>
                    </div>
                    <div>
                      <p><strong>Contact Person:</strong> Mr. Alami Jones</p>
                      <p><strong>Email:</strong> jones.alami@um6p.ma</p>
                    </div>
                    <p className="text-xs mt-2 italic">
                      This committee handles scientific events, research conferences, academic symposiums, and workshops.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <OptionalLabel>Validation Status</OptionalLabel>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-sm capitalize">{formData.validationStatus || 'Pending'}</p>
              </div>
            </div>

            <div>
              <OptionalLabel>Committee Comments</OptionalLabel>
              <div className="p-3 bg-gray-50 rounded border min-h-[100px]">
                <p className="text-sm text-gray-500">
                  {formData.committeeComments || 'No comments yet'}
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-green-800 mb-2">✓ Application Ready for Submission</h4>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Event:</strong> {formData.eventTitle || 'Not specified'}</p>
                <p><strong>Type:</strong> {formData.eventType === 'institutional' ? 'Institutional' : formData.eventType === 'scientific' ? 'Scientific & Research' : 'Not specified'}</p>
                <p><strong>Committee:</strong> {formData.relevantCommittee === 'institutional' ? 'Institutional Committee' : formData.relevantCommittee === 'scientific' ? 'Scientific & Research Committee' : 'Not specified'}</p>
                <p><strong>Start:</strong> {formData.startDate && formData.startTime ? `${formData.startDate} at ${formData.startTime}` : 'Not specified'}</p>
                <p><strong>End:</strong> {formData.endDate && formData.endTime ? `${formData.endDate} at ${formData.endTime}` : 'Not specified'}</p>
                <p><strong>Expected Participants:</strong> {formData.expectedParticipantCount || 'Not specified'}</p>
                <p><strong>Documents:</strong> {formData.uploadedDocuments?.length || 0} uploaded</p>
              </div>
              <div className="mt-3 pt-3 border-t border-green-300">
                <p className="text-xs text-green-600">
                  Click "Submit Application" below to send your application to the {formData.relevantCommittee === 'institutional' ? 'Institutional' : 'Scientific & Research'} Committee for review.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return <div className="text-center text-gray-500">Section under construction</div>
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="border-b border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-xl">Event Reservation Application</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="text-[10px] sm:text-xs">Step {currentStep + 1} of {FORM_STEPS.length}</span>
              <span className="text-[10px] sm:text-xs">{Math.round(((currentStep + 1) / FORM_STEPS.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div 
                className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / FORM_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-3 sm:p-6 overflow-y-auto flex-1">
          {renderStepContent()}
        </CardContent>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 sm:p-4 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
            size="sm"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          <div className="flex items-center gap-1 sm:gap-2 text-sm text-gray-500">
            {FORM_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep === FORM_STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
              size="sm"
            >
              <span className="hidden sm:inline">Submit Application</span>
              <span className="sm:hidden">Submit</span>
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
              size="sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          )}
        </div>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Confirm Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{errors.submit}</p>
                </div>
              )}
              <p className="text-sm text-gray-600">
                Are you sure you want to submit this event reservation application?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Event:</strong> {formData.eventTitle}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Type:</strong> {formData.eventType === 'institutional' ? 'Institutional' : 'Scientific & Research'}
                </p>
                {formData.startDate && (
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Date:</strong> {formData.startDate}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Once submitted, your application will be reviewed by the relevant committee. You will receive a confirmation email shortly.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm & Submit
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
