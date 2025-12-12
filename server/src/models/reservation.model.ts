/**
 * Reservation Models and DTOs
 * Purpose: Type definitions for UM6P Event Application Form
 * Based on: APPLICATION FORM FOR THE ORGANIZATION OF AN EVENT AT UM6P
 */

// Enums for reservation fields
export enum EventNature {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL'
}

export enum EventType {
  INSTITUTIONAL = 'INSTITUTIONAL',
  SCIENTIFIC_RESEARCH = 'SCIENTIFIC_RESEARCH'
}

export enum RelevantCommittee {
  INSTITUTIONAL = 'INSTITUTIONAL',
  SCIENTIFIC_RESEARCH = 'SCIENTIFIC_RESEARCH'
}

export enum EstimatedDuration {
  HALF_DAY = 'HALF_DAY',
  ONE_DAY = 'ONE_DAY',
  TWO_DAYS = 'TWO_DAYS',
  MORE = 'MORE'
}

export enum ParticipantRange {
  LESS_THAN_300 = '<300',
  BETWEEN_400_500 = '400-500',
  MORE_THAN_500 = '>500'
}

export enum MediaVisibility {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum GeographicalScope {
  INTERNAL = 'INTERNAL',
  NATIONAL = 'NATIONAL',
  INTERNATIONAL = 'INTERNATIONAL'
}

export enum PartnerStatus {
  CONFIRMED = 'CONFIRMED',
  UNDER_DISCUSSION = 'UNDER_DISCUSSION',
  NONE = 'NONE'
}

export enum SpeakerStatus {
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS'
}

export enum BudgetRange {
  LESS_THAN_800K = '<800K',
  BETWEEN_800K_1_5M = '800K-1.5M',
  MORE_THAN_1_5M = '>1.5M'
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

// Main objectives options
export const MAIN_OBJECTIVES = [
  'visibility',
  'project_highlight',
  'partnerships',
  'engagement',
  'other'
] as const

// Secondary objectives options
export const SECONDARY_OBJECTIVES = [
  'media',
  'collaboration',
  'materials'
] as const

// Expected impact options
export const EXPECTED_IMPACT = [
  'visibility',
  'engagement',
  'partnership',
  'academic'
] as const

// Target profiles options
export const TARGET_PROFILES = [
  'institutional',
  'researchers',
  'students',
  'media',
  'partners'
] as const

// Protocol support types
export const PROTOCOL_SUPPORT_TYPES = [
  'presidency',
  'communication',
  'security',
  'logistics'
] as const

// Program format options
export const PROGRAM_FORMAT = [
  'plenary',
  'panels',
  'signature',
  'roundtable',
  'exhibition',
  'other'
] as const

// Side activities options
export const SIDE_ACTIVITIES = [
  'visit',
  'demonstration',
  'networking',
  'training',
  'other'
] as const

// Required spaces options
export const REQUIRED_SPACES = [
  'auditorium',
  'amphitheatre',
  'dome',
  'outdoor'
] as const

// Required equipment options
export const REQUIRED_EQUIPMENT = [
  'audiovisual',
  'mapping',
  'recording',
  'translation',
  'streaming',
  'other'
] as const

// Communication objectives options
export const COMMUNICATION_OBJECTIVES = [
  'institutional_image',
  'press_relations',
  'social_media',
  'other'
] as const

// Planned actions options
export const PLANNED_ACTIONS = [
  'branding',
  'video',
  'photography',
  'press_release',
  'other'
] as const

// Funding sources options
export const FUNDING_SOURCES = [
  'hosting_entity',
  'partners',
  'sponsorship',
  'other'
] as const

// Create Reservation DTO
export interface CreateReservationDTO {
  // 1. Applicant Information
  projectLeaderName: string
  entityDepartment: string
  
  // 2. General Information about the Event
  eventTitle: string
  eventNature: EventNature
  eventType: EventType
  relevantCommittee?: string
  
  // Resource - Event Location
  resourceType: ResourceType
  buildingId?: string
  locationId?: string
  openSpaceId?: string
  proposedVenue?: string
  
  // Timing
  plannedDates: string
  startDate: Date
  endDate: Date
  estimatedDuration: EstimatedDuration
  durationDetails?: string
  
  // 3. Event History
  hasPreviousEdition?: boolean
  previousEditionYear?: string
  numberOfParticipants?: ParticipantRange
  mediaVisibility?: MediaVisibility
  hasVipGuests?: boolean
  vipGuestsDetails?: string
  
  // 4. Objectives
  mainObjectives: string[] // Array of MAIN_OBJECTIVES
  mainObjectivesOther?: string
  secondaryObjectives?: string[] // Array of SECONDARY_OBJECTIVES
  
  // 5. Scope & Expected Impact
  geographicalScope: GeographicalScope
  expectedImpact?: string[] // Array of EXPECTED_IMPACT
  
  // 6. Target Audience
  targetProfiles: string[] // Array of TARGET_PROFILES
  expectedParticipantCount: string
  
  // 7. Governance & Partners
  eventManager: string
  organizingCommittee?: string
  associatedPartners?: PartnerStatus
  protocolSupport?: boolean
  protocolSupportTypes?: string[] // Array of PROTOCOL_SUPPORT_TYPES
  
  // 8. Preliminary Program
  programFormat?: string[] // Array of PROGRAM_FORMAT
  speakersStatus?: SpeakerStatus
  speakersDetails?: string
  sideActivities?: string[] // Array of SIDE_ACTIVITIES
  
  // 9. Logistics & Infrastructure
  requiredSpaces?: string[] // Array of REQUIRED_SPACES
  requiredEquipment?: string[] // Array of REQUIRED_EQUIPMENT
  needsTransport?: boolean
  needsAccommodation?: boolean
  needsCatering?: boolean
  logisticsDetails?: string
  otherSpecificNeeds?: string
  
  // 10. Communication & Visibility
  communicationObjectives?: string[] // Array of COMMUNICATION_OBJECTIVES
  plannedActions?: string[] // Array of PLANNED_ACTIONS
  expectedVisibilityLevel?: GeographicalScope
  
  // 11. Provisional Budget
  estimatedBudget: BudgetRange
  agencyEstimate?: number
  cateringEstimate?: number
  transportEstimate?: number
  accommodationEstimate?: number
  flightEstimate?: number
  overallEstimate?: number
  fundingSources?: string[] // Array of FUNDING_SOURCES
  estimatedSponsorship?: number
  budgetComments?: string
  
  // 12. Validation & Follow-up
  validationCommittee?: RelevantCommittee
  committeeComments?: string
}

// Update Reservation DTO
export interface UpdateReservationDTO extends Partial<CreateReservationDTO> {
  status?: ReservationStatus
  validationStatus?: ValidationStatus
  reviewNotes?: string
  rejectionReason?: string
}

// Reservation Response DTO
export interface ReservationResponseDTO {
  id: string
  userId: string
  status: ReservationStatus
  
  // Applicant Information
  projectLeaderName: string
  entityDepartment: string
  submissionDate: Date
  
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
  startDate: Date
  endDate: Date
  estimatedDuration: EstimatedDuration
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
  reviewedAt?: Date
  reviewNotes?: string
  approvedBy?: string
  approvedAt?: Date
  rejectedBy?: string
  rejectedAt?: Date
  rejectionReason?: string
  
  createdAt: Date
  updatedAt: Date
  
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

// Filter/Query DTO
export interface ReservationQueryDTO {
  userId?: string
  status?: ReservationStatus
  validationStatus?: ValidationStatus
  eventType?: EventType
  eventNature?: EventNature
  startDate?: Date
  endDate?: Date
  resourceType?: ResourceType
  buildingId?: string
  locationId?: string
  openSpaceId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Validation helper
export function validateReservationPermission(userType: string): boolean {
  // Only PERMANENT staff can create reservations
  // Not TEMPORARY or STUDENT
  return userType === 'PERMANENT' || userType === 'ADMIN' || userType === 'SUPER_ADMIN'
}
