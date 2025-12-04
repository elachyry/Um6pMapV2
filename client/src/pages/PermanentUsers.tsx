import { useState } from 'react'
import { Users, UserPlus, Download, Search, MoreVertical, CheckCircle, XCircle } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const stats = [
  { title: 'Total Permanent', value: '1,309', icon: Users },
  { title: 'Active', value: '1,156', icon: CheckCircle },
  { title: 'Inactive', value: '153', icon: XCircle },
]

const mockUsers = [
  { id: 1, name: 'Dr. Ahmed Hassan', email: 'ahmed.hassan@um6p.ma', role: 'Professor', status: 'active', lastLogin: '2024-11-24' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah.j@um6p.ma', role: 'Admin', status: 'active', lastLogin: '2024-11-23' },
  { id: 3, name: 'Mohamed Ali', email: 'mohamed.a@um6p.ma', role: 'Staff', status: 'inactive', lastLogin: '2024-10-15' },
  { id: 4, name: 'Emily Chen', email: 'emily.c@um6p.ma', role: 'Researcher', status: 'active', lastLogin: '2024-11-24' },
  { id: 5, name: 'Omar Benali', email: 'omar.b@um6p.ma', role: 'Professor', status: 'active', lastLogin: '2024-11-22' },
]

export default function PermanentUsers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers] = useState<number[]>([])

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
          <Button>
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
              {selectedUsers.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Activate
                  </Button>
                  <Button variant="outline" size="sm">
                    Deactivate
                  </Button>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-sm w-12">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="text-left p-4 font-medium text-sm">Name</th>
                  <th className="text-left p-4 font-medium text-sm">Email</th>
                  <th className="text-left p-4 font-medium text-sm">Role</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Last Login</th>
                  <th className="text-right p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="p-4 text-sm font-medium">{user.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <Badge variant="outline">{user.role}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{user.lastLogin}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
