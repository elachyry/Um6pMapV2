/**
 * Amenities Seed
 * Purpose: Seed basic amenities that can be assigned to buildings
 */

import { prisma } from '../../src/config/database'

const amenitiesData = [
  // Accessibility
  { name: 'wheelchair-accessible', category: 'Accessibility', icon: '♿' },
  { name: 'elevator', category: 'Accessibility', icon: '🛗' },
  { name: 'ramps', category: 'Accessibility', icon: '➡️' },
  
  // Technology
  { name: 'wifi', category: 'Technology', icon: '📶' },
  { name: 'smart-board', category: 'Technology', icon: '📺' },
  { name: 'projector', category: 'Technology', icon: '📽️' },
  { name: 'computer-lab', category: 'Technology', icon: '💻' },
  
  // Facilities
  { name: 'parking', category: 'Facilities', icon: '🅿️' },
  { name: 'cafeteria', category: 'Facilities', icon: '🍽️' },
  { name: 'library', category: 'Facilities', icon: '📚' },
  { name: 'study-rooms', category: 'Facilities', icon: '📖' },
  { name: 'meeting-rooms', category: 'Facilities', icon: '👥' },
  { name: 'auditorium', category: 'Facilities', icon: '🎭' },
  { name: 'gym', category: 'Facilities', icon: '🏋️' },
  { name: 'locker-rooms', category: 'Facilities', icon: '🔐' },
  
  // Safety & Security
  { name: 'cctv', category: 'Safety', icon: '📹' },
  { name: 'security-guard', category: 'Safety', icon: '👮' },
  { name: 'fire-alarm', category: 'Safety', icon: '🔥' },
  { name: 'emergency-exit', category: 'Safety', icon: '🚪' },
  
  // Comfort
  { name: 'air-conditioning', category: 'Comfort', icon: '❄️' },
  { name: 'heating', category: 'Comfort', icon: '🔥' },
  { name: 'water-fountain', category: 'Comfort', icon: '🚰' },
  { name: 'restrooms', category: 'Comfort', icon: '🚻' },
  
  // Services
  { name: 'printing', category: 'Services', icon: '🖨️' },
  { name: 'vending-machines', category: 'Services', icon: '🥤' },
  { name: 'atm', category: 'Services', icon: '🏧' },
]

export default async function seedAmenities() {
  console.log('🎯 Seeding amenities...')

  try {
    for (const amenity of amenitiesData) {
      await (prisma as any).amenity.upsert({
        where: { name: amenity.name },
        update: {
          category: amenity.category,
          icon: amenity.icon,
        },
        create: amenity,
      })
    }

    console.log(`✅ Seeded ${amenitiesData.length} amenities`)
  } catch (error) {
    console.error('❌ Error seeding amenities:', error)
    throw error
  }
}
