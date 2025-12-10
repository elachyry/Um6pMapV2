/**
 * Emergency Contact Controller
 * Purpose: Handle HTTP requests for emergency contacts
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import * as emergencyContactService from '../services/emergencyContactService'

/**
 * Get all emergency contacts
 * Purpose: Fetch paginated list of emergency contacts
 */
export const getAllEmergencyContacts = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page = '1', limit = '12', search = '', campusId = '' } = request.query as any
    
    const result = await emergencyContactService.getAll(
      parseInt(page),
      parseInt(limit),
      search,
      campusId
    )
    
    reply.send({
      success: true,
      data: result.contacts,
      pagination: {
        page: result.page,
        limit: parseInt(limit),
        total: result.total,
        totalPages: result.totalPages
      }
    })
  } catch (error: any) {
    reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch emergency contacts'
    })
  }
}

/**
 * Get emergency contact by ID
 * Purpose: Fetch single emergency contact
 */
export const getEmergencyContactById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    const contact = await emergencyContactService.getById(id)
    
    reply.send({
      success: true,
      data: contact
    })
  } catch (error: any) {
    reply.status(404).send({
      success: false,
      error: error.message || 'Emergency contact not found'
    })
  }
}

/**
 * Create emergency contact
 * Purpose: Add new emergency contact
 */
export const createEmergencyContact = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = request.body
    const contact = await emergencyContactService.create(data)
    
    reply.status(201).send({
      success: true,
      data: contact
    })
  } catch (error: any) {
    reply.status(400).send({
      success: false,
      error: error.message || 'Failed to create emergency contact'
    })
  }
}

/**
 * Update emergency contact
 * Purpose: Modify existing emergency contact
 */
export const updateEmergencyContact = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    const data = request.body
    const contact = await emergencyContactService.update(id, data)
    
    reply.send({
      success: true,
      data: contact
    })
  } catch (error: any) {
    reply.status(400).send({
      success: false,
      error: error.message || 'Failed to update emergency contact'
    })
  }
}

/**
 * Delete emergency contact
 * Purpose: Remove emergency contact
 */
export const deleteEmergencyContact = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    await emergencyContactService.remove(id)
    
    reply.send({
      success: true,
      message: 'Emergency contact deleted successfully'
    })
  } catch (error: any) {
    reply.status(400).send({
      success: false,
      error: error.message || 'Failed to delete emergency contact'
    })
  }
}

/**
 * Toggle active status
 * Purpose: Enable/disable emergency contact
 */
export const toggleEmergencyContactActive = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    const contact = await emergencyContactService.toggleActive(id)
    
    reply.send({
      success: true,
      data: contact
    })
  } catch (error: any) {
    reply.status(400).send({
      success: false,
      error: error.message || 'Failed to toggle emergency contact status'
    })
  }
}
