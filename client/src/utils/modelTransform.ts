/**
 * Model Transform Utilities
 * Purpose: Calculate 3D model transformations for Mapbox
 */

import mapboxgl from 'mapbox-gl'
import * as THREE from 'three'

export interface ModelConfig {
  coordinates: [number, number] // [lng, lat]
  altitude?: number
  scale?: number
  rotationX?: number
  rotationY?: number
  rotationZ?: number
  offsetX?: number
  offsetY?: number
  offsetZ?: number
}

export interface ModelTransform {
  translateX: number
  translateY: number
  translateZ: number
  rotateX: number
  rotateY: number
  rotateZ: number
  scale: number
}

/**
 * Calculate model transform from config
 * Inputs: ModelConfig with coordinates and transformation parameters
 * Outputs: ModelTransform for Three.js rendering
 */
export function calculateModelTransform(config: ModelConfig): ModelTransform {
  const {
    coordinates,
    altitude = 0,
    scale = 1.0,
    rotationX = 0,
    rotationY = 0,
    rotationZ = 0,
    offsetX = 0,
    offsetY = 0,
    offsetZ = 0
  } = config

  // Default rotations to apply to all models
  const DEFAULT_ROTATION_X = 90 // Make model stand upright
  const DEFAULT_ROTATION_Y = 40 // Align with map orientation

  const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    coordinates,
    altitude
  )

  // Convert offset from meters to Mercator units
  const meterScale = modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
  const offsetXMercator = offsetX * meterScale
  const offsetYMercator = offsetY * meterScale
  const offsetZMercator = offsetZ * meterScale

  return {
    translateX: modelAsMercatorCoordinate.x + offsetXMercator,
    translateY: modelAsMercatorCoordinate.y + offsetYMercator,
    translateZ: modelAsMercatorCoordinate.z + offsetZMercator,
    // Add default rotation to database rotation (not override)
    rotateX: ((DEFAULT_ROTATION_X + rotationX) * Math.PI) / 180,
    rotateY: ((DEFAULT_ROTATION_Y + rotationY) * Math.PI) / 180,
    rotateZ: (rotationZ * Math.PI) / 180,
    scale: meterScale * scale
  }
}

/**
 * Create transformation matrix for Three.js
 * Inputs: ModelTransform with translation, rotation, scale
 * Outputs: THREE.Matrix4 for camera projection
 */
export function createTransformationMatrix(
  transform: ModelTransform,
  mapMatrix: number[]
): THREE.Matrix4 {
  const rotationX = new THREE.Matrix4().makeRotationAxis(
    new THREE.Vector3(1, 0, 0),
    transform.rotateX
  )
  const rotationY = new THREE.Matrix4().makeRotationAxis(
    new THREE.Vector3(0, 1, 0),
    transform.rotateY
  )
  const rotationZ = new THREE.Matrix4().makeRotationAxis(
    new THREE.Vector3(0, 0, 1),
    transform.rotateZ
  )

  const m = new THREE.Matrix4().fromArray(mapMatrix)
  const l = new THREE.Matrix4()
    .makeTranslation(
      transform.translateX,
      transform.translateY,
      transform.translateZ
    )
    .scale(
      new THREE.Vector3(
        transform.scale,
        -transform.scale,
        transform.scale
      )
    )
    .multiply(rotationX)
    .multiply(rotationY)
    .multiply(rotationZ)

  return m.multiply(l)
}
