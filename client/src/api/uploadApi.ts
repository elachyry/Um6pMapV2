/**
 * Upload API
 * Purpose: Handle file uploads for buildings
 * Inputs: Files and metadata
 * Outputs: Upload results with URLs
 */

import { apiClient } from './client'

/**
 * Upload building image
 * Purpose: Upload image file to Cloudinary via backend
 * Input: buildingId, image file, caption (optional)
 * Output: Image record with URL
 */
export async function uploadBuildingImage(
  buildingId: string,
  file: File,
  caption?: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  if (caption) {
    formData.append('caption', caption)
  }

  const response = await apiClient.post<any>(
    `/uploads/buildings/${buildingId}/images`,
    formData
  )
  
  return response.data
}

/**
 * Upload building document
 * Purpose: Upload document file to Cloudinary via backend
 * Input: buildingId, document file, title
 * Output: Document record with URL
 */
export async function uploadBuildingDocument(
  buildingId: string,
  file: File,
  title: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)

  const response = await apiClient.post<any>(
    `/uploads/buildings/${buildingId}/documents`,
    formData
  )
  
  return response.data
}

/**
 * Delete building image
 * Purpose: Remove image from Cloudinary and database
 * Input: buildingId, imageId
 * Output: Success message
 */
export async function deleteBuildingImage(
  buildingId: string,
  imageId: string
): Promise<void> {
  await apiClient.delete(`/uploads/buildings/${buildingId}/images/${imageId}`)
}

/**
 * Delete building document
 * Purpose: Remove document from Cloudinary and database
 * Input: buildingId, documentId
 * Output: Success message
 */
export async function deleteBuildingDocument(
  buildingId: string,
  documentId: string
): Promise<void> {
  await apiClient.delete(`/uploads/buildings/${buildingId}/documents/${documentId}`)
}

/**
 * Reorder building images
 * Purpose: Update display order of images
 * Input: buildingId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderBuildingImages(
  buildingId: string,
  images: Array<{ id: string; displayOrder: number }>
): Promise<void> {
  await apiClient.put(`/uploads/buildings/${buildingId}/images/reorder`, { images })
}

/**
 * Reorder building documents
 * Purpose: Update display order of documents
 * Input: buildingId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderBuildingDocuments(
  buildingId: string,
  documents: Array<{ id: string; displayOrder: number }>
): Promise<void> {
  await apiClient.put(`/uploads/buildings/${buildingId}/documents/reorder`, { documents })
}
