import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  Calendar,
  QrCode,
  Shield,
  Route,
  Map,
  CalendarCheck,
  Database,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const navigationSections = [
  {
    items: [
      { name: 'sidebar.dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'sidebar.events', href: '/events', icon: Calendar },
      { name: 'sidebar.qrCodes', href: '/qr-codes', icon: QrCode },
    ]
  },
  {
    title: 'sidebar.userManagement',
    items: [
      { name: 'sidebar.temporaryUsers', href: '/temporary-users', icon: Users },
      { name: 'sidebar.permanentUsers', href: '/permanent-users', icon: UserCheck },
      { name: 'sidebar.accessRequests', href: '/access-requests', icon: ClipboardList },
      { name: 'sidebar.roleManagement', href: '/roles', icon: Shield },
    ]
  },
  {
    title: 'sidebar.operations',
    items: [
      { name: 'sidebar.routeGeneration', href: '/route-generation', icon: Route },
      { name: 'sidebar.mapManagement', href: '/map-management', icon: Map },
      { name: 'sidebar.reservations', href: '/reservations', icon: CalendarCheck },
    ]
  },
  {
    title: 'sidebar.system',
    items: [
      { name: 'sidebar.databaseBackup', href: '/database-backup', icon: Database },
      { name: 'sidebar.campusManagement', href: '/campus', icon: Building2 },
    ]
  },
]

interface SidebarProps {
  isCollapsed: boolean
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileActiveSection, setMobileActiveSection] = useState('')

  // Update dropdown when route changes
  useEffect(() => {
    setMobileActiveSection(location.pathname)
  }, [location.pathname])

  return (
    <>
      {/* Mobile Dropdown - Only visible on mobile */}
      <div className="md:hidden fixed top-12 left-0 right-0 z-30 bg-background border-b border-border p-2">
        <select
          value={mobileActiveSection}
          onChange={(e) => {
            const newPath = e.target.value
            setMobileActiveSection(newPath)
            navigate(newPath)
          }}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm font-medium"
        >
          <option value="">Select Page...</option>
          {navigationSections.map((section) => 
            section.items.map((item) => (
              <option key={item.href} value={item.href}>
                {t(item.name)}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Sidebar - Desktop only */}
      <aside
        className={cn(
          'hidden md:block fixed top-14 bottom-0 left-0 z-40 bg-card border-r border-border transition-all duration-300 ease-in-out overflow-hidden',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className={cn('flex-1 overflow-y-auto py-2', isCollapsed ? 'px-1' : 'px-3')}>
            {navigationSections.map((section, sectionIdx) => (
              <div key={sectionIdx} className={cn(sectionIdx > 0 && 'mt-3 pt-3 border-t border-border')}>
                {/* Section Title */}
                {section.title && !isCollapsed && (
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t(section.title)}
                  </div>
                )}
                
                {/* Section Items */}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center rounded-lg text-sm font-normal transition-all duration-150 group relative',
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-foreground hover:bg-accent/50',
                          isCollapsed 
                            ? 'justify-center w-14 h-14 mx-auto' 
                            : 'gap-6 px-3 py-2.5'
                        )
                      }
                      title={isCollapsed ? t(item.name) : ''}
                    >
                      <item.icon className={cn('flex-shrink-0', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
                      {!isCollapsed && (
                        <span className="whitespace-nowrap">
                          {t(item.name)}
                        </span>
                      )}
                      
                      {/* Tooltip when collapsed */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground rounded-md shadow-xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 text-sm">
                          {t(item.name)}
                        </div>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className={cn('border-t border-border', isCollapsed ? 'hidden' : 'p-4')}>
            {!isCollapsed && (
              <div className="text-xs text-muted-foreground text-center">
                {t('common.copyright')}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
