import { Outlet } from 'react-router-dom'
import { useState, createContext, useContext, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

const SidebarContext = createContext({ 
  isCollapsed: false, 
  setIsCollapsed: (_: boolean) => {},
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: (_: boolean) => {}
})

export const useSidebar = () => useContext(SidebarContext)

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }}>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        <Sidebar isCollapsed={isCollapsed} />
        
        {/* Main Content - Responsive padding */}
        <div className={`transition-all duration-300 ${
          isMobile ? 'pt-[104px]' : 'pt-14'
        } ${
          isMobile ? 'pl-0' : (isCollapsed ? 'pl-20' : 'pl-64')
        }`}>
          <main className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-full overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
