import { Moon, Sun, Bell, Search, User, Languages, Menu, LogOut, Wifi } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import { useTranslation } from 'react-i18next'
import { useSidebar } from './Layout'
import { getActiveCampuses } from '@/api/campusApi'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function Header() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const { selectedCampusId, setSelectedCampusId } = useCampusStore()
  const { t, i18n } = useTranslation()
  const { isCollapsed, setIsCollapsed } = useSidebar()
  
  const [campuses, setCampuses] = useState<Array<{ id: string; name: string }>>([])
  
  // WebSocket connection for real-time status (optional)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const WS_URL = API_BASE_URL.replace('/api', '') + '/ws'
  
  const { isConnected } = useWebSocket({
    url: WS_URL,
    reconnectInterval: 10000, // Retry every 10 seconds instead of 3
    onConnect: () => {
      console.log('✓ WebSocket connected')
    },
    onDisconnect: () => {
      // Silently handle disconnect - it's optional
    },
    onMessage: (data) => {
      // Handle WebSocket messages (heartbeat, etc.)
      if (data.type === 'heartbeat') {
        // Silently handle heartbeat
      }
    },
  })
  
  useEffect(() => {
    loadCampuses()
  }, [])
  
  const loadCampuses = async () => {
    try {
      const response = await getActiveCampuses()
      setCampuses(response.data || [])
      // Set first campus as default if none selected
      if (!selectedCampusId && response.data && response.data.length > 0) {
        setSelectedCampusId(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to load campuses:', error)
    }
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  return (
    <header className="sticky top-0 z-30 h-12 sm:h-14 bg-background border-b border-border">
      <div className="flex items-center justify-between h-full px-2 sm:px-4 gap-1 sm:gap-2 md:gap-4">
        {/* Left - Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger - Desktop only for sidebar toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-accent transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Logo - responsive size */}
          <div className="flex items-center gap-2">
            <img 
              src="/um6p-logo.png" 
              alt="UM6P Logo" 
              className="h-6 sm:h-8 w-auto flex-shrink-0"
            />
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center flex-1">
            <div className="relative flex-1">
              <input
                type="search"
                placeholder={t('header.search')}
                className="w-full h-10 pl-4 pr-12 rounded-l-full border border-border bg-transparent focus:outline-none focus:border-primary dark:bg-zinc-900/50"
              />
              <button className="absolute right-0 top-0 h-10 px-6 border-l border-border hover:bg-accent rounded-r-full transition-colors">
                <Search className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
          {/* Connection Status - Compact on mobile */}
          <div 
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: isConnected ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)'
            }}
            title={isConnected ? 'Connected to backend' : 'Disconnected from backend'}
          >
            <Wifi className="w-3 h-3" />
            <span className="hidden lg:inline">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          {/* Campus Selector - Hidden on mobile */}
          <select
            value={selectedCampusId || ''}
            onChange={(e) => setSelectedCampusId(e.target.value)}
            className="h-9 sm:h-10 px-2 sm:px-3 pr-6 sm:pr-8 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-xs sm:text-sm font-medium min-w-[100px] sm:min-w-[140px] hidden md:block"
          >
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
          
          {/* Language Switcher - Icon only on mobile */}
          <button
            onClick={toggleLanguage}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
            title={`${i18n.language === 'en' ? 'Français' : 'English'}`}
          >
            <Languages className="w-4 h-4" />
            <span className="text-xs font-semibold ml-0.5 hidden lg:inline">{i18n.language.toUpperCase()}</span>
          </button>

          {/* Theme toggle - Smaller on mobile */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
            title={theme === 'dark' ? t('header.switchToLight') : t('header.switchToDark')}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Notifications - hidden on mobile */}
          <button className="hidden lg:flex w-10 h-10 items-center justify-center rounded-full hover:bg-accent transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full" />
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative group">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName || user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={async () => {
                    await logout()
                    navigate('/login')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
