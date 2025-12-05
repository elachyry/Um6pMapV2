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
  
  // Upload location image
  fastify.post('/locations/:locationId/images', uploadController.uploadLocationImage)

  // Upload location document
  fastify.post('/locations/:locationId/documents', uploadController.uploadLocationDocument)

  // Reorder location images
  fastify.put('/locations/:locationId/images/reorder', uploadController.reorderLocationImages)

  // Reorder location documents
  fastify.put('/locations/:locationId/documents/reorder', uploadController.reorderLocationDocuments)
  
  // Upload open space image
  fastify.post('/open-spaces/:openSpaceId/images', uploadController.uploadOpenSpaceImage)

  // Upload open space document
  fastify.post('/open-spaces/:openSpaceId/documents', uploadController.uploadOpenSpaceDocument)

  // Reorder open space images
  fastify.put('/open-spaces/:openSpaceId/images/reorder', uploadController.reorderOpenSpaceImages)

  // Reorder open space documents
  fastify.put('/open-spaces/:openSpaceId/documents/reorder', uploadController.reorderOpenSpaceDocuments)

  // Get campus 3D models
  fastify.get('/campuses/:campusId/models', uploadController.getCampusModels)
  
  // Upload campus 3D model
  fastify.post('/campuses/:campusId/models', uploadController.uploadCampusModel)
  
  // Delete campus model
  fastify.delete('/campuses/:campusId/models/:modelId', uploadController.deleteCampusModel)
  
  // Update campus model
  fastify.put('/campuses/:campusId/models/:modelId', uploadController.updateCampusModel)
}
