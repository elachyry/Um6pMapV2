/**
 * Reservation Routes
 * Purpose: Define API endpoints for event reservations
 * Inputs: HTTP requests
 * Outputs: Route handlers
 */

import { FastifyInstance } from 'fastify'
import { reservationService } from '../services/reservationService'
import { authenticate } from '../middleware/auth'

export default async function reservationRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/reservations
   * Create new reservation with document uploads
   * Auth: Required
   * Body: Multipart form data with documents
   */
  fastify.post('/', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      // Get userId from JWT token (it's stored as 'userId' not 'id')
      const userId = (request.user as any)?.userId || (request.user as any)?.id
      
      if (!userId) {
        request.log.error('No user ID found in request')
        return reply.status(401).send({
          success: false,
          error: 'User not authenticated'
        })
      }
      
      request.log.info({ userId }, 'Processing reservation for user')

      // Check if request is multipart
      if (!request.isMultipart()) {
        return reply.status(400).send({
          success: false,
          error: 'Request must be multipart/form-data'
        })
      }

      // Parse multipart data
      const parts = request.parts()
      const formData: any = {}
      const documents: Array<{ buffer: Buffer; originalname: string; mimetype: string }> = []

      for await (const part of parts) {
        if (part.type === 'file') {
          // Handle file upload
          if (part.fieldname === 'documents') {
            const buffer = await part.toBuffer()
            request.log.info(`📎 Received document: ${part.filename} (${part.mimetype}, ${buffer.length} bytes)`)
            documents.push({
              buffer,
              originalname: part.filename,
              mimetype: part.mimetype
            })
          }
        } else {
          // Handle form field
          formData[part.fieldname] = part.value
        }
      }

      request.log.info(`📄 Total documents received: ${documents.length}`)

      // Parse JSON fields
      const parseJsonField = (field: any) => {
        if (!field) return undefined
        if (typeof field === 'string') {
          try {
            return JSON.parse(field)
          } catch {
            return undefined
          }
        }
        return field
      }

      // Prepare reservation data
      const reservationData = {
        userId,
        projectLeaderName: formData.projectLeaderName,
        projectLeaderEmail: (request.user as any)?.email || formData.projectLeaderEmail,
        projectLeaderPhone: formData.projectLeaderPhone,
        department: formData.department,
        entity: formData.entity,
        eventTitle: formData.eventTitle,
        eventNature: formData.eventNature,
        eventType: formData.eventType,
        relevantCommittee: formData.relevantCommittee,
        eventDescription: formData.eventDescription,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        estimatedDuration: formData.estimatedDuration,
        hasPreviousEdition: formData.hasPreviousEdition === 'true',
        previousEditionYear: formData.previousEditionYear,
        participantCount: formData.participantCount,
        mediaVisibility: formData.mediaVisibility,
        hasVIPGuests: formData.hasVIPGuests === 'true',
        vipGuestsDetails: formData.vipGuestsDetails,
        mainObjectives: parseJsonField(formData.mainObjectives),
        mainObjectivesOther: formData.mainObjectivesOther,
        secondaryObjectives: parseJsonField(formData.secondaryObjectives),
        geographicalScope: formData.geographicalScope,
        expectedImpact: parseJsonField(formData.expectedImpact),
        targetProfiles: parseJsonField(formData.targetProfiles),
        expectedParticipantCount: formData.expectedParticipantCount,
        eventManagerName: formData.eventManagerName,
        eventManagerPosition: formData.eventManagerPosition,
        eventManagerContact: formData.eventManagerContact,
        organizingCommittee: parseJsonField(formData.organizingCommittee),
        associatedPartners: formData.associatedPartners,
        protocolSupportRequired: formData.protocolSupportRequired === 'true',
        protocolSupport: parseJsonField(formData.protocolSupport),
        programFormat: parseJsonField(formData.programFormat),
        programFormatOther: formData.programFormatOther,
        speakersStatus: formData.speakersStatus,
        sideActivities: parseJsonField(formData.sideActivities),
        sideActivitiesOther: formData.sideActivitiesOther,
        requiredEquipment: parseJsonField(formData.requiredEquipment),
        requiredEquipmentOther: formData.requiredEquipmentOther,
        needsTransportAccommodation: formData.needsTransportAccommodation === 'true',
        transportAccommodationDetails: formData.transportAccommodationDetails,
        otherSpecificNeeds: formData.otherSpecificNeeds === 'true',
        otherSpecificNeedsDetails: formData.otherSpecificNeedsDetails,
        communicationObjectives: parseJsonField(formData.communicationObjectives),
        communicationObjectivesOther: formData.communicationObjectivesOther,
        plannedActions: parseJsonField(formData.plannedActions),
        plannedActionsOther: formData.plannedActionsOther,
        expectedVisibilityLevel: formData.expectedVisibilityLevel,
        estimatedBudget: formData.estimatedBudget,
        agencyEstimate: formData.agencyEstimate,
        cateringEstimate: formData.cateringEstimate,
        transportEstimate: formData.transportEstimate,
        accommodationEstimate: formData.accommodationEstimate,
        flightEstimate: formData.flightEstimate,
        overallEstimate: formData.overallEstimate,
        fundingSources: parseJsonField(formData.fundingSources),
        fundingSourcesOther: formData.fundingSourcesOther,
        estimatedSponsorship: formData.estimatedSponsorship,
        budgetComments: formData.budgetComments,
        selectedCampusId: formData.selectedCampusId,
        selectedLocationId: formData.selectedLocationId,
        selectedLocationType: formData.selectedLocationType,
        selectedLocationName: formData.selectedLocationName,
      }

      // Create reservation with documents
      const reservation = await reservationService.createReservation(
        reservationData,
        documents
      )

      return reply.status(201).send({
        success: true,
        data: reservation,
        message: 'Reservation created successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create reservation'
      })
    }
  })

  /**
   * GET /api/reservations
   * Get all reservations with pagination
   * Auth: Required
   */
  fastify.get('/', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { page, limit, status, userId, campusId } = request.query as any

      const result = await reservationService.getAllReservations({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        status,
        userId,
        campusId,
      })

      return reply.send({
        success: true,
        ...result
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch reservations'
      })
    }
  })

  /**
   * GET /api/reservations/:id
   * Get reservation by ID
   * Auth: Required
   */
  fastify.get('/:id', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const reservation = await reservationService.getReservationById(id)

      if (!reservation) {
        return reply.status(404).send({
          success: false,
          error: 'Reservation not found'
        })
      }

      return reply.send({
        success: true,
        data: reservation
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch reservation'
      })
    }
  })

  /**
   * GET /api/reservations/:id/pdf
   * Generate PDF document for reservation
   * Auth: Required
   * Params: id (reservation ID)
   */
  fastify.get('/:id/pdf', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      request.log.info({ reservationId: id }, 'Generating PDF for reservation')
      
      // Get reservation with all relations
      const reservation = await reservationService.getReservationById(id)
      
      if (!reservation) {
        request.log.warn({ reservationId: id }, 'Reservation not found')
        return reply.status(404).send({
          success: false,
          error: 'Reservation not found'
        })
      }

      request.log.info({ reservationId: id, status: reservation.status }, 'Reservation found')

      // Check if reservation is approved or rejected (PDF only available after decision)
      if (reservation.status === 'PENDING') {
        request.log.warn({ reservationId: id }, 'PDF generation attempted for pending reservation')
        return reply.status(400).send({
          success: false,
          error: 'PDF generation is only available for approved or rejected reservations'
        })
      }

      // Import PDF service
      request.log.info('Importing PDF service')
      const { pdfService } = await import('../services/pdfService')
      
      // Generate PDF
      request.log.info('Generating PDF')
      const pdfBuffer = await pdfService.generateReservationPDF(reservation as any)
      request.log.info({ bufferSize: pdfBuffer.length }, 'PDF generated successfully')

      // Set headers for PDF download
      reply.header('Content-Type', 'application/pdf')
      reply.header('Content-Disposition', `attachment; filename="reservation-${id}.pdf"`)
      reply.header('Content-Length', pdfBuffer.length)

      return reply.send(pdfBuffer)
    } catch (error: any) {
      request.log.error({ error: error.message, stack: error.stack }, 'Failed to generate PDF')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to generate PDF'
      })
    }
  })

  // Get blocked dates for a location
  fastify.get('/blocked-dates', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { locationId, locationType } = request.query as { 
        locationId: string
        locationType: string
      }
      
      request.log.info({ locationId, locationType }, 'Getting blocked dates for location')
      
      if (!locationId || !locationType) {
        return reply.status(400).send({
          success: false,
          error: 'Location ID and type are required'
        })
      }
      
      const blockedDates = await reservationService.getBlockedDatesForLocation(locationId, locationType)
      
      return reply.send({
        success: true,
        data: blockedDates
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to get blocked dates')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get blocked dates'
      })
    }
  })

  // Check for event conflicts
  fastify.get('/:id/check-conflicts', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      
      request.log.info({ reservationId: id }, 'Checking event conflicts')
      
      const conflictCheck = await reservationService.checkEventConflicts(id)
      
      return reply.send({
        success: true,
        data: conflictCheck
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to check conflicts')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to check conflicts'
      })
    }
  })

  // Approve reservation
  fastify.post('/:id/approve', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { committeeComments, forceApprove } = request.body as { 
        committeeComments: string
        forceApprove?: boolean
      }
      
      request.log.info({ reservationId: id, forceApprove }, 'Approving reservation')
      
      if (!committeeComments || !committeeComments.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Committee comments are required'
        })
      }
      
      const user = request.user as any
      const approvedByName = user.name || user.email || 'Unknown'
      
      const reservation = await reservationService.approveReservation(id, {
        committeeComments,
        approvedBy: approvedByName,
        forceApprove
      })
      
      return reply.send({
        success: true,
        data: reservation
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to approve reservation')
      
      // Handle conflict error specially
      if (error.code === 'EVENT_CONFLICT') {
        return reply.status(409).send({
          success: false,
          error: error.message,
          code: 'EVENT_CONFLICT',
          conflicts: error.conflicts,
          suggestions: error.suggestions
        })
      }
      
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to approve reservation'
      })
    }
  })

  // Reject reservation
  fastify.post('/:id/reject', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { committeeComments, rejectionReason } = request.body as { 
        committeeComments: string
        rejectionReason: string 
      }
      
      request.log.info({ reservationId: id }, 'Rejecting reservation')
      
      if (!committeeComments || !committeeComments.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Committee comments are required'
        })
      }
      
      if (!rejectionReason || !rejectionReason.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Rejection reason is required'
        })
      }
      
      const user = request.user as any
      const rejectedByName = user.name || user.email || 'Unknown'
      
      const reservation = await reservationService.rejectReservation(id, {
        committeeComments,
        rejectionReason,
        rejectedBy: rejectedByName
      })
      
      return reply.send({
        success: true,
        data: reservation
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to reject reservation')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to reject reservation'
      })
    }
  })

  // Review reservation
  fastify.post('/:id/review', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { reviewNotes } = request.body as { reviewNotes: string }
      
      request.log.info({ reservationId: id }, 'Reviewing reservation')
      
      if (!reviewNotes || !reviewNotes.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Review notes are required'
        })
      }
      
      const user = request.user as any
      const reviewedByName = user.name || user.email || 'Unknown'
      
      const reservation = await reservationService.reviewReservation(id, {
        reviewNotes,
        reviewedBy: reviewedByName
      })
      
      return reply.send({
        success: true,
        data: reservation
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to review reservation')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to review reservation'
      })
    }
  })

  // Cancel reservation (user can cancel their own pending reservation)
  fastify.post('/:id/cancel', {
    preHandler: authenticate as any,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any)?.id
      
      request.log.info({ reservationId: id, userId }, 'Cancelling reservation')
      
      // Get the reservation first to check ownership and status
      const reservation = await reservationService.getReservationById(id)
      
      if (!reservation) {
        return reply.status(404).send({
          success: false,
          error: 'Reservation not found'
        })
      }
      
      // Check if user owns this reservation
      if (reservation.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'You can only cancel your own reservations'
        })
      }
      
      // Check if reservation is in PENDING status
      if (reservation.status !== 'PENDING') {
        return reply.status(400).send({
          success: false,
          error: 'Only pending reservations can be cancelled'
        })
      }
      
      // Update status to CANCELLED
      const updatedReservation = await reservationService.cancelReservation(id)
      
      return reply.send({
        success: true,
        data: updatedReservation,
        message: 'Reservation cancelled successfully'
      })
    } catch (error: any) {
      request.log.error({ error: error.message }, 'Failed to cancel reservation')
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to cancel reservation'
      })
    }
  })
}
