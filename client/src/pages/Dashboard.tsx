import { Users, UserCheck, ClipboardList, Calendar, TrendingUp, Activity } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const stats = [
  { title: 'Total Users', value: '2,543', icon: Users, trend: { value: 12, isPositive: true } },
  { title: 'Active Events', value: '42', icon: Calendar, trend: { value: 8, isPositive: true } },
  { title: 'Pending Requests', value: '127', icon: ClipboardList, trend: { value: -5, isPositive: false } },
  { title: 'Monthly Growth', value: '24.5%', icon: TrendingUp, trend: { value: 3, isPositive: true } },
]

const userActivityData = [
  { name: 'Mon', users: 400 },
  { name: 'Tue', users: 300 },
  { name: 'Wed', users: 600 },
  { name: 'Thu', users: 800 },
  { name: 'Fri', users: 500 },
  { name: 'Sat', users: 200 },
  { name: 'Sun', users: 100 },
]

const eventData = [
  { name: 'Jan', events: 40 },
  { name: 'Feb', events: 30 },
  { name: 'Mar', events: 45 },
  { name: 'Apr', events: 50 },
  { name: 'May', events: 49 },
  { name: 'Jun', events: 60 },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to UM6P Admin Dashboard. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Daily active users this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Events Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Events Trend</CardTitle>
            <CardDescription>Monthly events over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={eventData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across all systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { user: 'John Doe', action: 'created a new event', time: '2 minutes ago', icon: Calendar },
              { user: 'Sarah Smith', action: 'approved access request', time: '15 minutes ago', icon: UserCheck },
              { user: 'Mike Johnson', action: 'added 50 temporary users', time: '1 hour ago', icon: Users },
              { user: 'Emma Wilson', action: 'generated QR codes', time: '2 hours ago', icon: Activity },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <activity.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
