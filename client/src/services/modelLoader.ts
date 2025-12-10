/**
 * Model Loader Service
 * Purpose: Load and cache 3D GLB models
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { modelCache } from '@/utils/modelCache'

const loader = new GLTFLoader()

/**
 * Load GLB model from URL with caching
 * Inputs: modelId and modelUrl
 * Outputs: Promise<GLTF> - loaded model
 */
export async function loadModel(modelId: string, modelUrl: string): Promise<GLTF> {
  // Check cache first
  const cachedModel = modelCache.get(modelId)
  if (cachedModel) {
    console.log(`Model ${modelId} loaded from cache`)
    return cachedModel
  }

  // Load model from URL
  return new Promise((resolve, reject) => {
    loader.load(
      modelUrl,
      (gltf) => {
        // Cache the loaded model
        modelCache.set(modelId, gltf, modelUrl)
        console.log(`Model ${modelId} loaded and cached`)
        resolve(gltf)
      },
      (progress) => {
        const percentComplete = (progress.loaded / progress.total) * 100
        console.log(`Loading model ${modelId}: ${percentComplete.toFixed(2)}%`)
      },
      (error) => {
        console.error(`Error loading model ${modelId}:`, error)
        reject(error)
      }
    )
  })
}

/**
 * Preload multiple models
 * Inputs: array of { modelId, modelUrl }
 * Outputs: Promise<void>
 */
export async function preloadModels(
  models: Array<{ modelId: string; modelUrl: string }>
): Promise<void> {
  const promises = models.map(({ modelId, modelUrl }) =>
    loadModel(modelId, modelUrl).catch((error) => {
      console.error(`Failed to preload model ${modelId}:`, error)
    })
  )

  await Promise.all(promises)
}
