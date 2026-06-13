import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { NotificationProvider } from '@/context/NotificationContext'
import { cn } from '@/lib/utils'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('cabs_sidebar_collapsed') === 'true'
  )

  return (
    <NotificationProvider>
      <div className="min-h-screen flex bg-[#FADBD8]">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onToggle={setCollapsed}
        />
        <div
          className={cn(
            'flex-1 min-w-0 flex flex-col min-h-screen transition-[margin] duration-300',
            collapsed ? 'md:ml-[56px]' : 'md:ml-[220px]'
          )}
          style={{ '--sidebar-w': collapsed ? '56px' : '220px' }}
        >
          <header className={cn(
            'fixed top-0 right-0 z-20 bg-white border-b border-[#FADBD8] shadow-sm transition-[left] duration-300',
            collapsed ? 'left-0 md:left-[56px]' : 'left-0 md:left-[220px]'
          )}>
            <Navbar onMobileMenu={() => setMobileOpen(v => !v)} />
          </header>
          <div className="h-16 lg:h-[107px] shrink-0" />
          <main
            className="flex-1 min-w-0 min-h-screen relative"
            style={{ backgroundImage: 'url(/bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
          >
            <div className="absolute inset-0 bg-white/70" />
            <div className="relative z-10 p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}
