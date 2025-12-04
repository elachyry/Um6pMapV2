/**
 * Upload Service
 * Purpose: Handle file uploads to Cloudinary
 * Inputs: File buffer or path, upload options
 * Outputs: Cloudinary URL and public_id
 */

import cloudinary from '../config/cloudinary'
import { Readable } from 'stream'

interface UploadResult {
  url: string
  publicId: string
  format: string
  size: number
}

/**
 * Upload image to Cloudinary
 * Purpose: Upload image file and return URL
 * Input: File buffer, folder name
 * Output: Image URL and metadata
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder: string = 'buildings'
): Promise<UploadResult> {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `um6p/${folder}`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes,
            })
          }
        }
      )

      const stream = Readable.from(fileBuffer)
      stream.pipe(uploadStream)
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}

/**
 * Upload document to Cloudinary
 * Purpose: Upload document file (PDF, DOC, etc.) and return URL
 * Input: File buffer, folder name, original filename
 * Output: Document URL and metadata
 */
export async function uploadDocument(
  fileBuffer: Buffer,
  folder: string = 'documents',
  originalFilename: string
): Promise<UploadResult> {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `um6p/${folder}`,
          resource_type: 'raw',
          public_id: originalFilename.replace(/\.[^/.]+$/, ''), // Remove extension
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes,
            })
          }
        }
      )

      const stream = Readable.from(fileBuffer)
      stream.pipe(uploadStream)
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    throw new Error('Failed to upload document')
  }
}

/**
 * Upload 3D model (GLB) to Cloudinary
 * Purpose: Upload GLB model file and return URL
 * Input: File buffer, folder name, original filename
 * Output: Model URL and metadata
 */
export async function uploadModel(
  fileBuffer: Buffer,
  folder: string = 'models',
  originalFilename: string
): Promise<UploadResult> {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `um6p/${folder}`,
          resource_type: 'raw', // GLB files are uploaded as raw
          public_id: originalFilename.replace(/\.[^/.]+$/, ''), // Remove extension
          allowed_formats: ['glb', 'gltf'], // Only allow GLB/GLTF files
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format || 'glb',
              size: result.bytes,
            })
          }
        }
      )

      const stream = Readable.from(fileBuffer)
      stream.pipe(uploadStream)
    })
  } catch (error) {
    console.error('Error uploading 3D model:', error)
    throw new Error('Failed to upload 3D model')
  }
}

/**
 * Delete file from Cloudinary
 * Purpose: Remove uploaded file from cloud storage
 * Input: Public ID of the file to delete
 * Output: Deletion confirmation
 */
export async function deleteFile(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}
