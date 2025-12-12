/**
 * UserDetails Component
 * Purpose: Display full user information with audit log in tabs
 */

import { useState, useEffect } from 'react'
import { X, User, Calendar, MapPin, Mail, Phone, Shield, Clock, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { apiClient } from '@/api/client'

interface UserDetailsProps {
  userId: string
  onClose: () => void
}

interface AuditLog {
  id: string
  action: string
  resource: string
  method?: string
  endpoint?: string
  ip?: string
  userAgent?: string
  changes?: string
  metadata?: string
  level: string
  createdAt: string
}

export function UserDetails({ userId, onClose }: UserDetailsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'audit'>('info')
  const [user, setUser] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  useEffect(() => {
    if (activeTab === 'audit' && auditLogs.length === 0) {
      fetchAuditLogs()
    }
  }, [activeTab])

  const fetchUserDetails = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get<{ data: any }>(`/users/${userId}`)
      setUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true)
    try {
      const response = await apiClient.get<{ data: any }>(`/users/${userId}/audit-logs`)
      setAuditLogs(response.data || [])
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setIsLoadingAudit(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('delete') || action.includes('failed')) return 'destructive'
    if (action.includes('create') || action.includes('login')) return 'success'
    if (action.includes('update') || action.includes('change')) return 'default'
    return 'secondary'
  }

  const getLevelBadgeVariant = (level: string) => {
    if (level === 'error') return 'destructive'
    if (level === 'warning') return 'warning'
    return 'default'
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading user details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Tabs */}
        <div className="border-b flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              User Information
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Audit Log
            </button>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6 overflow-y-auto flex-1">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Basic Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">First Name</label>
                      <p className="font-medium mt-1">{user.firstName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Last Name</label>
                      <p className="font-medium mt-1">{user.lastName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="font-medium mt-1">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <p className="font-medium mt-1">{user.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Department</label>
                      <p className="font-medium mt-1">{user.department || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">User Category</label>
                      <p className="font-medium mt-1">{user.userCategory || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">User Type</label>
                      <div className="mt-1">
                        <Badge variant="default">{user.userType}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge variant={user.status === 'ACTIVE' ? 'success' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Campus
                      </label>
                      <p className="font-medium mt-1">{user.campus?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Last Login
                      </label>
                      <p className="font-medium mt-1">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Temporary User Info Card */}
              {user.userType === 'TEMPORARY' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Temporary Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Start Date</label>
                        <p className="font-medium mt-1">
                          {user.startDate ? formatDate(user.startDate) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">End Date</label>
                        <p className="font-medium mt-1">
                          {user.endDate ? formatDate(user.endDate) : 'N/A'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-muted-foreground">Purpose</label>
                        <p className="font-medium mt-1">{user.purpose || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Created At</label>
                      <p className="font-medium mt-1">{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Updated At</label>
                      <p className="font-medium mt-1">{formatDate(user.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Log
              </h3>

              {isLoadingAudit ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading audit logs...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found for this user.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                          <Badge variant={getLevelBadgeVariant(log.level)}>
                            {log.level}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.resource}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>

                      {log.endpoint && (
                        <div className="text-sm mb-1">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {log.method} {log.endpoint}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                        {log.ip && (
                          <div>
                            <span className="font-medium">IP:</span> {log.ip}
                          </div>
                        )}
                        {log.userAgent && (
                          <div className="col-span-2 truncate">
                            <span className="font-medium">User Agent:</span> {log.userAgent}
                          </div>
                        )}
                      </div>

                      {log.changes && (
                        <details className="mt-2">
                          <summary className="text-xs text-primary cursor-pointer">
                            View Changes
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(JSON.parse(log.changes), null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
