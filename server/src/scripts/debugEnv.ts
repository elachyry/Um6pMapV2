/**
 * Debug Environment Variables
 * Purpose: Check if .env file is being loaded correctly
 */

import dotenv from 'dotenv'
import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

const envPath = resolve(__dirname, '../../.env')

console.log('🔍 Environment Debug\n')
console.log(`📂 Looking for .env at: ${envPath}`)
console.log(`📄 File exists: ${existsSync(envPath) ? '✅ YES' : '❌ NO'}\n`)

if (existsSync(envPath)) {
  console.log('📖 .env file contents (first 50 lines):')
  console.log('─'.repeat(60))
  const content = readFileSync(envPath, 'utf-8')
  const lines = content.split('\n').slice(0, 50)
  lines.forEach((line, i) => {
    // Mask secret values
    if (line.includes('SECRET') || line.includes('KEY')) {
      const parts = line.split('=')
      if (parts.length > 1) {
        console.log(`${i + 1}: ${parts[0]}=****`)
      } else {
        console.log(`${i + 1}: ${line}`)
      }
    } else {
      console.log(`${i + 1}: ${line}`)
    }
  })
  console.log('─'.repeat(60))
  console.log()
}

console.log('🔄 Loading .env...')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('❌ Error loading .env:', result.error.message)
} else {
  console.log('✅ .env loaded successfully\n')
}

console.log('🌍 Cloudinary Environment Variables:')
console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ SET (' + process.env.CLOUDINARY_CLOUD_NAME + ')' : '❌ NOT SET'}`)
console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET'}`)
console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET'}`)
console.log()

console.log('📋 All Environment Variables containing "CLOUDINARY":')
Object.keys(process.env)
  .filter(key => key.includes('CLOUDINARY'))
  .forEach(key => {
    const value = process.env[key]
    if (key.includes('SECRET') || key.includes('KEY')) {
      console.log(`   ${key}: ****`)
    } else {
      console.log(`   ${key}: ${value}`)
    }
  })
