/**
 * Upload Controller
 * Purpose: Handle file upload requests for buildings
 * Inputs: Multipart form data with files
 * Outputs: Upload results with URLs
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import * as uploadService from '../services/uploadService'
import { prisma } from '../config/database'

/**
 * Upload building image
 * Purpose: Upload image and save to BuildingImage table
 * Input: buildingId, image file, caption (optional)
 * Output: Image record with Cloudinary URL
 */
export async function uploadBuildingImage(
  request: FastifyRequest<{ Params: { buildingId: string } }>,
  reply: FastifyReply
) {
  try {
    const { buildingId } = request.params
    
    // Get multipart data
    const data = await request.file()
    
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: 'No file provided'
      })
    }

    // Get file buffer
    const fileBuffer = await data.toBuffer()
    
    // Upload to Cloudinary
    const uploadResult = await uploadService.uploadImage(fileBuffer, 'buildings/images')
    
    // Get current max display order
    const maxOrder = await (prisma as any).buildingImage.findFirst({
      where: { buildingId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })
    
    // Save to database
    const caption = data.fields.caption ? String((data.fields.caption as any).value || '') : ''
    const image = await (prisma as any).buildingImage.create({
      data: {
        buildingId,
        imageUrl: uploadResult.url,
        caption,
        displayOrder: (maxOrder?.displayOrder || 0) + 1,
      }
    })

    return reply.status(201).send({
      success: true,
      data: image
    })
  } catch (error: any) {
    console.error('Error uploading building image:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to upload image'
    })
  }
}

/**
 * Upload building document
 * Purpose: Upload document and save to BuildingDocument table
 * Input: buildingId, document file, title
 * Output: Document record with Cloudinary URL
 */
export async function uploadBuildingDocument(
  request: FastifyRequest<{ Params: { buildingId: string } }>,
  reply: FastifyReply
) {
  try {
    const { buildingId } = request.params
    
    // Get multipart data
    const data = await request.file()
    
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: 'No file provided'
      })
    }

    // Get file buffer
    const fileBuffer = await data.toBuffer()
    
    // Upload to Cloudinary
    const uploadResult = await uploadService.uploadDocument(
      fileBuffer,
      'buildings/documents',
      data.filename
    )
    
    // Get file extension from filename as fallback
    const getFileType = () => {
      if (uploadResult.format) return uploadResult.format
      const match = data.filename.match(/\.([^.]+)$/)
      return match ? match[1].toLowerCase() : 'unknown'
    }
    
    // Get current max display order
    const maxOrder = await (prisma as any).buildingDocument.findFirst({
      where: { buildingId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })
    
    // Save to database
    const title = data.fields.title ? String((data.fields.title as any).value || data.filename) : data.filename
    const document = await (prisma as any).buildingDocument.create({
      data: {
        buildingId,
        documentUrl: uploadResult.url,
        title,
        fileType: getFileType(),
        fileSize: uploadResult.size,
        displayOrder: (maxOrder?.displayOrder || 0) + 1,
      }
    })

    return reply.status(201).send({
      success: true,
      data: document
    })
  } catch (error: any) {
    console.error('Error uploading building document:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to upload document'
    })
  }
}

/**
 * Delete building image
 * Purpose: Delete image from Cloudinary and database
 * Input: buildingId, imageId
 * Output: Success message
 */
export async function deleteBuildingImage(
  request: FastifyRequest<{ Params: { buildingId: string; imageId: string } }>,
  reply: FastifyReply
) {
  try {
    const { imageId } = request.params
    
    // Get image record
    const image = await (prisma as any).buildingImage.findUnique({
      where: { id: imageId }
    })
    
    if (!image) {
      return reply.status(404).send({
        success: false,
        error: 'Image not found'
      })
    }
    
    // Extract public_id from URL (optional - can fail silently)
    try {
      const urlParts = image.imageUrl.split('/')
      const publicIdWithExt = urlParts.slice(-3).join('/')
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '')
      await uploadService.deleteFile(publicId)
    } catch (error) {
      console.warn('Could not delete from Cloudinary:', error)
    }
    
    // Delete from database
    await (prisma as any).buildingImage.delete({
      where: { id: imageId }
    })

    return reply.status(200).send({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting building image:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete image'
    })
  }
}

/**
 * Delete building document
 * Purpose: Delete document from Cloudinary and database
 * Input: buildingId, documentId
 * Output: Success message
 */
export async function deleteBuildingDocument(
  request: FastifyRequest<{ Params: { buildingId: string; documentId: string } }>,
  reply: FastifyReply
) {
  try {
    const { documentId } = request.params
    
    // Get document record
    const document = await (prisma as any).buildingDocument.findUnique({
      where: { id: documentId }
    })
    
    if (!document) {
      return reply.status(404).send({
        success: false,
        error: 'Document not found'
      })
    }
    
    // Extract public_id from URL (optional - can fail silently)
    try {
      const urlParts = document.documentUrl.split('/')
      const publicIdWithExt = urlParts.slice(-3).join('/')
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '')
      await uploadService.deleteFile(publicId)
    } catch (error) {
      console.warn('Could not delete from Cloudinary:', error)
    }
    
    // Delete from database
    await (prisma as any).buildingDocument.delete({
      where: { id: documentId }
    })

    return reply.status(200).send({
      success: true,
      message: 'Document deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting building document:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete document'
    })
  }
}

/**
 * Reorder building images
 * Purpose: Update display order of images
 * Input: buildingId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderBuildingImages(
  request: FastifyRequest<{ 
    Params: { buildingId: string }
    Body: { images: Array<{ id: string; displayOrder: number }> }
  }>,
  reply: FastifyReply
) {
  try {
    const { images } = request.body
    
    // Update each image's display order
    await Promise.all(
      images.map(img =>
        (prisma as any).buildingImage.update({
          where: { id: img.id },
          data: { displayOrder: img.displayOrder }
        })
      )
    )

    return reply.status(200).send({
      success: true,
      message: 'Images reordered successfully'
    })
  } catch (error: any) {
    console.error('Error reordering images:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to reorder images'
    })
  }
}

/**
 * Reorder building documents
 * Purpose: Update display order of documents
 * Input: buildingId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderBuildingDocuments(
  request: FastifyRequest<{ 
    Params: { buildingId: string }
    Body: { documents: Array<{ id: string; displayOrder: number }> }
  }>,
  reply: FastifyReply
) {
  try {
    const { documents } = request.body
    
    // Update each document's display order
    await Promise.all(
      documents.map(doc =>
        (prisma as any).buildingDocument.update({
          where: { id: doc.id },
          data: { displayOrder: doc.displayOrder }
        })
      )
    )

    return reply.status(200).send({
      success: true,
      message: 'Documents reordered successfully'
    })
  } catch (error: any) {
    console.error('Error reordering documents:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to reorder documents'
    })
  }
}

/**
 * Get campus 3D models
 * Purpose: Retrieve all 3D models for a campus
 * Input: Campus ID
 * Output: List of models
 */
export async function getCampusModels(
  request: FastifyRequest<{ Params: { campusId: string } }>,
  reply: FastifyReply
) {
  try {
    const { campusId } = request.params
    
    const models = await (prisma as any).buildingModel.findMany({
      where: { campusId },
      orderBy: { createdAt: 'desc' }
    })

    return reply.status(200).send({
      success: true,
      data: models
    })
  } catch (error: any) {
    console.error('Error fetching campus models:', error)
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch models'
    })
  }
}

/**
 * Upload campus 3D model
 * Purpose: Upload GLB/GLTF model file for a campus
 * Input: Campus ID, model file, metadata
 * Output: Created model record
 */
export async function uploadCampusModel(
  request: FastifyRequest<{ Params: { campusId: string } }>,
  reply: FastifyReply
) {
  try {
    const { campusId } = request.params
    
    const data = await request.file()
    
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: 'No file provided'
      })
    }

    const fileBuffer = await data.toBuffer()
    
    // Upload to Cloudinary
    const uploadResult = await uploadService.uploadModel(
      fileBuffer,
      'buildings/models',
      data.filename
    )
    
    // Save to database
    const name = data.fields.name ? String((data.fields.name as any).value || data.filename) : data.filename
    const scale = data.fields.scale ? parseFloat(String((data.fields.scale as any).value || '1.0')) : 1.0
    const rotation = data.fields.rotation ? String((data.fields.rotation as any).value || null) : null
    const offset = data.fields.offset ? String((data.fields.offset as any).value || null) : null
    
    const model = await (prisma as any).buildingModel.create({
      data: {
        campusId,
        modelUrl: uploadResult.url,
        name,
        fileSize: uploadResult.size,
        scale,
        rotation,
        offset,
        isActive: false, // Default to inactive
      }
    })

    return reply.status(201).send({
      success: true,
      data: model
    })
  } catch (error: any) {
    console.error('Error uploading building model:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to upload model'
    })
  }
}

/**
 * Delete campus model
 * Purpose: Delete a 3D model file
 * Input: Campus ID, model ID
 * Output: Success confirmation
 */
export async function deleteCampusModel(
  request: FastifyRequest<{ Params: { campusId: string; modelId: string } }>,
  reply: FastifyReply
) {
  try {
    const { modelId } = request.params
    
    const model = await (prisma as any).buildingModel.findUnique({
      where: { id: modelId }
    })
    
    if (!model) {
      return reply.status(404).send({
        success: false,
        error: 'Model not found'
      })
    }
    
    // Extract public ID from URL and delete from Cloudinary
    const publicId = model.modelUrl.split('/').slice(-2).join('/').split('.')[0]
    await uploadService.deleteFile(publicId)
    
    // Delete from database
    await (prisma as any).buildingModel.delete({
      where: { id: modelId }
    })

    return reply.status(200).send({
      success: true,
      message: 'Model deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting model:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete model'
    })
  }
}

/**
 * Update campus model
 * Purpose: Update model metadata (scale, rotation, etc.)
 * Input: Campus ID, model ID, update data
 * Output: Updated model record
 */
export async function updateCampusModel(
  request: FastifyRequest<{
    Params: { campusId: string; modelId: string }
    Body: any
  }>,
  reply: FastifyReply
) {
  try {
    const { modelId } = request.params
    const updates = request.body
    
    const model = await (prisma as any).buildingModel.update({
      where: { id: modelId },
      data: updates
    })

    return reply.status(200).send({
      success: true,
      data: model
    })
  } catch (error: any) {
    console.error('Error updating model:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to update model'
    })
  }
}

/**
 * Upload location image
 * Purpose: Upload image and save to LocationImage table
 * Input: locationId, image file, caption (optional)
 * Output: Image record with Cloudinary URL
 */
export async function uploadLocationImage(
  request: FastifyRequest<{ Params: { locationId: string } }>,
  reply: FastifyReply
) {
  try {
    const { locationId } = request.params
    
    // Get multipart data
    const data = await request.file()
    
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: 'No file provided'
      })
    }

    // Get file buffer
    const fileBuffer = await data.toBuffer()
    
    // Upload to Cloudinary
    const uploadResult = await uploadService.uploadImage(fileBuffer, 'locations/images')
    
    // Get current max display order
    const maxOrder = await (prisma as any).locationImage.findFirst({
      where: { locationId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })
    
    // Save to database
    const caption = data.fields.caption ? String((data.fields.caption as any).value || '') : ''
    const image = await (prisma as any).locationImage.create({
      data: {
        locationId,
        imageUrl: uploadResult.url,
        caption,
        displayOrder: (maxOrder?.displayOrder || 0) + 1,
      }
    })

    return reply.status(201).send({
      success: true,
      data: image
    })
  } catch (error: any) {
    console.error('Error uploading location image:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to upload image'
    })
  }
}

/**
 * Upload location document
 * Purpose: Upload document and save to LocationDocument table
 * Input: locationId, document file, title
 * Output: Document record with Cloudinary URL
 */
export async function uploadLocationDocument(
  request: FastifyRequest<{ Params: { locationId: string } }>,
  reply: FastifyReply
) {
  try {
    const { locationId } = request.params
    
    // Get multipart data
    const data = await request.file()
    
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: 'No file provided'
      })
    }

    // Get file buffer
    const fileBuffer = await data.toBuffer()
    
    // Upload to Cloudinary
    const uploadResult = await uploadService.uploadDocument(
      fileBuffer,
      'locations/documents',
      data.filename
    )
    
    // Get file extension from filename as fallback
    const getFileType = () => {
      if (uploadResult.format) return uploadResult.format
      const match = data.filename.match(/\.([^.]+)$/)
      return match ? match[1].toLowerCase() : 'unknown'
    }
    
    // Get current max display order
    const maxOrder = await (prisma as any).locationDocument.findFirst({
      where: { locationId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })
    
    // Save to database
    const title = data.fields.title ? String((data.fields.title as any).value || data.filename) : data.filename
    const document = await (prisma as any).locationDocument.create({
      data: {
        locationId,
        documentUrl: uploadResult.url,
        title: title,
        fileType: getFileType(),
        fileSize: uploadResult.size,
        displayOrder: (maxOrder?.displayOrder || 0) + 1,
      }
    })

    return reply.status(201).send({
      success: true,
      data: document
    })
  } catch (error: any) {
    console.error('Error uploading location document:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to upload document'
    })
  }
}

/**
 * Reorder location images
 * Purpose: Update display order of images
 * Input: locationId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderLocationImages(
  request: FastifyRequest<{ 
    Params: { locationId: string }
    Body: { images: Array<{ id: string; displayOrder: number }> }
  }>,
  reply: FastifyReply
) {
  try {
    const { images } = request.body
    
    // Update each image's display order
    await Promise.all(
      images.map(img =>
        (prisma as any).locationImage.update({
          where: { id: img.id },
          data: { displayOrder: img.displayOrder }
        })
      )
    )

    return reply.status(200).send({
      success: true,
      message: 'Images reordered successfully'
    })
  } catch (error: any) {
    console.error('Error reordering images:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to reorder images'
    })
  }
}

/**
 * Reorder location documents
 * Purpose: Update display order of documents
 * Input: locationId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderLocationDocuments(
  request: FastifyRequest<{ 
    Params: { locationId: string }
    Body: { documents: Array<{ id: string; displayOrder: number }> }
  }>,
  reply: FastifyReply
) {
  try {
    const { documents } = request.body
    
    // Update each document's display order
    await Promise.all(
      documents.map(doc =>
        (prisma as any).locationDocument.update({
          where: { id: doc.id },
          data: { displayOrder: doc.displayOrder }
        })
      )
    )

    return reply.status(200).send({
      success: true,
      message: 'Documents reordered successfully'
    })
  } catch (error: any) {
    console.error('Error reordering documents:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to reorder documents'
    })
  }
}

/**
 * Upload open space image
 * Purpose: Upload image and save to OpenSpaceImage table
 * Input: openSpaceId, image file, caption (optional)
 * Output: Image record with Cloudinary URL
 */
export async function uploadOpenSpaceImage(
  request: FastifyRequest<{ Params: { openSpaceId: string } }>,
  reply: FastifyReply
) {
  try {
    const { openSpaceId } = request.params
    
    // Get multipart data
    const data = await request.file()
    
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: 'No file provided'
      })
    }

    // Get file buffer
    const fileBuffer = await data.toBuffer()
    
    // Upload to Cloudinary
    const uploadResult = await uploadService.uploadImage(fileBuffer, 'open-spaces/images')
    
    // Get current max display order
    const maxOrder = await (prisma as any).openSpaceImage.findFirst({
      where: { openSpaceId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })
    
    // Save to database
    const caption = data.fields.caption ? String((data.fields.caption as any).value || '') : ''
    const image = await (prisma as any).openSpaceImage.create({
      data: {
        openSpaceId,
        imageUrl: uploadResult.url,
        caption,
        displayOrder: (maxOrder?.displayOrder || 0) + 1,
      }
    })

    return reply.status(201).send({
      success: true,
      data: image
    })
  } catch (error: any) {
    console.error('Error uploading open space image:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to upload image'
    })
  }
}

/**
 * Upload open space document
 * Purpose: Upload document and save to OpenSpaceDocument table
 * Input: openSpaceId, document file, title
 * Output: Document record with Cloudinary URL
 */
export async function uploadOpenSpaceDocument(
  request: FastifyRequest<{ Params: { openSpaceId: string } }>,
  reply: FastifyReply
) {
  try {
    const { openSpaceId } = request.params
    
    // Get multipart data
    const data = await request.file()
    
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: 'No file provided'
      })
    }

    // Get file buffer
    const fileBuffer = await data.toBuffer()
    
    // Upload to Cloudinary
    const uploadResult = await uploadService.uploadDocument(
      fileBuffer,
      'open-spaces/documents',
      data.filename
    )
    
    // Get file extension from filename as fallback
    const getFileType = () => {
      if (uploadResult.format) return uploadResult.format
      const match = data.filename.match(/\.([^.]+)$/)
      return match ? match[1].toLowerCase() : 'unknown'
    }
    
    // Get current max display order
    const maxOrder = await (prisma as any).openSpaceDocument.findFirst({
      where: { openSpaceId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })
    
    // Save to database
    const title = data.fields.title ? String((data.fields.title as any).value || data.filename) : data.filename
    const document = await (prisma as any).openSpaceDocument.create({
      data: {
        openSpaceId,
        documentUrl: uploadResult.url,
        title: title,
        fileType: getFileType(),
        fileSize: uploadResult.size,
        displayOrder: (maxOrder?.displayOrder || 0) + 1,
      }
    })

    return reply.status(201).send({
      success: true,
      data: document
    })
  } catch (error: any) {
    console.error('Error uploading open space document:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to upload document'
    })
  }
}

/**
 * Reorder open space images
 * Purpose: Update display order of images
 * Input: openSpaceId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderOpenSpaceImages(
  request: FastifyRequest<{ 
    Params: { openSpaceId: string }
    Body: { images: Array<{ id: string; displayOrder: number }> }
  }>,
  reply: FastifyReply
) {
  try {
    const { images } = request.body
    
    // Update each image's display order
    await Promise.all(
      images.map(img =>
        (prisma as any).openSpaceImage.update({
          where: { id: img.id },
          data: { displayOrder: img.displayOrder }
        })
      )
    )

    return reply.status(200).send({
      success: true,
      message: 'Images reordered successfully'
    })
  } catch (error: any) {
    console.error('Error reordering images:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to reorder images'
    })
  }
}

/**
 * Reorder open space documents
 * Purpose: Update display order of documents
 * Input: openSpaceId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderOpenSpaceDocuments(
  request: FastifyRequest<{ 
    Params: { openSpaceId: string }
    Body: { documents: Array<{ id: string; displayOrder: number }> }
  }>,
  reply: FastifyReply
) {
  try {
    const { documents } = request.body
    
    // Update each document's display order
    await Promise.all(
      documents.map(doc =>
        (prisma as any).openSpaceDocument.update({
          where: { id: doc.id },
          data: { displayOrder: doc.displayOrder }
        })
      )
    )

    return reply.status(200).send({
      success: true,
      message: 'Documents reordered successfully'
    })
  } catch (error: any) {
    console.error('Error reordering documents:', error)
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to reorder documents'
    })
  }
}
