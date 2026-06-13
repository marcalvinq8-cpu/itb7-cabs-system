import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ClipboardList, Banknote,
  Clock, CheckCircle2, Users, Building2, AlertCircle, Trophy,
} from 'lucide-react'
import api from '@/api/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'

export default function AdminDashboard() {
  const { user } = useAuth()

  const { data: summary, isLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'summary'],
    queryFn: () => api.get('/admin/analytics/summary').then(r => r.data),
  })
  const { data: revenue = [] } = useQuery({
    queryKey: ['admin', 'analytics', 'revenue'],
    queryFn: () => api.get('/admin/analytics/revenue').then(r => r.data),
  })
  const { data: utilization = [] } = useQuery({
    queryKey: ['admin', 'analytics', 'utilization'],
    queryFn: () => api.get('/admin/analytics/utilization').then(r => r.data),
  })
  const { data: trends = [] } = useQuery({
    queryKey: ['admin', 'analytics', 'trends'],
    queryFn: () => api.get('/admin/analytics/trends').then(r => r.data),
  })

  const hour          = new Date().getHours()
  const greeting      = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayLabel    = format(new Date(), 'EEEE, MMMM d, yyyy')

  const totalRevenue  = summary?.total_revenue_this_month ?? 0
  const prevRevenue   = revenue.length >= 2 ? (revenue[revenue.length - 2]?.revenue ?? 0) : 0
  const revenueChange = prevRevenue > 0
    ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
    : 0

  const pendingCount  = summary?.pending_reservations ?? 0

  const facilityData  = utilization.slice(0, 5).map(u => ({
    name:  u.facility?.length > 14 ? u.facility.slice(0, 14) + '…' : u.facility,
    count: u.count,
  }))

  const kpis = [
    {
      label: 'Reservations This Month',
      value: summary?.total_reservations_this_month ?? 0,
      icon:  ClipboardList,
      badge: 'text-[#2980B9] bg-[#D6EAF8]',
      top:   'border-t-4 border-t-[#2980B9]',
    },
    {
      label: 'Revenue This Month',
      value: `₱${Number(totalRevenue).toLocaleString()}`,
      icon:  Banknote,
      badge: 'text-[#1E8449] bg-[#EAFAF1]',
      top:   'border-t-4 border-t-[#1E8449]',
      sub:   revenueChange !== 0
        ? { icon: revenueChange > 0 ? TrendingUp : TrendingDown, text: `${revenueChange > 0 ? '+' : ''}${revenueChange}% vs last month`, positive: revenueChange > 0 }
        : null,
    },
    {
      label: 'Pending Requests',
      value: pendingCount,
      icon:  Clock,
      badge: pendingCount > 0 ? 'text-[#C0392B] bg-[#FADBD8]' : 'text-[#F39C12] bg-[#FEF9E7]',
      top:   pendingCount > 0 ? 'border-t-4 border-t-[#C0392B]' : 'border-t-4 border-t-[#F39C12]',
      link:  '/admin/reservations',
    },
    {
      label: 'Confirmed Today',
      value: summary?.confirmed_today ?? 0,
      icon:  CheckCircle2,
      badge: 'text-[#27AE60] bg-[#D5F5E3]',
      top:   'border-t-4 border-t-[#27AE60]',
    },
    {
      label: 'Total Clients',
      value: summary?.total_clients ?? 0,
      icon:  Users,
      badge: 'text-[#8E44AD] bg-[#F5EEF8]',
      top:   'border-t-4 border-t-[#8E44AD]',
      link:  '/admin/users',
    },
    {
      label: 'Total Facilities',
      value: summary?.total_facilities ?? 0,
      icon:  Building2,
      badge: 'text-[#C0392B] bg-[#FADBD8]',
      top:   'border-t-4 border-t-[#C0392B]',
      link:  '/admin/facilities',
    },
  ]

  if (isLoading) return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Skeleton className="h-72 lg:col-span-3 rounded-xl" />
        <Skeleton className="h-72 lg:col-span-2 rounded-xl" />
      </div>
      <Skeleton className="h-52 rounded-xl" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#922B21] px-6 py-5 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-white/70 text-sm font-medium">{greeting},</p>
            <h1 className="text-2xl font-bold mt-0.5">{user?.full_name ?? 'Administrator'}</h1>
            <p className="text-white/60 text-xs mt-1">{todayLabel}</p>
          </div>
          {summary?.most_reserved_facility && (
            <div className="flex items-center gap-2.5 bg-white/15 rounded-xl px-4 py-2.5 backdrop-blur-sm border border-white/20 shrink-0">
              <Trophy className="h-5 w-5 text-yellow-300 shrink-0" />
              <div>
                <p className="text-white/70 text-[10px] uppercase tracking-wide font-semibold">Top Facility</p>
                <p className="text-white font-semibold text-sm">{summary.most_reserved_facility.name}</p>
                <p className="text-white/60 text-[10px]">{summary.most_reserved_facility.count} bookings</p>
              </div>
            </div>
          )}
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-2 w-28 h-28 rounded-full bg-white/5" />
      </div>

      {/* ── Pending alert ── */}
      {pendingCount > 0 && (
        <Link to="/admin/reservations">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#FEF9E7] border border-[#F9E79F] rounded-xl hover:bg-[#FDF2D0] transition-colors cursor-pointer">
            <AlertCircle className="h-5 w-5 text-[#F39C12] shrink-0" />
            <p className="text-sm text-[#B7950B] font-medium flex-1">
              <span className="font-bold">{pendingCount} reservation{pendingCount > 1 ? 's' : ''}</span> waiting for your approval
            </p>
            <span className="text-xs text-[#B7950B] font-semibold underline underline-offset-2">Review →</span>
          </div>
        </Link>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(({ label, value, icon: Icon, badge, top, sub, link }) => {
          const inner = (
            <Card key={label} className={`${top} hover:shadow-md transition-shadow`}>
              <CardContent className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#717D7E] font-medium leading-tight">{label}</p>
                    <p className="text-2xl font-bold text-[#1C2833] mt-1.5 leading-none">{value}</p>
                    {sub && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium mt-1.5 ${sub.positive ? 'text-[#27AE60]' : 'text-[#C0392B]'}`}>
                        <sub.icon className="h-3 w-3" />
                        {sub.text}
                      </span>
                    )}
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${badge}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
          return link
            ? <Link to={link} key={label}>{inner}</Link>
            : <div key={label}>{inner}</div>
        })}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Area chart — Reservations Over Time */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1C2833]">Reservations Over Time</CardTitle>
              <p className="text-[11px] text-[#717D7E] mt-0.5">Daily bookings this week</p>
            </div>
            <span className="text-[11px] text-[#717D7E] border border-[#E5E7E9] px-2 py-0.5 rounded-full">This Week</span>
          </CardHeader>
          <CardContent className="pt-2">
            {trends.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-[#717D7E] text-sm gap-2">
                <ClipboardList className="h-8 w-8 opacity-20" />
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#C0392B" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#C0392B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F4" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#717D7E' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#717D7E' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7E9', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    cursor={{ stroke: '#C0392B', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="count" name="Bookings" stroke="#C0392B" strokeWidth={2.5}
                    fill="url(#redGrad)" dot={{ fill: '#C0392B', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#C0392B' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar chart — Most Used Facilities */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1C2833]">Most Used Facilities</CardTitle>
              <p className="text-[11px] text-[#717D7E] mt-0.5">Last 30 days</p>
            </div>
            <span className="text-[11px] text-[#717D7E] border border-[#E5E7E9] px-2 py-0.5 rounded-full">30 Days</span>
          </CardHeader>
          <CardContent className="pt-2">
            {facilityData.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-[#717D7E] text-sm gap-2">
                <Building2 className="h-8 w-8 opacity-20" />
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={facilityData} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#717D7E' }} axisLine={false} tickLine={false}
                    angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: '#717D7E' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7E9', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    cursor={{ fill: '#FADBD8', opacity: 0.5 }}
                  />
                  <Bar dataKey="count" name="Bookings" fill="#C0392B" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue Overview ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-1">
          <div>
            <CardTitle className="text-sm font-semibold text-[#1C2833]">Revenue Overview</CardTitle>
            <p className="text-[11px] text-[#717D7E] mt-0.5">Monthly collected payments</p>
          </div>
          <span className="text-[11px] text-[#717D7E] border border-[#E5E7E9] px-2 py-0.5 rounded-full">12 Months</span>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex gap-8 items-center">
            <div className="flex-shrink-0 min-w-[140px] space-y-1">
              <p className="text-xs text-[#717D7E]">Total This Month</p>
              <p className="text-3xl font-bold text-[#1C2833]">₱{Number(totalRevenue).toLocaleString()}</p>
              {revenueChange !== 0 && (
                <p className={`text-xs flex items-center gap-1 font-medium ${revenueChange > 0 ? 'text-[#27AE60]' : 'text-[#C0392B]'}`}>
                  {revenueChange > 0
                    ? <TrendingUp className="h-3.5 w-3.5" />
                    : <TrendingDown className="h-3.5 w-3.5" />}
                  {revenueChange > 0 ? '+' : ''}{revenueChange}% from last month
                </p>
              )}
            </div>
            <div className="flex-1">
              {revenue.length === 0 ? (
                <div className="h-36 flex flex-col items-center justify-center text-[#717D7E] text-sm gap-2">
                  <Banknote className="h-8 w-8 opacity-20" />
                  No revenue data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={revenue} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#27AE60" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F4" vertical={false} />
                    <XAxis dataKey="month_label" tick={{ fontSize: 10, fill: '#717D7E' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#717D7E' }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={v => [`₱${Number(v).toLocaleString()}`, 'Revenue']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7E9', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#27AE60" strokeWidth={2.5}
                      dot={false} activeDot={{ r: 5, fill: '#27AE60' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
