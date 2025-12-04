/**
 * Upload Routes
 * Purpose: Handle file upload endpoints for images and documents
 */

import { FastifyInstance } from 'fastify'
import * as uploadController from '../controllers/uploadController'
import { authenticate } from '../middleware/auth'

export default async function uploadRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', authenticate)

  // Upload building image
  fastify.post('/buildings/:buildingId/images', uploadController.uploadBuildingImage)

  // Upload building document
  fastify.post('/buildings/:buildingId/documents', uploadController.uploadBuildingDocument)

  // Delete building image
  fastify.delete('/buildings/:buildingId/images/:imageId', uploadController.deleteBuildingImage)

  // Delete building document
  fastify.delete('/buildings/:buildingId/documents/:documentId', uploadController.deleteBuildingDocument)

  // Reorder building images
  fastify.put('/buildings/:buildingId/images/reorder', uploadController.reorderBuildingImages)

  // Reorder documents
  fastify.put('/buildings/:buildingId/documents/reorder', uploadController.reorderBuildingDocuments)
  
  // Get campus 3D models
  fastify.get('/campuses/:campusId/models', uploadController.getCampusModels)
  
  // Upload campus 3D model
  fastify.post('/campuses/:campusId/models', uploadController.uploadCampusModel)
  
  // Delete campus model
  fastify.delete('/campuses/:campusId/models/:modelId', uploadController.deleteCampusModel)
  
  // Update campus model
  fastify.put('/campuses/:campusId/models/:modelId', uploadController.updateCampusModel)
}
