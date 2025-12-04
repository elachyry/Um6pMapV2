/**
 * Auth API
 * Purpose: Authentication API endpoints
 */

import { apiClient } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    userType: string
    status: string
  }
  token: string
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  userType: string
  status: string
  avatar?: string
  phone?: string
  department?: string
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    apiClient.setToken(response.token)
    return response
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    apiClient.setToken(response.token)
    return response
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
    apiClient.setToken(null)
  },

  async me(): Promise<{ user: User }> {
    return apiClient.get('/auth/me')
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', { oldPassword, newPassword })
  },
}
