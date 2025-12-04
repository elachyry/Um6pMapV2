import { useState, useEffect } from 'react'
import { Plus, Users, Globe, Building2, X, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/useToast'
import { getAllRoles } from '@/api/roleApi'

export default function RoleManagement() {
  const toast = useToast()
  const [roles, setRoles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  /**
   * Fetch roles from API
   * Purpose: Load all roles with permissions
   */
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true)
      try {
        const response = await getAllRoles()
        setRoles(response.data || [])
      } catch (error: any) {
        console.error('Failed to fetch roles:', error)
        toast.error(error.message || 'Failed to load roles')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  /**
   * Get role badge color based on scope and name
   */
  const getRoleBadgeColor = (role: any) => {
    if (role.scope === 'GLOBAL') return 'destructive'
    if (role.name.includes('SuperAdmin')) return 'default'
    if (role.name.includes('Manager')) return 'secondary'
    return 'outline'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions (RBAC)
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            Loading roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            No roles found.
          </div>
        ) : (
          roles.map((role) => (
          <Card 
            key={role.id} 
            className="hover:shadow-lg transition-all cursor-pointer flex flex-col h-full hover:scale-[1.02]"
            onClick={() => setSelectedRole(role)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {role.scope === 'GLOBAL' ? (
                      <Globe className="w-5 h-5 text-red-500" />
                    ) : (
                      <Building2 className="w-5 h-5 text-primary" />
                    )}
                    {role.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{role.description}</CardDescription>
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <Badge variant={getRoleBadgeColor(role) as any} className="text-xs whitespace-nowrap">
                    {role.scope}
                  </Badge>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    <Users className="w-3 h-3 mr-1" />
                    {role.userCount}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col pb-0">
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                  {role.permissions.length} Permissions
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.slice(0, 3).map((permission: any) => (
                    <Badge key={permission.id} variant="outline" className="text-xs">
                      {permission.resource}:{permission.action}
                    </Badge>
                  ))}
                  {role.permissions.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{role.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="mt-4 pt-3 pb-3 border-t bg-background">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
                  </span>
                  {role.isSystem && (
                    <Badge variant="secondary" className="text-xs">
                      System
                    </Badge>
                  )}
                  <span className="text-xs">Click to view details →</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>

      {/* Create New Role */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <Button variant="outline" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Custom Role
          </Button>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>Overview of permissions across all roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-sm">Permission</th>
                  {roles.slice(0, 4).map((role) => (
                    <th key={role.id} className="text-center p-4 font-medium text-sm">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['campus:view', 'building:create', 'event:update', 'user:delete', 'settings:view'].map(
                  (permissionName, index) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4 text-sm">{permissionName}</td>
                      {roles.slice(0, 4).map((role) => (
                        <td key={role.id} className="p-4 text-center">
                          <div className="flex justify-center">
                            <div
                              className={`w-5 h-5 rounded ${
                                role.permissions.some((p: any) => p.name === permissionName)
                                  ? 'bg-green-500'
                                  : 'bg-muted'
                              }`}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Details Modal */}
      {selectedRole && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRole(null)}
        >
          <Card 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b sticky top-0 bg-background z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      {selectedRole.scope === 'GLOBAL' ? (
                        <Globe className="w-6 h-6 text-red-500" />
                      ) : (
                        <Building2 className="w-6 h-6 text-primary" />
                      )}
                      {selectedRole.name}
                    </CardTitle>
                    <Badge variant={getRoleBadgeColor(selectedRole) as any}>
                      {selectedRole.scope}
                    </Badge>
                    {selectedRole.isSystem && (
                      <Badge variant="secondary">System Role</Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {selectedRole.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRole(null)}
                  className="ml-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedRole.permissions.length}</div>
                  <div className="text-sm text-muted-foreground">Permissions</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedRole.userCount}</div>
                  <div className="text-sm text-muted-foreground">Users</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedRole.scope === 'GLOBAL' ? 'All' : '1'}</div>
                  <div className="text-sm text-muted-foreground">Campus{selectedRole.scope === 'GLOBAL' ? 'es' : ''}</div>
                </div>
              </div>

              {/* All Permissions */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  All Permissions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRole.permissions.map((permission: any) => (
                    <div
                      key={permission.id}
                      className="flex items-center gap-2 p-2 rounded border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-mono">
                        {permission.resource}:{permission.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(selectedRole.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{new Date(selectedRole.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
