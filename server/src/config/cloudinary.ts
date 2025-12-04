/**
 * Cloudinary Configuration
 * Purpose: Configure Cloudinary for image and document uploads
 * Inputs: Environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
 * Outputs: Configured Cloudinary instance
 */

import dotenv from 'dotenv'
import { v2 as cloudinary } from 'cloudinary'

// Ensure environment variables are loaded
dotenv.config()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary
