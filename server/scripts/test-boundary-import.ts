/**
 * Test Boundary Import
 * Purpose: Test boundary import functionality directly
 */

import { prisma } from '../src/config/database'
import * as boundaryService from '../src/services/boundaryService'

async function testBoundaryImport() {
  console.log('\n🧪 Testing Boundary Import\n')
  console.log('='.repeat(80))

  try {
    // Get first campus
    const campus = await prisma.campus.findFirst()
    
    if (!campus) {
      console.error('❌ No campus found! Run: npm run seed')
      return
    }

    console.log(`\n✅ Using campus: ${campus.name}`)
    console.log(`   ID: ${campus.id}\n`)

    // Test GeoJSON
    const testGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            'display name': 'Test Boundary ' + Date.now()
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-7.938232, 32.221538],
              [-7.938586, 32.220822],
              [-7.938811, 32.220388],
              [-7.938232, 32.221538]
            ]]
          }
        }
      ]
    }

    console.log('📤 Importing test boundary...\n')
    
    const result = await boundaryService.importFromGeoJSON(campus.id, testGeoJSON)
    
    console.log('✅ Import Result:')
    console.log(`   Total: ${result.total}`)
    console.log(`   Imported: ${result.imported}`)
    console.log(`   Duplicates: ${result.duplicates}`)
    console.log(`   Errors: ${result.errors}`)
    
    if (result.details.imported.length > 0) {
      console.log(`\n   Imported boundaries:`)
      result.details.imported.forEach(name => console.log(`   - ${name}`))
    }
    
    if (result.details.errors.length > 0) {
      console.log(`\n   Errors:`)
      result.details.errors.forEach(err => console.log(`   - ${err.name}: ${err.error}`))
    }

    // Verify in database
    console.log('\n📊 Checking database...')
    const boundaries = await prisma.boundary.findMany({
      where: { campusId: campus.id },
      take: 5
    })
    
    console.log(`   Found ${boundaries.length} boundaries in database`)
    boundaries.forEach(b => console.log(`   - ${b.name} (${b.slug})`))

    console.log('\n' + '='.repeat(80))
    console.log('✅ Test completed successfully!\n')

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    console.error('\nStack trace:')
    console.error(error.stack)
    process.exit(1)
  }
}

testBoundaryImport()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
