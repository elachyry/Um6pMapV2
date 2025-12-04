import { apiClient } from './client'

export async function getCampusModels(campusId: string) {
  return apiClient.get(`/uploads/campuses/${campusId}/models`)
}

export async function uploadCampusModel(
  campusId: string,
  file: File,
  name: string,
  scale?: number,
  rotation?: { x: number; y: number; z: number },
  offset?: { x: number; y: number; z: number }
) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name)
  if (scale) formData.append('scale', scale.toString())
  if (rotation) formData.append('rotation', JSON.stringify(rotation))
  if (offset) formData.append('offset', JSON.stringify(offset))

  return apiClient.post(`/uploads/campuses/${campusId}/models`, formData)
}

export async function deleteCampusModel(campusId: string, modelId: string) {
  return apiClient.delete(`/uploads/campuses/${campusId}/models/${modelId}`)
}

export async function updateCampusModel(
  campusId: string,
  modelId: string,
  updates: {
    name?: string
    scale?: number
    rotation?: { x: number; y: number; z: number }
    offset?: { x: number; y: number; z: number }
    isActive?: boolean
  }
) {
  return apiClient.put(`/uploads/campuses/${campusId}/models/${modelId}`, updates)
}
