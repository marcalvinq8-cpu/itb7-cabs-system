import { useState, useRef, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, CalendarDays, Clock, CheckCircle2, XCircle } from 'lucide-react'
import api from '@/api/axios'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const STATUS_COLORS = {
  pending:   '#F39C12',
  approved:  '#2980B9',
  confirmed: '#27AE60',
  cancelled: '#717D7E',
  rejected:  '#C0392B',
}

const LEGEND = [
  { label: 'Pending',   color: '#F39C12', desc: 'Awaiting approval' },
  { label: 'Approved',  color: '#2980B9', desc: 'Approved, awaiting payment' },
  { label: 'Confirmed', color: '#27AE60', desc: 'Paid and confirmed' },
  { label: 'Cancelled', color: '#717D7E', desc: 'Cancelled' },
  { label: 'Rejected',  color: '#C0392B', desc: 'Rejected' },
]

export default function CalendarPage({ adminView = false }) {
  const navigate = useNavigate()
  const calRef = useRef()
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [selectedStatus, setSelectedStatus] = useState('all')

  const { data: rawEvents = [], refetch, isFetching } = useQuery({
    queryKey: ['calendar', adminView ? 'admin' : 'client', dateRange],
    queryFn: async () => {
      if (!dateRange.start) return []
      const params = { start: dateRange.start, end: dateRange.end }
      if (adminView) params.view = 'admin'
      const res = await api.get('/calendar/events', { params })
      setLastUpdated(new Date())
      return res.data ?? []
    },
    enabled: !!dateRange.start,
    refetchInterval: 60_000,
  })

  const events = rawEvents
    .filter(e => selectedStatus === 'all' || e.extendedProps?.status === selectedStatus)
    .map(e => ({
      ...e,
      backgroundColor: e.backgroundColor ?? STATUS_COLORS[e.extendedProps?.status] ?? '#717D7E',
      borderColor:     e.borderColor     ?? STATUS_COLORS[e.extendedProps?.status] ?? '#717D7E',
      textColor:       '#FFFFFF',
    }))

  const handleDatesSet = useCallback((info) => {
    setDateRange({ start: info.startStr.slice(0,10), end: info.endStr.slice(0,10) })
  }, [])

  const handleEventClick = (info) => {
    const { reservationId, status, type } = info.event.extendedProps ?? {}
    if (type === 'maintenance') return
    if (!reservationId) return
    if (adminView) {
      navigate(`/admin/reservations`)
    } else {
      if (status === 'approved') navigate(`/reservations/${reservationId}/terms`)
      else if (status === 'confirmed') navigate(`/reservations/${reservationId}/receipt`)
      else navigate(`/reservations/${reservationId}`)
    }
  }

  const handleDateClick = (info) => {
    if (adminView) return
    navigate(`/reservations/new?date=${info.dateStr}`)
  }

  const totalEvents     = rawEvents.length
  const pendingCount    = rawEvents.filter(e => e.extendedProps?.status === 'pending').length
  const confirmedCount  = rawEvents.filter(e => e.extendedProps?.status === 'confirmed').length
  const rejectedCount   = rawEvents.filter(e => ['rejected','cancelled'].includes(e.extendedProps?.status)).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="border-l-4 border-[#C0392B] pl-4">
          <h1 className="text-2xl font-bold text-[#1C2833]">
            {adminView ? 'Reservations Calendar' : 'My Calendar'}
          </h1>
          <p className="text-[#1C2833] text-sm mt-0.5">
            {adminView ? 'View and manage all bookings on the calendar' : 'Track your upcoming reservations'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-sm border border-[#E5E7E9] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C0392B] bg-white text-[#1C2833]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events',  value: totalEvents,    icon: CalendarDays,  color: 'text-[#2980B9] bg-[#D6EAF8]' },
          { label: 'Pending',       value: pendingCount,   icon: Clock,         color: 'text-[#F39C12] bg-[#FEF9E7]' },
          { label: 'Confirmed',     value: confirmedCount, icon: CheckCircle2,  color: 'text-[#27AE60] bg-[#D5F5E3]' },
          { label: 'Cancelled / Rejected', value: rejectedCount, icon: XCircle, color: 'text-[#C0392B] bg-[#FADBD8]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-[#1C2833]">{value}</p>
              <p className="text-xs text-[#1C2833] mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {LEGEND.map(l => (
          <button
            key={l.label}
            onClick={() => setSelectedStatus(selectedStatus === l.label.toLowerCase() ? 'all' : l.label.toLowerCase())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              selectedStatus === l.label.toLowerCase()
                ? 'text-white border-transparent'
                : 'bg-white text-[#1C2833] border-[#E5E7E9] hover:border-gray-300'
            }`}
            style={selectedStatus === l.label.toLowerCase() ? { backgroundColor: l.color, borderColor: l.color } : {}}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selectedStatus === l.label.toLowerCase() ? 'white' : l.color }} />
            {l.label}
            <span className="text-[10px] opacity-70 hidden sm:inline">— {l.desc}</span>
          </button>
        ))}
        {selectedStatus !== 'all' && (
          <button
            onClick={() => setSelectedStatus('all')}
            className="px-3 py-1.5 rounded-full border border-[#E5E7E9] bg-white text-xs text-[#1C2833] hover:bg-gray-50"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Calendar card */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E5E7E9] flex items-center justify-between bg-[#FADBD8]/30">
          <p className="text-sm font-semibold text-[#1C2833]">
            {adminView ? 'All Reservations' : 'My Bookings'}
          </p>
          <p className="text-xs text-[#1C2833]">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {isFetching && <span className="ml-1 text-[#C0392B]">· Refreshing…</span>}
          </p>
        </div>
        <CardContent className="p-5">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left:   'prev,next today',
              center: 'title',
              right:  'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            dayMaxEvents={3}
            eventDisplay="block"
            nowIndicator
          />
        </CardContent>
      </Card>

      <style>{`
        .fc-button-primary { background-color: #C0392B !important; border-color: #96281B !important; border-radius: 8px !important; font-size: 0.8rem !important; }
        .fc-button-primary:hover { background-color: #96281B !important; }
        .fc-button-primary:not(:disabled).fc-button-active,
        .fc-button-primary:not(:disabled):active { background-color: #96281B !important; }
        .fc-today-button:disabled { background-color: #F1948A !important; border-color: #F1948A !important; }
        .fc-daygrid-day.fc-day-today { background-color: #FADBD8 !important; }
        .fc .fc-toolbar-title { color: #1C2833; font-size: 1.1rem; font-weight: 700; }
        .fc-col-header-cell-cushion { color: #717D7E; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .fc-daygrid-day-number { color: #1C2833; font-size: 0.8rem; }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background-color: #C0392B; color: white; border-radius: 50%;
          width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
        }
        .fc-event { border-radius: 6px !important; font-size: 0.72rem !important; padding: 1px 4px !important; }
        .fc-toolbar { margin-bottom: 1rem !important; }
        .fc-list-event:hover td { background-color: #FADBD8 !important; }
      `}</style>
    </div>
  )
}
