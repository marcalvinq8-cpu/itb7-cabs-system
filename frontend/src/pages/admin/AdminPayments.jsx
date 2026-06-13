import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Banknote, CheckCircle2, Clock, CreditCard, XCircle, Search } from 'lucide-react'
import api from '@/api/axios'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Input from '@/components/ui/Input'

const STATUS_BORDER = {
  paid:      'border-l-[#27AE60]',
  pending:   'border-l-[#F39C12]',
  failed:    'border-l-[#C0392B]',
  cancelled: 'border-l-[#95A5A6]',
  rejected:  'border-l-[#C0392B]',
}

const METHOD_LABEL = {
  gcash:   'GCash',
  paymaya: 'Maya',
  dob:     'BDO Online',
  card:    'Card',
  unknown: '—',
}

function avatarColor(name = '') {
  const colors = ['bg-[#C0392B]','bg-[#2980B9]','bg-[#27AE60]','bg-[#8E44AD]','bg-[#E67E22]','bg-[#16A085]']
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function AdminPayments() {
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => api.get('/admin/payments').then(r => r.data),
  })

  const payments = data?.data ?? data ?? []

  const filtered = payments.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q || (
      p.receipt_number?.toLowerCase().includes(q) ||
      p.reservation?.user?.full_name?.toLowerCase().includes(q) ||
      p.reservation?.facility?.name?.toLowerCase().includes(q)
    )
    return matchStatus && matchSearch
  })

  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const countPaid      = payments.filter(p => p.status === 'paid').length
  const countPending   = payments.filter(p => p.status === 'pending').length
  const countFailed    = payments.filter(p => p.status === 'failed').length
  const countCancelled = payments.filter(p => p.status === 'cancelled').length
  const countRejected  = payments.filter(p => p.status === 'rejected').length

  if (isLoading) return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-10 w-72 rounded-lg" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="border-l-4 border-[#C0392B] pl-4">
        <h1 className="text-2xl font-bold text-[#1C2833]">Payments</h1>
        <p className="text-[#717D7E] text-sm mt-0.5">All payment transactions and collection summary</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `₱${totalPaid.toLocaleString()}`,      icon: Banknote,      color: 'text-[#1E8449] bg-[#EAFAF1]' },
          { label: 'Paid',           value: countPaid,                              icon: CheckCircle2,  color: 'text-[#27AE60] bg-[#D5F5E3]' },
          { label: 'Pending',        value: countPending,                           icon: Clock,         color: 'text-[#F39C12] bg-[#FEF9E7]' },
          { label: 'Rejected / Cancelled', value: countRejected + countCancelled,   icon: XCircle,       color: 'text-[#C0392B] bg-[#FADBD8]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-[#1C2833]">{value}</p>
              <p className="text-xs text-[#717D7E] mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {['all', 'paid', 'pending', 'rejected', 'cancelled', 'failed'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#C0392B] text-white border-[#C0392B]'
                  : 'bg-white text-[#717D7E] border-[#E5E7E9] hover:bg-[#FADBD8]/20'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search receipt, client, or facility…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm w-72"
          />
        </div>
      </div>

      {/* Payment list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
              <Banknote className="h-10 w-10 opacity-30" />
              <p className="text-sm">No payments found.</p>
            </div>
          ) : (
            <div>
              {/* Column headers */}
              <div className="grid grid-cols-12 px-5 py-3 bg-[#FADBD8]/40 text-xs font-semibold text-[#96281B] uppercase tracking-wide border-b border-[#E5E7E9]">
                <div className="col-span-4">Client / Facility</div>
                <div className="col-span-2">Receipt</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Method</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-1 text-right">Status</div>
              </div>

              <div className="divide-y divide-[#E5E7E9]">
                {filtered.map(p => {
                  const name   = p.reservation?.user?.full_name ?? ''
                  const border = STATUS_BORDER[p.status] ?? 'border-l-gray-300'
                  const method = METHOD_LABEL[p.payment_method] ?? p.payment_method ?? '—'

                  return (
                    <div
                      key={p.id}
                      className={`grid grid-cols-12 items-center px-5 py-4 border-l-4 ${border} hover:bg-[#FADBD8]/10 transition-colors gap-2`}
                    >
                      {/* Avatar + client */}
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${avatarColor(name)}`}>
                          {initials(name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1C2833] truncate">{name || '—'}</p>
                          <p className="text-xs text-[#717D7E] truncate">{p.reservation?.facility?.name ?? '—'}</p>
                        </div>
                      </div>

                      {/* Receipt */}
                      <div className="col-span-2 min-w-0">
                        <p className="text-xs font-mono text-[#1C2833] truncate">{p.receipt_number ?? '—'}</p>
                      </div>

                      {/* Amount */}
                      <div className="col-span-2">
                        <p className="text-sm font-bold text-[#1E8449]">₱{Number(p.amount).toLocaleString()}</p>
                      </div>

                      {/* Method */}
                      <div className="col-span-2">
                        <p className="text-sm text-[#1C2833] flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {method}
                        </p>
                      </div>

                      {/* Date */}
                      <div className="col-span-1">
                        <p className="text-xs text-[#1C2833]">
                          {p.paid_at ? format(parseISO(p.paid_at), 'MMM d, yyyy') : '—'}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="col-span-1 flex justify-end">
                        <Badge status={p.status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
