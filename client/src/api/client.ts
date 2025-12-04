/**
 * API Client
 * Purpose: Centralized HTTP client for API requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface ApiError {
  statusCode: number
  error: string
  message: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.token = localStorage.getItem('token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  getToken() {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {}

    // Only set Content-Type for non-FormData requests
    // FormData will automatically set multipart/form-data with boundary
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    // Add any custom headers
    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>)
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      const error = data as ApiError
      throw new Error(error.message || 'An error occurred')
    }

    return data
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  }

  async delete<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
