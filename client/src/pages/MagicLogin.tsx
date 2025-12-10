/**
 * Magic Login Page
 * Purpose: Handle magic link authentication for temporary users
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/api/client'

export default function MagicLogin() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const token = searchParams.get('token')

  useEffect(() => {
    const authenticateWithMagicLink = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invalid magic link. No token provided.')
        return
      }

      try {
        const response: any = await apiClient.post('/auth/magic-login', { token })
        
        if (response?.user && response?.token) {
          // Store token in apiClient (which saves to localStorage)
          apiClient.setToken(response.token)
          
          setStatus('success')
          setMessage('Successfully authenticated! Redirecting to map...')
          
          // Redirect to map after 2 seconds
          setTimeout(() => {
            navigate('/map')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Authentication failed. Invalid response from server.')
        }
      } catch (error: any) {
        console.error('Magic link authentication failed:', error)
        setStatus('error')
        setMessage(error.response?.data?.message || error.message || 'Magic link authentication failed. The link may have expired or already been used.')
      }
    }

    authenticateWithMagicLink()
  }, [token, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your access link'}
            {status === 'success' && 'You have been successfully authenticated'}
            {status === 'error' && 'There was a problem with your access link'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center space-y-6">
          {/* Status Icon */}
          <div className="flex items-center justify-center">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>

          {/* Message */}
          <p className="text-center text-muted-foreground">
            {message}
          </p>

          {/* Error Actions */}
          {status === 'error' && (
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                Go to Login
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                If you need a new access link, please contact your administrator.
              </p>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Redirecting you to the map in a moment...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
