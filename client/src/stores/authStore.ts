/**
 * Auth Store
 * Purpose: Manage authentication state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/api/auth'
import { authApi } from '@/api/auth'
import { apiClient } from '@/api/client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login({ email, password })
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
          })
          throw error
        }
      },

      register: async (email: string, password: string, firstName?: string, lastName?: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register({ email, password, firstName, lastName })
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
            isAuthenticated: false,
          })
          throw error
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          apiClient.setToken(null)
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          })
        }
      },

      loadUser: async () => {
        const token = apiClient.getToken()
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        set({ isLoading: true })
        try {
          const response = await authApi.me()
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          apiClient.setToken(null)
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
