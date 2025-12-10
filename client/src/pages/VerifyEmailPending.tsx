/**
 * Verify Email Pending Page
 * Purpose: Show after signup and when PENDING users try to login
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Mail, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'

export default function VerifyEmailPending() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuthStore()
  
  // Get email from location state (passed from signup/login)
  const email = location.state?.email || 'your email'
  
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage('')
    setResendError('')

    try {
      await apiClient.post('/auth/resend-verification', { email })
      setResendMessage('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      setResendError(error.message || 'Failed to resend email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">UM6P Map</h1>
        </div>

        {/* Verification Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          <div className="text-center">
            {/* Email Icon */}
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
            
            {/* Message */}
            <p className="text-muted-foreground mb-2">
              We've sent a verification link to:
            </p>
            <p className="text-foreground font-semibold mb-6">
              {email}
            </p>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                <strong>📧 Check your inbox</strong>
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2 ml-4 list-disc">
                <li>Click the verification link in the email</li>
                <li>The link expires in 24 hours</li>
                <li>Check your spam folder if you don't see it</li>
              </ul>
            </div>

            {/* Success/Error Messages */}
            {resendMessage && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ {resendMessage}
                </p>
              </div>
            )}

            {resendError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ❌ {resendError}
                </p>
              </div>
            )}

            {/* Resend Button */}
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              className="w-full mb-3"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Having trouble? Contact support at{' '}
            <a href="mailto:support@um6p.ma" className="text-primary hover:underline">
              support@um6p.ma
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 UM6P. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
