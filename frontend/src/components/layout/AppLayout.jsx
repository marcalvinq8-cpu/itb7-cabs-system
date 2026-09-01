import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { NotificationProvider } from '@/context/NotificationContext'

export default function AppLayout() {
  return (
    <NotificationProvider>
      <div className="min-h-screen flex flex-col bg-[#FADBD8]">
        <header className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-[#FADBD8] shadow-sm">
          <Navbar />
        </header>
        {/* Matches the fixed header's total height (title row + nav-tabs row),
            which is now the same at every breakpoint since the nav row is no
            longer hidden below lg (there's no sidebar to fall back on for nav). */}
        <div className="h-[107px] shrink-0" />
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
    </NotificationProvider>
  )
}
