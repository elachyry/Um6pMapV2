/**
 * 3D Layer Factory
 * Purpose: Create Mapbox custom layers for 3D models
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { calculateModelTransform, createTransformationMatrix, ModelConfig } from '@/utils/modelTransform'

export interface Model3DConfig extends ModelConfig {
  id: string
  modelId: string
  modelUrl: string
  name: string
}

/**
 * Create a custom 3D layer for Mapbox
 * Inputs: map instance and model configuration
 * Outputs: Mapbox CustomLayerInterface
 */
export function create3DLayer(map: mapboxgl.Map, config: Model3DConfig) {
  const camera = new THREE.Camera()
  const scene = new THREE.Scene()
  let modelLoaded = false

  // Add ambient light to illuminate all faces evenly
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // Add directional lights for depth and shadows
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight1.position.set(0, -70, 100).normalize()
  scene.add(directionalLight1)

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight2.position.set(0, 70, 100).normalize()
  scene.add(directionalLight2)

  // Calculate model transform
  const modelTransform = calculateModelTransform(config)

  // Load the model using GLTFLoader directly (like reference)
  const loader = new GLTFLoader()
  loader.load(
    config.modelUrl,
    (gltf) => {
      scene.add(gltf.scene)
      modelLoaded = true
      console.log(`✅ Model loaded for ${config.name}`)
      map.triggerRepaint()
    },
    (progress) => {
      const percentComplete = (progress.loaded / progress.total) * 100
      console.log(`Loading ${config.name}: ${percentComplete.toFixed(0)}%`)
    },
    (error) => {
      console.error(`Failed to load model ${config.name}:`, error)
    }
  )

  // Create renderer immediately (like reference)
  const renderer = new THREE.WebGLRenderer({
    canvas: map.getCanvas(),
    context: (map as any).painter.context.gl,
    antialias: true
  })
  renderer.autoClear = false

  // Enable depth testing during initialization (like working implementation)
  const glContext = renderer.getContext()
  glContext.enable(glContext.DEPTH_TEST)
  glContext.depthFunc(glContext.LEQUAL)

  return {
    id: config.id,
    type: 'custom' as const,
    renderingMode: '3d' as const,

    onAdd: function () {
      // Renderer already created
    },

    render: function (_gl: WebGLRenderingContext, matrix: number[]) {
      if (!modelLoaded) return

      const transformMatrix = createTransformationMatrix(modelTransform, matrix)
      camera.projectionMatrix = transformMatrix

      const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), modelTransform.rotateX)
      const rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), modelTransform.rotateY)
      const rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), modelTransform.rotateZ)

      const model = scene.children[0] as THREE.Object3D
      model.matrix = new THREE.Matrix4()
        .fromArray(matrix)
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ)
        .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale))

      // Reset renderer state FIRST
      renderer.resetState()

      // CRITICAL: Enable depth testing exactly like working implementation
      const gl = renderer.getContext()
      gl.enable(gl.DEPTH_TEST)      // ← Enable depth testing
      gl.depthFunc(gl.LEQUAL)       // ← Less than or equal comparison (CRITICAL!)
      gl.depthMask(true)            // ← Enable depth writes (MOST CRITICAL!)
      
      // Render the scene
      renderer.render(scene, camera)
      
      // Trigger repaint
      map.triggerRepaint()
    },

    onRemove: function () {
      renderer.dispose()
      // Clean up scene
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
  }
}

/**
 * Add 3D model layer to map
 * Inputs: map instance and model configuration
 * Outputs: layer ID
 */
export function add3DModelToMap(map: mapboxgl.Map, config: Model3DConfig): string {
  const layer = create3DLayer(map, config)
  
  const addLayerToMap = () => {
    try {
      // Check if layer already exists (prevent duplicate layer errors)
      if (map.getLayer(config.id)) {
        console.log(`⚠️ 3D model layer ${config.id} already exists, skipping`)
        return
      }

      // CRITICAL: Insert 3D model layer BEFORE buildings-3d (fill-extrusion) layer
      // This allows proper depth testing where:
      // 1. Open spaces fill renders first (bottom)
      // 2. 3D models render second (middle) with depth testing
      // 3. Buildings extrusion renders third (can occlude models when appropriate)
      // 4. Labels render last (top)
      
      if (map.getLayer('buildings-3d')) {
        // Insert before buildings-3d for proper depth integration
        map.addLayer(layer, 'buildings-3d')
        console.log(`✅ Added 3D model layer: ${config.id} BEFORE buildings-3d (with depth testing)`)
        
        // CRITICAL: Only reposition openSpaces-fill, NOT route
        // Route is already correctly positioned before buildings-3d
        // Moving it here would break the layer order (routes should be UNDER 3D models)
        const layersToMove = ['openSpaces-fill']
        layersToMove.forEach(layerId => {
          if (map.getLayer(layerId)) {
            try {
              map.moveLayer(layerId, 'buildings-3d')
              console.log(`✅ Repositioned ${layerId} BEFORE buildings-3d`)
            } catch (e) {
              console.warn(`Failed to reposition ${layerId}:`, e)
            }
          }
        })
      } else {
        // Fallback: add normally if buildings-3d doesn't exist yet
        map.addLayer(layer)
        console.log(`✅ Added 3D model layer: ${config.id} (buildings-3d not found, added normally)`)
      }
      
      // Log layer order for debugging
      const allLayers = map.getStyle().layers?.map(l => l.id) || []
      const relevantLayers = allLayers.filter(id => 
        id.includes('openSpaces') || id.includes('buildings') || id.includes('3d') || id.includes('route')
      )
      console.log('📋 Layer order after adding 3D model:', relevantLayers)
    } catch (error) {
      console.error(`Failed to add 3D model layer ${config.id}:`, error)
    }
  }
  
  // Wait for style to load AND a delay to ensure ALL base layers (including labels) are added first
  const addWithDelay = () => {
    // Longer delay to ensure buildings, open spaces, and label layers are all added first
    setTimeout(() => {
      addLayerToMap()
    }, 500)
  }
  
  if (map.isStyleLoaded()) {
    addWithDelay()
  } else {
    map.once('style.load', addWithDelay)
  }

  return config.id
}

/**
 * Remove 3D model layer from map
 * Inputs: map instance and layer ID
 * Outputs: none
 */
export function remove3DModelFromMap(map: mapboxgl.Map | null, layerId: string): void {
  if (!map) return
  
  try {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
      console.log(`🗑️ Removed 3D model layer: ${layerId}`)
    }
  } catch (error) {
    console.error(`Failed to remove 3D model layer ${layerId}:`, error)
  }
}
