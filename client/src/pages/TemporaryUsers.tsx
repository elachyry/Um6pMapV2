import { useState } from 'react'
import { Users, UserPlus, Upload, Download, Search, MoreVertical, Clock } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const stats = [
  { title: 'Total Temporary', value: '1,234', icon: Users },
  { title: 'Active', value: '856', icon: Users },
  { title: 'Pending', value: '234', icon: Clock },
  { title: 'Expired', value: '144', icon: Clock },
]

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', expiryDate: '2024-12-31', accessDays: 45 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'pending', expiryDate: '2024-12-15', accessDays: 30 },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', status: 'expired', expiryDate: '2024-11-20', accessDays: 0 },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'active', expiryDate: '2024-12-25', accessDays: 60 },
  { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', status: 'active', expiryDate: '2025-01-10', accessDays: 90 },
]

export default function TemporaryUsers() {
  const [searchTerm, setSearchTerm] = useState('')

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
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button>
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
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 text-sm font-medium">{user.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          user.status === 'active'
                            ? 'success'
                            : user.status === 'pending'
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{user.expiryDate}</td>
                    <td className="p-4 text-sm">{user.accessDays} days</td>
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
