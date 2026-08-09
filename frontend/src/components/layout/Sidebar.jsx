import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Calendar, ClipboardList, CreditCard,
  LogOut, Users, BarChart3,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = {
  client: [
    { to: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/facilities',   label: 'Facilities',      icon: Building2 },
    { to: '/calendar',     label: 'Calendar',        icon: Calendar },
    { to: '/reservations', label: 'My Reservations', icon: ClipboardList },
  ],
  staff: [
    { to: '/staff/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
    { to: '/staff/reservations', label: 'Reservations', icon: ClipboardList },
    { to: '/staff/calendar',     label: 'Calendar',     icon: Calendar },
    { to: '/staff/facilities',   label: 'Facilities',   icon: Building2 },
  ],
  administrator: [
    { to: '/admin/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/admin/reservations', label: 'Reservations',    icon: ClipboardList },
    { to: '/admin/facilities',   label: 'Facilities',      icon: Building2 },
    { to: '/admin/calendar',     label: 'Calendar',        icon: Calendar },
    { to: '/admin/users',        label: 'User Management', icon: Users },
    { to: '/admin/payments',     label: 'Payments',        icon: CreditCard },
    { to: '/admin/analytics',    label: 'Analytics',       icon: BarChart3 },
  ],
}

const COLLAPSED_W = 'w-[56px]'
const EXPANDED_W  = 'w-[220px]'

export default function Sidebar({ mobileOpen, onMobileClose, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('cabs_sidebar_collapsed') === 'true'
  )

  const role     = user?.role ?? 'client'
  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS.client
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  const handleToggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('cabs_sidebar_collapsed', String(next))
    onToggle?.(next)
  }

  const handleLogout = async () => {
    navigate('/login', { replace: true, state: null })
    await logout()
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden cursor-pointer" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen flex flex-col z-40 transition-all duration-300 ease-in-out select-none bg-[#C0392B]',
          collapsed ? COLLAPSED_W : EXPANDED_W,
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >

        {/* Brand header */}
        <div className={cn(
          'flex items-center min-h-[48px] bg-[#A93226] border-b border-[#922B21]',
          collapsed ? 'justify-center px-0' : 'justify-between px-3'
        )}>
          {collapsed ? (
            <button
              onClick={handleToggle}
              className="hidden md:flex flex-col items-center justify-center w-full h-full gap-1 hover:bg-white/10 transition-colors"
            >
              <img src="/cabuyao-icon.png" alt="Cabuyao" className="w-7 h-7 rounded-md object-contain" />
              <ChevronRight className="h-3 w-3 text-white/70" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <img src="/cabuyao-icon.png" alt="Cabuyao" className="w-7 h-7 rounded-md flex-shrink-0 object-contain" />
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm leading-tight">CABS</p>
                  <p className="text-white/60 text-[10px] leading-tight truncate">Reservation System</p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors flex-shrink-0 ml-1"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
            </>
          )}
        </div>

        {/* User info (expanded only) */}
        {!collapsed && (
          <div className="px-3 py-2.5 border-b border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-[10px]">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-xs truncate">{user?.full_name}</p>
                <span className="text-[10px] bg-white/20 text-white font-medium px-1.5 py-0.5 rounded-full capitalize">
                  {role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-hidden py-2 space-y-1', collapsed ? 'px-1' : 'px-2')}>
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={['dashboard'].some(s => item.to.endsWith(s)) || item.to === '/dashboard'}
                onClick={onMobileClose}
                className={({ isActive }) => cn(
                  'flex items-center rounded-lg transition-all duration-150 group relative',
                  collapsed
                    ? 'justify-center p-2'
                    : 'gap-3 px-3 py-2 border-l-[3px]',
                  isActive
                    ? collapsed
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'bg-white/20 text-white font-semibold border-l-[3px] border-white shadow-sm'
                    : collapsed
                      ? 'text-white/80 hover:bg-white/10 hover:text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white border-l-[3px] border-transparent'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-[#1C2833] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                    {item.label}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div className={cn('border-t border-white/20 py-2', collapsed ? 'px-1' : 'px-2')}>
          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-150 group relative',
              collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#1C2833] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
