import { CalendarCheck, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const stats = [
  { title: 'Total Reservations', value: '234', icon: CalendarCheck },
  { title: 'Approved', value: '189', icon: CheckCircle },
  { title: 'Pending', value: '32', icon: Clock },
  { title: 'Rejected', value: '13', icon: XCircle },
]

const mockReservations = [
  {
    id: 1,
    location: 'Conference Room A',
    user: 'Dr. Ahmed Hassan',
    date: '2024-11-25',
    time: '10:00 AM - 12:00 PM',
    purpose: 'Faculty Meeting',
    status: 'pending',
  },
  {
    id: 2,
    location: 'Auditorium',
    user: 'Sarah Johnson',
    date: '2024-11-28',
    time: '02:00 PM - 05:00 PM',
    purpose: 'Student Presentation',
    status: 'approved',
  },
  {
    id: 3,
    location: 'Lab 3',
    user: 'Mohamed Ali',
    date: '2024-11-26',
    time: '09:00 AM - 11:00 AM',
    purpose: 'Research Experiment',
    status: 'approved',
  },
]

export default function Reservations() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground mt-2">
            Manage space reservations and approvals
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reservations</CardTitle>
          <CardDescription>Review and manage space reservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{reservation.location}</h3>
                    <Badge
                      variant={
                        reservation.status === 'approved'
                          ? 'success'
                          : reservation.status === 'pending'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {reservation.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Reserved by: <span className="font-medium">{reservation.user}</span>
                  </p>
                  <p className="text-sm">
                    {reservation.date} | {reservation.time}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Purpose: {reservation.purpose}
                  </p>
                </div>
                {reservation.status === 'pending' && (
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
