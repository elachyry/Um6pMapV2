/**
 * Emergency Contact Routes
 * Purpose: Define API endpoints for emergency contacts
 */

import { FastifyInstance } from 'fastify'
import * as emergencyContactController from '../controllers/emergencyContactController'

export default async function emergencyContactRoutes(fastify: FastifyInstance) {
  // Get all emergency contacts
  fastify.get('/', emergencyContactController.getAllEmergencyContacts)
  
  // Get emergency contact by ID
  fastify.get('/:id', emergencyContactController.getEmergencyContactById)
  
  // Create emergency contact
  fastify.post('/', emergencyContactController.createEmergencyContact)
  
  // Update emergency contact
  fastify.put('/:id', emergencyContactController.updateEmergencyContact)
  
  // Delete emergency contact
  fastify.delete('/:id', emergencyContactController.deleteEmergencyContact)
  
  // Toggle active status
  fastify.put('/:id/toggle-active', emergencyContactController.toggleEmergencyContactActive)
}
