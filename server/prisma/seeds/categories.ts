/**
 * Default Categories Seed
 * Purpose: Create default categories for campus buildings and POIs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Building Categories
export const buildingCategories = [
  {
    name: 'Academic',
    slug: 'academic',
    description: 'Academic buildings including classrooms, lecture halls, and study areas',
    icon: 'GraduationCap',
    color: '#3B82F6', // Blue
    type: 'building'
  },
  {
    name: 'Administrative',
    slug: 'administrative',
    description: 'Administrative offices and management buildings',
    icon: 'Building2',
    color: '#8B5CF6', // Purple
    type: 'building'
  },
  {
    name: 'Research',
    slug: 'research',
    description: 'Research facilities, laboratories, and innovation centers',
    icon: 'FlaskConical',
    color: '#10B981', // Green
    type: 'building'
  },
  {
    name: 'Library',
    slug: 'library',
    description: 'Libraries, resource centers, and study spaces',
    icon: 'BookOpen',
    color: '#F59E0B', // Amber
    type: 'building'
  },
  {
    name: 'Dining',
    slug: 'dining',
    description: 'Cafeterias, restaurants, and food courts',
    icon: 'Utensils',
    color: '#EF4444', // Red
    type: 'building'
  },
  {
    name: 'Recreation',
    slug: 'recreation',
    description: 'Sports facilities, gyms, and recreational areas',
    icon: 'Dumbbell',
    color: '#06B6D4', // Cyan
    type: 'building'
  },
  {
    name: 'Residence',
    slug: 'residence',
    description: 'Student dormitories and residential buildings',
    icon: 'Home',
    color: '#EC4899', // Pink
    type: 'building'
  },
  {
    name: 'Health',
    slug: 'health',
    description: 'Health centers, clinics, and medical facilities',
    icon: 'Heart',
    color: '#14B8A6', // Teal
    type: 'building'
  },
  {
    name: 'Auditorium',
    slug: 'auditorium',
    description: 'Auditoriums, theaters, and event spaces',
    icon: 'Theater',
    color: '#7C3AED', // Violet
    type: 'building'
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'IT centers, computer labs, and technology facilities',
    icon: 'Laptop',
    color: '#0EA5E9', // Sky Blue
    type: 'building'
  },
  {
    name: 'Art & Culture',
    slug: 'art-culture',
    description: 'Art galleries, museums, and cultural centers',
    icon: 'Palette',
    color: '#A855F7', // Fuchsia
    type: 'building'
  }
]

// Open Space Categories
export const openSpaceCategories = [
  {
    name: 'Park',
    slug: 'park',
    description: 'Parks, gardens, and green recreational areas',
    icon: 'TreePine',
    color: '#22C55E', // Green
    type: 'open_space'
  },
  {
    name: 'Plaza',
    slug: 'plaza',
    description: 'Open plazas, courtyards, and gathering spaces',
    icon: 'Landmark',
    color: '#F59E0B', // Amber
    type: 'open_space'
  },
  {
    name: 'Parking Lot',
    slug: 'parking-lot',
    description: 'Outdoor parking areas and lots',
    icon: 'ParkingCircle',
    color: '#6B7280', // Gray
    type: 'open_space'
  },
  {
    name: 'Sports Field',
    slug: 'sports-field',
    description: 'Athletic fields, courts, and outdoor sports facilities',
    icon: 'Trophy',
    color: '#3B82F6', // Blue
    type: 'open_space'
  },
  {
    name: 'Garden',
    slug: 'garden',
    description: 'Botanical gardens, flower gardens, and landscaped areas',
    icon: 'Flower2',
    color: '#EC4899', // Pink
    type: 'open_space'
  },
  {
    name: 'Amphitheater',
    slug: 'amphitheater',
    description: 'Outdoor amphitheaters and performance spaces',
    icon: 'Music',
    color: '#8B5CF6', // Purple
    type: 'open_space'
  },
  {
    name: 'Walkway',
    slug: 'walkway',
    description: 'Pedestrian paths, walkways, and promenades',
    icon: 'MapPin',
    color: '#14B8A6', // Teal
    type: 'open_space'
  },
  {
    name: 'Water Feature',
    slug: 'water-feature',
    description: 'Fountains, ponds, and water installations',
    icon: 'Waves',
    color: '#06B6D4', // Cyan
    type: 'open_space'
  },
  {
    name: 'Outdoor Seating',
    slug: 'outdoor-seating',
    description: 'Benches, picnic areas, and outdoor seating zones',
    icon: 'Coffee',
    color: '#F97316', // Orange
    type: 'open_space'
  },
  {
    name: 'Transportation Hub',
    slug: 'transportation-hub',
    description: 'Bus stops, bike stations, and transportation areas',
    icon: 'Bus',
    color: '#EF4444', // Red
    type: 'open_space'
  },
  {
    name: 'Emergency Area',
    slug: 'emergency-area',
    description: 'Emergency assembly points and safety zones',
    icon: 'AlertTriangle',
    color: '#DC2626', // Dark Red
    type: 'open_space'
  },
  {
    name: 'Viewpoint',
    slug: 'viewpoint',
    description: 'Scenic viewpoints and observation areas',
    icon: 'Mountain',
    color: '#7C3AED', // Violet
    type: 'open_space'
  }
]

// Combined categories
export const defaultCategories = [...buildingCategories, ...openSpaceCategories]

export async function seedCategories() {
  console.log('🌱 Seeding categories...')
  
  try {
    for (const category of defaultCategories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category
      })
    }
    
    console.log(`✅ Successfully seeded ${defaultCategories.length} categories`)
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }
}
