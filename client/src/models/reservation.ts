/**
 * Reservation Models
 * Purpose: Client-side type definitions for reservations
 */

export enum EventNature {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL'
}

export enum EventType {
  INSTITUTIONAL = 'INSTITUTIONAL',
  SCIENTIFIC_RESEARCH = 'SCIENTIFIC_RESEARCH'
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum ValidationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REJECTED = 'REJECTED'
}

export enum ResourceType {
  BUILDING = 'building',
  LOCATION = 'location',
  OPEN_SPACE = 'openSpace'
}

export interface Reservation {
  id: string
  userId: string
  status: ReservationStatus
  
  // Applicant Information
  projectLeaderName: string
  entityDepartment: string
  submissionDate: string
  
  // Event Information
  eventTitle: string
  eventNature: EventNature
  eventType: EventType
  relevantCommittee?: string
  
  // Location
  resourceType: ResourceType
  buildingId?: string
  locationId?: string
  openSpaceId?: string
  proposedVenue?: string
  
  // Timing
  plannedDates: string
  startDate: string
  endDate: string
  estimatedDuration: string
  durationDetails?: string
  
  // Event History
  hasPreviousEdition: boolean
  previousEditionYear?: string
  numberOfParticipants?: string
  mediaVisibility?: string
  hasVipGuests: boolean
  vipGuestsDetails?: string
  
  // Objectives
  mainObjectives: string
  mainObjectivesOther?: string
  secondaryObjectives?: string
  
  // Scope & Impact
  geographicalScope: string
  expectedImpact?: string
  
  // Target Audience
  targetProfiles: string
  expectedParticipantCount: string
  
  // Governance
  eventManager: string
  organizingCommittee?: string
  associatedPartners?: string
  protocolSupport: boolean
  protocolSupportTypes?: string
  
  // Program
  programFormat?: string
  speakersStatus?: string
  speakersDetails?: string
  sideActivities?: string
  
  // Logistics
  requiredSpaces?: string
  requiredEquipment?: string
  needsTransport: boolean
  needsAccommodation: boolean
  needsCatering: boolean
  logisticsDetails?: string
  otherSpecificNeeds?: string
  
  // Communication
  communicationObjectives?: string
  plannedActions?: string
  expectedVisibilityLevel?: string
  
  // Budget
  estimatedBudget: string
  agencyEstimate?: number
  cateringEstimate?: number
  transportEstimate?: number
  accommodationEstimate?: number
  flightEstimate?: number
  overallEstimate?: number
  fundingSources?: string
  estimatedSponsorship?: number
  budgetComments?: string
  
  // Validation
  validationCommittee?: string
  validationStatus: ValidationStatus
  committeeComments?: string
  
  // Approval workflow
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  
  createdAt: string
  updatedAt: string
  
  // Relations
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    department?: string
  }
  building?: {
    id: string
    name: string
  }
  location?: {
    id: string
    name: string
  }
  openSpace?: {
    id: string
    name: string
  }
}

export interface ReservablePlace {
  id: string
  name: string
  type: 'building' | 'location' | 'openSpace'
  capacity?: number
  isReservable: boolean
  campus?: string
  campusId?: string
  description?: string
  facilities?: string[]
  imageUrl?: string
}

export interface CreateReservationInput {
  projectLeaderName: string
  entityDepartment: string
  eventTitle: string
  eventNature: EventNature
  eventType: EventType
  relevantCommittee?: string
  resourceType: ResourceType
  buildingId?: string
  locationId?: string
  openSpaceId?: string
  proposedVenue?: string
  plannedDates: string
  startDate: Date
  endDate: Date
  estimatedDuration: string
  durationDetails?: string
  hasPreviousEdition?: boolean
  previousEditionYear?: string
  numberOfParticipants?: string
  mediaVisibility?: string
  hasVipGuests?: boolean
  vipGuestsDetails?: string
  mainObjectives: string[]
  mainObjectivesOther?: string
  secondaryObjectives?: string[]
  geographicalScope: string
  expectedImpact?: string[]
  targetProfiles: string[]
  expectedParticipantCount: string
  eventManager: string
  organizingCommittee?: string
  associatedPartners?: string
  protocolSupport?: boolean
  protocolSupportTypes?: string[]
  programFormat?: string[]
  speakersStatus?: string
  speakersDetails?: string
  sideActivities?: string[]
  requiredSpaces?: string[]
  requiredEquipment?: string[]
  needsTransport?: boolean
  needsAccommodation?: boolean
  needsCatering?: boolean
  logisticsDetails?: string
  otherSpecificNeeds?: string
  communicationObjectives?: string[]
  plannedActions?: string[]
  expectedVisibilityLevel?: string
  estimatedBudget: string
  agencyEstimate?: number
  cateringEstimate?: number
  transportEstimate?: number
  accommodationEstimate?: number
  flightEstimate?: number
  overallEstimate?: number
  fundingSources?: string[]
  estimatedSponsorship?: number
  budgetComments?: string
  validationCommittee?: string
  committeeComments?: string
}
