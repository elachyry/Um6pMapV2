import { Calendar, Plus, Activity, CheckCircle, Clock } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const stats = [
  { title: 'Total Events', value: '156', icon: Calendar },
  { title: 'Happening Now', value: '8', icon: Activity },
  { title: 'Upcoming', value: '42', icon: Clock },
  { title: 'Completed', value: '106', icon: CheckCircle },
]

const mockEvents = [
  {
    id: 1,
    title: 'Annual Tech Conference 2024',
    date: '2024-12-15',
    time: '09:00 AM',
    location: 'Main Auditorium',
    attendees: 350,
    status: 'upcoming',
  },
  {
    id: 2,
    title: 'AI Research Symposium',
    date: '2024-11-24',
    time: '02:00 PM',
    location: 'Building A, Hall 3',
    attendees: 120,
    status: 'happening',
  },
  {
    id: 3,
    title: 'Student Orientation Day',
    date: '2024-11-20',
    time: '10:00 AM',
    location: 'Campus Grounds',
    attendees: 500,
    status: 'completed',
  },
  {
    id: 4,
    title: 'Faculty Meeting',
    date: '2024-12-01',
    time: '03:00 PM',
    location: 'Conference Room B',
    attendees: 45,
    status: 'upcoming',
  },
  {
    id: 5,
    title: 'Hackathon Weekend',
    date: '2024-12-10',
    time: '08:00 AM',
    location: 'Innovation Lab',
    attendees: 200,
    status: 'upcoming',
  },
]

export default function Events() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage campus events and schedules
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <Badge
                  variant={
                    event.status === 'happening'
                      ? 'success'
                      : event.status === 'upcoming'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {event.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>{event.date} at {event.time}</span>
              </div>
              <div className="flex items-center text-sm">
                <Activity className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>{event.attendees} attendees</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Event Button at Bottom */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <Button variant="outline" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add New Event
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
