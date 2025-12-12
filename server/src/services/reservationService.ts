/**
 * Reservation Service
 * Purpose: Business logic for event reservations
 * Inputs: Reservation data with documents
 * Outputs: Created/updated reservations
 */

import { reservationRepository } from '../repositories/reservationRepository'
import { uploadDocument } from './uploadService'
import type { Reservation } from '@prisma/client'

interface DocumentFile {
  buffer: Buffer
  originalname: string
  mimetype: string
}

interface CreateReservationData {
  userId: string
  projectLeaderName: string
  projectLeaderEmail: string
  projectLeaderPhone?: string
  department?: string
  entity?: string
  eventTitle: string
  eventNature?: string
  eventType: string
  relevantCommittee?: string
  eventDescription?: string
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  estimatedDuration?: string
  hasPreviousEdition?: boolean
  previousEditionYear?: string
  participantCount?: string
  mediaVisibility?: string
  hasVIPGuests?: boolean
  vipGuestsDetails?: string
  mainObjectives?: string[]
  mainObjectivesOther?: string
  secondaryObjectives?: string[]
  geographicalScope?: string
  expectedImpact?: string[]
  targetProfiles?: string[]
  expectedParticipantCount?: string
  eventManagerName?: string
  eventManagerPosition?: string
  eventManagerContact?: string
  organizingCommittee?: Array<{ name: string; role: string; entity: string }>
  associatedPartners?: string
  protocolSupportRequired?: boolean
  protocolSupport?: string[]
  programFormat?: string[]
  programFormatOther?: string
  speakersStatus?: string
  sideActivities?: string[]
  sideActivitiesOther?: string
  requiredEquipment?: string[]
  requiredEquipmentOther?: string
  needsTransportAccommodation?: boolean
  transportAccommodationDetails?: string
  otherSpecificNeeds?: boolean
  otherSpecificNeedsDetails?: string
  communicationObjectives?: string[]
  communicationObjectivesOther?: string
  plannedActions?: string[]
  plannedActionsOther?: string
  expectedVisibilityLevel?: string
  estimatedBudget?: string
  agencyEstimate?: string
  cateringEstimate?: string
  transportEstimate?: string
  accommodationEstimate?: string
  flightEstimate?: string
  overallEstimate?: string
  fundingSources?: string[]
  fundingSourcesOther?: string
  estimatedSponsorship?: string
  budgetComments?: string
  selectedCampusId?: string
  selectedLocationId?: string
  selectedLocationType?: string
  selectedLocationName?: string
}

export class ReservationService {
  /**
   * Create new reservation with document uploads
   * Purpose: Create reservation and upload supporting documents
   * Input: Reservation data and document files
   * Output: Created reservation with document URLs
   */
  async createReservation(
    data: CreateReservationData,
    documents?: DocumentFile[]
  ): Promise<Reservation> {
    // Upload documents to Cloudinary
    let uploadedDocs: Array<{ name: string; url: string; type: string }> = []
    
    console.log('📄 Documents received:', documents?.length || 0)
    
    if (documents && documents.length > 0) {
      try {
        console.log('📤 Starting document uploads...')
        const uploadPromises = documents.map(async (doc) => {
          console.log(`📤 Uploading: ${doc.originalname}`)
          const result = await uploadDocument(
            doc.buffer,
            'reservations',
            doc.originalname
          )
          console.log(`✅ Uploaded: ${doc.originalname} -> ${result.url}`)
          return {
            name: doc.originalname,
            url: result.url,
            type: doc.mimetype,
          }
        })
        
        uploadedDocs = await Promise.all(uploadPromises)
        console.log('✅ All documents uploaded successfully:', uploadedDocs.length)
      } catch (error) {
        console.error('❌ Error uploading documents:', error)
        throw new Error(`Failed to upload documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Prepare data for database
    const reservationData = {
      user: { connect: { id: data.userId } },
      projectLeaderName: data.projectLeaderName,
      projectLeaderEmail: data.projectLeaderEmail,
      projectLeaderPhone: data.projectLeaderPhone,
      department: data.department,
      entity: data.entity,
      eventTitle: data.eventTitle,
      eventNature: data.eventNature,
      eventType: data.eventType,
      relevantCommittee: data.relevantCommittee,
      eventDescription: data.eventDescription,
      startDate: data.startDate,
      startTime: data.startTime,
      endDate: data.endDate,
      endTime: data.endTime,
      estimatedDuration: data.estimatedDuration,
      hasPreviousEdition: data.hasPreviousEdition,
      previousEditionYear: data.previousEditionYear,
      participantCount: data.participantCount,
      mediaVisibility: data.mediaVisibility,
      hasVIPGuests: data.hasVIPGuests,
      vipGuestsDetails: data.vipGuestsDetails,
      mainObjectives: data.mainObjectives ? JSON.stringify(data.mainObjectives) : null,
      mainObjectivesOther: data.mainObjectivesOther,
      secondaryObjectives: data.secondaryObjectives ? JSON.stringify(data.secondaryObjectives) : null,
      geographicalScope: data.geographicalScope,
      expectedImpact: data.expectedImpact ? JSON.stringify(data.expectedImpact) : null,
      targetProfiles: data.targetProfiles ? JSON.stringify(data.targetProfiles) : null,
      expectedParticipantCount: data.expectedParticipantCount,
      eventManagerName: data.eventManagerName,
      eventManagerPosition: data.eventManagerPosition,
      eventManagerContact: data.eventManagerContact,
      organizingCommittee: data.organizingCommittee ? JSON.stringify(data.organizingCommittee) : null,
      associatedPartners: data.associatedPartners,
      protocolSupportRequired: data.protocolSupportRequired,
      protocolSupport: data.protocolSupport ? JSON.stringify(data.protocolSupport) : null,
      programFormat: data.programFormat ? JSON.stringify(data.programFormat) : null,
      programFormatOther: data.programFormatOther,
      speakersStatus: data.speakersStatus,
      sideActivities: data.sideActivities ? JSON.stringify(data.sideActivities) : null,
      sideActivitiesOther: data.sideActivitiesOther,
      requiredEquipment: data.requiredEquipment ? JSON.stringify(data.requiredEquipment) : null,
      requiredEquipmentOther: data.requiredEquipmentOther,
      needsTransportAccommodation: data.needsTransportAccommodation,
      transportAccommodationDetails: data.transportAccommodationDetails,
      otherSpecificNeeds: data.otherSpecificNeeds,
      otherSpecificNeedsDetails: data.otherSpecificNeedsDetails,
      communicationObjectives: data.communicationObjectives ? JSON.stringify(data.communicationObjectives) : null,
      communicationObjectivesOther: data.communicationObjectivesOther,
      plannedActions: data.plannedActions ? JSON.stringify(data.plannedActions) : null,
      plannedActionsOther: data.plannedActionsOther,
      expectedVisibilityLevel: data.expectedVisibilityLevel,
      estimatedBudget: data.estimatedBudget,
      agencyEstimate: data.agencyEstimate,
      cateringEstimate: data.cateringEstimate,
      transportEstimate: data.transportEstimate,
      accommodationEstimate: data.accommodationEstimate,
      flightEstimate: data.flightEstimate,
      overallEstimate: data.overallEstimate,
      fundingSources: data.fundingSources ? JSON.stringify(data.fundingSources) : null,
      fundingSourcesOther: data.fundingSourcesOther,
      estimatedSponsorship: data.estimatedSponsorship,
      budgetComments: data.budgetComments,
      selectedLocationId: data.selectedLocationId,
      selectedLocationType: data.selectedLocationType,
      selectedLocationName: data.selectedLocationName,
      documents: uploadedDocs.length > 0 ? JSON.stringify(uploadedDocs) : null,
      campus: data.selectedCampusId ? { connect: { id: data.selectedCampusId } } : undefined,
    }

    console.log('💾 Saving reservation with documents:', uploadedDocs.length > 0 ? JSON.stringify(uploadedDocs) : 'No documents')
    
    const savedReservation = await reservationRepository.create(reservationData)
    console.log('✅ Reservation saved with ID:', savedReservation.id)
    
    return savedReservation
  }

  /**
   * Get reservation by ID
   */
  async getReservationById(id: string): Promise<Reservation | null> {
    return reservationRepository.findById(id)
  }

  /**
   * Get all reservations with pagination
   */
  async getAllReservations(params: {
    page?: number
    limit?: number
    status?: string
    userId?: string
    campusId?: string
  }) {
    const { page = 1, limit = 10, status, userId, campusId } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (userId) where.userId = userId
    if (campusId) where.selectedCampusId = campusId

    const { reservations, total } = await reservationRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    })

    return {
      data: reservations,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    }
  }

  /**
   * Update reservation status
   */
  async updateReservationStatus(
    id: string,
    status: string,
    userId: string,
    comments?: string
  ): Promise<Reservation> {
    const updateData: any = {
      validationStatus: status,
      committeeComments: comments,
    }

    if (status === 'APPROVED') {
      updateData.approvedBy = userId
      updateData.approvedAt = new Date()
    } else if (status === 'REJECTED') {
      updateData.rejectedBy = userId
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = comments
    }

    return reservationRepository.update(id, updateData)
  }

  /**
   * Approve a reservation
   */
  async approveReservation(
    id: string,
    data: { committeeComments: string; approvedBy: string }
  ): Promise<Reservation> {
    // Check if reservation exists
    const reservation = await reservationRepository.findById(id)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    // Check if reservation is pending
    if (reservation.status !== 'PENDING') {
      throw new Error('Only pending reservations can be approved')
    }

    // Update reservation
    const updateData = {
      status: 'APPROVED',
      validationStatus: 'approved',
      committeeComments: data.committeeComments,
      approvedBy: data.approvedBy,
      approvedAt: new Date(),
      reviewedBy: data.approvedBy,
      reviewedAt: new Date(),
    }

    return reservationRepository.update(id, updateData)
  }

  /**
   * Reject a reservation
}

// Prepare data for database
const reservationData = {
  user: { connect: { id: data.userId } },
  projectLeaderName: data.projectLeaderName,
  projectLeaderEmail: data.projectLeaderEmail,
  projectLeaderPhone: data.projectLeaderPhone,
  department: data.department,
  entity: data.entity,
  eventTitle: data.eventTitle,
  eventType: data.eventType,
  relevantCommittee: data.relevantCommittee,
  eventDescription: data.eventDescription,
  startDate: data.startDate,
  startTime: data.startTime,
  endDate: data.endDate,
  endTime: data.endTime,
  estimatedDuration: data.estimatedDuration,
  hasPreviousEdition: data.hasPreviousEdition,
  previousEditionYear: data.previousEditionYear,
  participantCount: data.participantCount,
  mediaVisibility: data.mediaVisibility,
  hasVIPGuests: data.hasVIPGuests,
  vipGuestsDetails: data.vipGuestsDetails,
  mainObjectives: data.mainObjectives ? JSON.stringify(data.mainObjectives) : null,
  mainObjectivesOther: data.mainObjectivesOther,
  secondaryObjectives: data.secondaryObjectives ? JSON.stringify(data.secondaryObjectives) : null,
  geographicalScope: data.geographicalScope,
  expectedImpact: data.expectedImpact ? JSON.stringify(data.expectedImpact) : null,
  targetProfiles: data.targetProfiles ? JSON.stringify(data.targetProfiles) : null,
  expectedParticipantCount: data.expectedParticipantCount,
  eventManagerName: data.eventManagerName,
  eventManagerPosition: data.eventManagerPosition,
  eventManagerContact: data.eventManagerContact,
  organizingCommittee: data.organizingCommittee ? JSON.stringify(data.organizingCommittee) : null,
  associatedPartners: data.associatedPartners,
  protocolSupportRequired: data.protocolSupportRequired,
  protocolSupport: data.protocolSupport ? JSON.stringify(data.protocolSupport) : null,
  programFormat: data.programFormat ? JSON.stringify(data.programFormat) : null,
  programFormatOther: data.programFormatOther,
  speakersStatus: data.speakersStatus,
  sideActivities: data.sideActivities ? JSON.stringify(data.sideActivities) : null,
  sideActivitiesOther: data.sideActivitiesOther,
  requiredEquipment: data.requiredEquipment ? JSON.stringify(data.requiredEquipment) : null,
  requiredEquipmentOther: data.requiredEquipmentOther,
  needsTransportAccommodation: data.needsTransportAccommodation,
  transportAccommodationDetails: data.transportAccommodationDetails,
  otherSpecificNeeds: data.otherSpecificNeeds,
  otherSpecificNeedsDetails: data.otherSpecificNeedsDetails,
  communicationObjectives: data.communicationObjectives ? JSON.stringify(data.communicationObjectives) : null,
  communicationObjectivesOther: data.communicationObjectivesOther,
  plannedActions: data.plannedActions ? JSON.stringify(data.plannedActions) : null,
  plannedActionsOther: data.plannedActionsOther,
  expectedVisibilityLevel: data.expectedVisibilityLevel,
  estimatedBudget: data.estimatedBudget,
  agencyEstimate: data.agencyEstimate,
  cateringEstimate: data.cateringEstimate,
  transportEstimate: data.transportEstimate,
  accommodationEstimate: data.accommodationEstimate,
  flightEstimate: data.flightEstimate,
  overallEstimate: data.overallEstimate,
  fundingSources: data.fundingSources ? JSON.stringify(data.fundingSources) : null,
  fundingSourcesOther: data.fundingSourcesOther,
  estimatedSponsorship: data.estimatedSponsorship,
  budgetComments: data.budgetComments,
  selectedLocationId: data.selectedLocationId,
  selectedLocationType: data.selectedLocationType,
  selectedLocationName: data.selectedLocationName,
  documents: uploadedDocs.length > 0 ? JSON.stringify(uploadedDocs) : null,
  campus: data.selectedCampusId ? { connect: { id: data.selectedCampusId } } : undefined,
}

return reservationRepository.create(reservationData)
}
  if (!data.forceApprove) {
    const conflictCheck = await this.checkEventConflicts(id)
    if (conflictCheck.hasConflict) {
      const error: any = new Error('Event conflict detected')
      error.code = 'EVENT_CONFLICT'
      error.conflicts = conflictCheck.conflicts
      error.suggestions = conflictCheck.suggestions
      throw error
    }
  }

  // Update reservation
  const updateData = {
    status: 'APPROVED',
    validationStatus: 'approved',
    committeeComments: data.committeeComments,
    approvedBy: data.approvedBy,
    approvedAt: new Date(),
    reviewedBy: data.approvedBy,
    reviewedAt: new Date(),
  }

  return reservationRepository.update(id, updateData)
}

/**
 * Reject a reservation
 */
async rejectReservation(
  id: string,
  data: { committeeComments: string; rejectionReason: string; rejectedBy: string }
): Promise<Reservation> {
  const reservation = await reservationRepository.findById(id)
  if (!reservation) {
    throw new Error('Reservation not found')
  }
  if (reservation.status !== 'PENDING') {
    throw new Error('Only pending reservations can be rejected')
  }
  const updateData = {
    status: 'REJECTED',
    validationStatus: 'rejected',
    committeeComments: data.committeeComments,
    rejectionReason: data.rejectionReason,
    rejectedBy: data.rejectedBy,
    rejectedAt: new Date(),
    reviewedBy: data.rejectedBy,
    reviewedAt: new Date(),
  }
  return reservationRepository.update(id, updateData)
}

async reviewReservation(
  id: string,
  data: { reviewNotes: string; reviewedBy: string }
): Promise<Reservation> {
  const reservation = await reservationRepository.findById(id)
  if (!reservation) {
    throw new Error('Reservation not found')
  }
  if (reservation.status !== 'PENDING') {
    throw new Error('Only pending reservations can be reviewed')
  }
  const updateData = {
    status: 'UNDER_REVIEW',
    validationStatus: 'under_review',
    reviewNotes: data.reviewNotes,
    reviewedBy: data.reviewedBy,
    reviewedAt: new Date(),
  }
  return reservationRepository.update(id, updateData)
}

/**
 * Cancel reservation
 * Purpose: Allow users to cancel their own pending reservations
 * Input: Reservation ID
 * Output: Updated reservation with CANCELLED status
 */
async cancelReservation(id: string): Promise<Reservation> {
  const updateData = {
    status: 'CANCELLED',
    validationStatus: 'cancelled',
  }
  return reservationRepository.update(id, updateData)
}
}

export const reservationService = new ReservationService()
