/**
 * Test Cloudinary Connection
 * Purpose: Verify Cloudinary credentials are correct
 * Run: npx tsx src/scripts/testCloudinary.ts
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../../.env') })

import cloudinary from '../config/cloudinary'

async function testCloudinaryConnection() {
  console.log('🧪 Testing Cloudinary connection...\n')

  // Check if credentials are set
  const config = cloudinary.config()
  
  console.log('📋 Configuration:')
  console.log(`   Cloud Name: ${config.cloud_name || '❌ NOT SET'}`)
  console.log(`   API Key: ${config.api_key ? '✅ SET' : '❌ NOT SET'}`)
  console.log(`   API Secret: ${config.api_secret ? '✅ SET' : '❌ NOT SET'}`)
  console.log()

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.error('❌ Cloudinary credentials are not properly configured!')
    console.log('\n📝 To fix this, add to your .env file:')
    console.log('   CLOUDINARY_CLOUD_NAME=your-cloud-name')
    console.log('   CLOUDINARY_API_KEY=your-api-key')
    console.log('   CLOUDINARY_API_SECRET=your-api-secret')
    console.log('\n🔗 Get credentials from: https://cloudinary.com/console')
    process.exit(1)
  }

  // Test API access
  try {
    console.log('🔍 Testing API access...')
    const result = await cloudinary.api.ping()
    console.log('✅ Cloudinary API is accessible!')
    console.log(`   Response: ${JSON.stringify(result)}`)
  } catch (error: any) {
    console.error('❌ Cloudinary API test failed!')
    console.error(`   Error: ${error.message}`)
    
    if (error.http_code === 401) {
      console.log('\n💡 Tip: Your credentials might be incorrect. Double-check:')
      console.log('   - Cloud name matches your Cloudinary account')
      console.log('   - API key and secret are copied correctly')
    }
    
    process.exit(1)
  }

  // Test upload capability
  try {
    console.log('\n📤 Testing upload capability...')
    
    // Create a simple test image (1x1 transparent PNG)
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'um6p/test',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(testImage)
    })
    
    console.log('✅ Test upload successful!')
    console.log(`   URL: ${(uploadResult as any).secure_url}`)
    
    // Clean up test image
    const publicId = (uploadResult as any).public_id
    await cloudinary.uploader.destroy(publicId)
    console.log('✅ Test cleanup successful!')
    
  } catch (error: any) {
    console.error('❌ Upload test failed!')
    console.error(`   Error: ${error.message}`)
    process.exit(1)
  }

  console.log('\n🎉 All tests passed! Cloudinary is properly configured.')
  console.log('   You can now upload images and documents.')
}

testCloudinaryConnection()
