import { useState, useEffect } from 'react'
import { Users, UserPlus, Download, Search, CheckCircle, XCircle, Edit, Trash2, Power, KeyRound, Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UserForm } from '@/components/UserForm'
import { UserDetails } from '@/components/UserDetails'
import { BulkUserImport } from '@/components/BulkUserImport'
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus, resetUserPassword } from '@/api/userApi'
import { useToast } from '@/hooks/useToast'
import { useCampusStore } from '@/stores/campusStore'

const USERS_PER_PAGE = 12

export default function PermanentUsers() {
  const toast = useToast()
  const { selectedCampusId } = useCampusStore()
  
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null)
  const [userToToggle, setUserToToggle] = useState<{ id: string; name: string; status: string } | null>(null)
  const [userToReset, setUserToReset] = useState<{ id: string; name: string } | null>(null)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  
  // Stats
  const activeCount = users.filter(u => u.status === 'ACTIVE').length
  const inactiveCount = users.filter(u => u.status === 'INACTIVE').length
  
  const stats = [
    { title: 'Total Permanent', value: totalUsers.toString(), icon: Users },
    { title: 'Active', value: activeCount.toString(), icon: CheckCircle },
    { title: 'Inactive', value: inactiveCount.toString(), icon: XCircle },
  ]

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await getAllUsers(page, USERS_PER_PAGE, searchTerm, 'PERMANENT', statusFilter)
      setUsers((response as any).data || [])
      setTotalPages((response as any).pagination?.totalPages || 1)
      setTotalUsers((response as any).pagination?.total || 0)
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      toast.error(error.message || 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, searchTerm, statusFilter])

  const handleAddUser = () => {
    setEditingUser(null)
    setShowUserForm(true)
  }

  const handleEditUser = async (userId: string) => {
    try {
      const response = await getUserById(userId)
      // getUserById already returns response.data, so response.data is the user object
      const userData = response.data || response
      console.log('📝 Editing user:', userData)
      setEditingUser(userData)
      setShowUserForm(true)
    } catch (error: any) {
      console.error('Failed to fetch user:', error)
      toast.error('Failed to load user data')
    }
  }

  const handleUserFormSubmit = async (data: any) => {
    if (!selectedCampusId) {
      toast.error('Please select a campus first')
      return
    }

    setIsSubmitting(true)
    try {
      // Add campusId to data
      const userData = {
        ...data,
        campusId: selectedCampusId
      }

      if (editingUser) {
        await updateUser(editingUser.id, userData)
        toast.success('User updated successfully')
      } else {
        await createUser(userData)
        toast.success('User created successfully')
      }
      setShowUserForm(false)
      setEditingUser(null)
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to save user:', error)
      toast.error(error.message || 'Failed to save user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName })
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    try {
      await deleteUser(userToDelete.id)
      toast.success(`${userToDelete.name} deleted successfully`)
      setUserToDelete(null)
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      toast.error(error.message || 'Failed to delete user')
    }
  }

  const handleToggleStatus = (userId: string, userName: string, currentStatus: string) => {
    setUserToToggle({ id: userId, name: userName, status: currentStatus })
  }

  const confirmToggleStatus = async () => {
    if (!userToToggle) return
    try {
      await toggleUserStatus(userToToggle.id)
      const action = userToToggle.status === 'ACTIVE' ? 'deactivated' : 'activated'
      toast.success(`${userToToggle.name} ${action} successfully`)
      setUserToToggle(null)
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to toggle user status:', error)
      toast.error(error.message || 'Failed to update user status')
    }
  }

  const handleResetPassword = (userId: string, userName: string) => {
    setUserToReset({ id: userId, name: userName })
  }

  const confirmResetPassword = async () => {
    if (!userToReset) return
    setIsResettingPassword(true)
    try {
      await resetUserPassword(userToReset.id)
      toast.success(`Password reset for ${userToReset.name}. New password sent to their email.`)
      setUserToReset(null)
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to reset password:', error)
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permanent Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage permanent user accounts and access control
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowBulkImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={handleAddUser}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Permanent Users</CardTitle>
              <CardDescription>View and manage permanent staff and faculty</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-sm">Name</th>
                  <th className="text-left p-4 font-medium text-sm">Email</th>
                  <th className="text-left p-4 font-medium text-sm">Department</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Last Login</th>
                  <th className="text-right p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No permanent users found
                    </td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                      <td 
                        className="p-4 text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setViewingUserId(user.id)}
                        title="Click to view details"
                      >
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        <Badge variant="outline">{user.department || 'N/A'}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={user.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditUser(user.id)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleResetPassword(user.id, `${user.firstName} ${user.lastName}`)}
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleStatus(user.id, `${user.firstName} ${user.lastName}`, user.status)}
                            title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * USERS_PER_PAGE) + 1} to {Math.min(page * USERS_PER_PAGE, totalUsers)} of {totalUsers} users
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-10 h-10"
                  onClick={() => setPage(pageNum)}
                  disabled={isLoading}
                >
                  {pageNum}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || isLoading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* User Form */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          userType="PERMANENT"
          onSubmit={handleUserFormSubmit}
          onCancel={() => {
            setShowUserForm(false)
            setEditingUser(null)
          }}
          onResetPassword={handleResetPassword}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`}
        variant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />

      {/* Toggle Status Confirmation */}
      <ConfirmDialog
        isOpen={!!userToToggle}
        title={`${userToToggle?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} User`}
        message={`Are you sure you want to ${userToToggle?.status === 'ACTIVE' ? 'deactivate' : 'activate'} "${userToToggle?.name}"?`}
        variant="warning"
        onConfirm={confirmToggleStatus}
        onCancel={() => setUserToToggle(null)}
      />

      {/* Reset Password Confirmation */}
      <ConfirmDialog
        isOpen={!!userToReset}
        title="Reset Password"
        message={`Are you sure you want to reset the password for "${userToReset?.name}"? A new password will be generated and sent to their email. They will be required to change it on next login.`}
        variant="warning"
        isLoading={isResettingPassword}
        onConfirm={confirmResetPassword}
        onCancel={() => setUserToReset(null)}
      />

      {/* User Details Modal */}
      {viewingUserId && (
        <UserDetails 
          userId={viewingUserId} 
          onClose={() => setViewingUserId(null)} 
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkUserImport
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => fetchUsers()}
        />
      )}
    </div>
  )
}
