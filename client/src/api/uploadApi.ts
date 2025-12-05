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

/**
 * Upload location image
 * Purpose: Upload image file to Cloudinary via backend
 * Input: locationId, image file, caption (optional)
 * Output: Image record with URL
 */
export async function uploadLocationImage(
  locationId: string,
  file: File,
  caption?: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  if (caption) {
    formData.append('caption', caption)
  }

  const response = await apiClient.post<any>(
    `/uploads/locations/${locationId}/images`,
    formData
  )
  
  return response.data
}

/**
 * Upload location document
 * Purpose: Upload document file to Cloudinary via backend
 * Input: locationId, document file, title
 * Output: Document record with URL
 */
export async function uploadLocationDocument(
  locationId: string,
  file: File,
  title: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)

  const response = await apiClient.post<any>(
    `/uploads/locations/${locationId}/documents`,
    formData
  )
  
  return response.data
}

/**
 * Reorder location images
 * Purpose: Update display order of images
 * Input: locationId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderLocationImages(
  locationId: string,
  images: Array<{ id: string; displayOrder: number }>
): Promise<void> {
  await apiClient.put(`/uploads/locations/${locationId}/images/reorder`, { images })
}

/**
 * Reorder location documents
 * Purpose: Update display order of documents
 * Input: locationId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderLocationDocuments(
  locationId: string,
  documents: Array<{ id: string; displayOrder: number }>
): Promise<void> {
  await apiClient.put(`/uploads/locations/${locationId}/documents/reorder`, { documents })
}

/**
 * Upload open space image
 * Purpose: Upload image file to Cloudinary via backend
 * Input: openSpaceId, image file, caption (optional)
 * Output: Image record with URL
 */
export async function uploadOpenSpaceImage(
  openSpaceId: string,
  file: File,
  caption?: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  if (caption) {
    formData.append('caption', caption)
  }

  const response = await apiClient.post<any>(
    `/uploads/open-spaces/${openSpaceId}/images`,
    formData
  )
  
  return response.data
}

/**
 * Upload open space document
 * Purpose: Upload document file to Cloudinary via backend
 * Input: openSpaceId, document file, title
 * Output: Document record with URL
 */
export async function uploadOpenSpaceDocument(
  openSpaceId: string,
  file: File,
  title: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)

  const response = await apiClient.post<any>(
    `/uploads/open-spaces/${openSpaceId}/documents`,
    formData
  )
  
  return response.data
}

/**
 * Reorder open space images
 * Purpose: Update display order of images
 * Input: openSpaceId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderOpenSpaceImages(
  openSpaceId: string,
  images: Array<{ id: string; displayOrder: number }>
): Promise<void> {
  await apiClient.put(`/uploads/open-spaces/${openSpaceId}/images/reorder`, { images })
}

/**
 * Reorder open space documents
 * Purpose: Update display order of documents
 * Input: openSpaceId, array of {id, displayOrder}
 * Output: Success message
 */
export async function reorderOpenSpaceDocuments(
  openSpaceId: string,
  documents: Array<{ id: string; displayOrder: number }>
): Promise<void> {
  await apiClient.put(`/uploads/open-spaces/${openSpaceId}/documents/reorder`, { documents })
}
