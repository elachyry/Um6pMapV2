import { useState } from 'react'
import { ClipboardList, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const stats = [
  { title: 'Total Requests', value: '342', icon: ClipboardList },
  { title: 'Accepted', value: '234', icon: CheckCircle },
  { title: 'Pending', value: '87', icon: Clock },
  { title: 'Rejected', value: '21', icon: XCircle },
]

const mockRequests = [
  { id: 1, name: 'David Miller', email: 'david@guest.com', purpose: 'Conference Attendance', date: '2024-11-24', status: 'pending' },
  { id: 2, name: 'Lisa Anderson', email: 'lisa@guest.com', purpose: 'Research Collaboration', date: '2024-11-23', status: 'pending' },
  { id: 3, name: 'Tom Harris', email: 'tom@guest.com', purpose: 'Campus Tour', date: '2024-11-22', status: 'accepted' },
  { id: 4, name: 'Nina Patel', email: 'nina@guest.com', purpose: 'Guest Lecture', date: '2024-11-21', status: 'accepted' },
  { id: 5, name: 'Carlos Rodriguez', email: 'carlos@guest.com', purpose: 'Workshop Participation', date: '2024-11-20', status: 'rejected' },
]

export default function AccessRequests() {
  const [filter, setFilter] = useState<string>('all')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Requests</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage guest access requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border">
        {['all', 'pending', 'accepted', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>Review and approve/reject access requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{request.name}</h3>
                    <Badge
                      variant={
                        request.status === 'accepted'
                          ? 'success'
                          : request.status === 'pending'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{request.email}</p>
                  <p className="text-sm">
                    <span className="font-medium">Purpose:</span> {request.purpose}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested on {request.date}
                  </p>
                </div>
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button size="sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
