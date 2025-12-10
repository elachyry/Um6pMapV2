import { useState, useEffect } from 'react'
import { Users, UserPlus, Upload, Download, Search, MoreVertical, Clock, Edit, Trash2, Power, ChevronLeft, ChevronRight } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UserForm } from '@/components/UserForm'
import { BulkTemporaryUserImport } from '@/components/BulkTemporaryUserImport'
import { useToast } from '@/hooks/useToast'
import { useCampusStore } from '@/stores/campusStore'
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus } from '@/api/userApi'
import { getActiveCampuses } from '@/api/campusApi'

const USERS_PER_PAGE = 12

export default function TemporaryUsers() {
  const { toast } = useToast()
  const { selectedCampusId } = useCampusStore()
  
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [showUserForm, setShowUserForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null)
  const [userToToggle, setUserToToggle] = useState<{ id: string; name: string; status: string } | null>(null)
  const [campuses, setCampuses] = useState<any[]>([])
  
  // Stats
  const activeCount = users.filter(u => u.status === 'ACTIVE').length
  const pendingCount = users.filter(u => u.status === 'PENDING').length
  const expiredCount = users.filter(u => {
    if (!u.endDate) return false
    return new Date(u.endDate) < new Date()
  }).length
  
  const stats = [
    { title: 'Total Temporary', value: totalUsers.toString(), icon: Users },
    { title: 'Active', value: activeCount.toString(), icon: Users },
    { title: 'Pending', value: pendingCount.toString(), icon: Clock },
    { title: 'Expired', value: expiredCount.toString(), icon: Clock },
  ]

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await getAllUsers(page, USERS_PER_PAGE, searchTerm, 'TEMPORARY', statusFilter)
      setUsers((response as any).data || [])
      setTotalPages((response as any).pagination?.totalPages || 1)
      setTotalUsers((response as any).pagination?.total || 0)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch campuses
  const fetchCampuses = async () => {
    try {
      const response = await getActiveCampuses()
      setCampuses((response as any).data || [])
    } catch (error) {
      console.error('Failed to fetch campuses:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, searchTerm, statusFilter])

  useEffect(() => {
    fetchCampuses()
  }, [])

  const handleAddUser = () => {
    setEditingUser(null)
    setShowUserForm(true)
  }

  const handleEditUser = async (userId: string) => {
    try {
      const user = await getUserById(userId)
      setEditingUser(user)
      setShowUserForm(true)
    } catch (error: any) {
      console.error('Failed to fetch user:', error)
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
      setUserToDelete(null)
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleToggleStatus = (userId: string, userName: string, currentStatus: string) => {
    setUserToToggle({ id: userId, name: userName, status: currentStatus })
  }

  const confirmToggleStatus = async () => {
    if (!userToToggle) return
    try {
      await toggleUserStatus(userToToggle.id)
      setUserToToggle(null)
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to toggle status:', error)
    }
  }

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Temporary Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage temporary user accounts with time-limited access
          </p>
        </div>
        <div className="flex gap-2">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Temporary Users</CardTitle>
              <CardDescription>View and manage temporary user accounts</CardDescription>
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
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
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
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Expiry Date</th>
                  <th className="text-left p-4 font-medium text-sm">Access Days</th>
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
                      No temporary users found
                    </td>
                  </tr>
                ) : (
                  users.map((user: any) => {
                    const daysRemaining = user.endDate ? calculateDaysRemaining(user.endDate) : 0
                    const isExpired = daysRemaining < 0
                    
                    return (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-4 text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="p-4">
                          <Badge
                            variant={
                              user.status === 'ACTIVE'
                                ? 'success'
                                : user.status === 'PENDING'
                                ? 'warning'
                                : 'destructive'
                            }
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">
                          {user.endDate ? new Date(user.endDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-sm">
                          {isExpired ? (
                            <span className="text-destructive">Expired</span>
                          ) : (
                            `${daysRemaining} days`
                          )}
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalUsers > 0 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * USERS_PER_PAGE) + 1} to {Math.min(page * USERS_PER_PAGE, totalUsers)} of {totalUsers} users
          </p>
          
          {totalPages > 1 && (
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
          )}
        </div>
      )}

      {/* User Form */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          userType="TEMPORARY"
          onSubmit={handleUserFormSubmit}
          onCancel={() => {
            setShowUserForm(false)
            setEditingUser(null)
          }}
          isLoading={isSubmitting}
          campuses={campuses}
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

      {/* Bulk Import */}
      {showBulkImport && (
        <BulkTemporaryUserImport
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            setShowBulkImport(false)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}
