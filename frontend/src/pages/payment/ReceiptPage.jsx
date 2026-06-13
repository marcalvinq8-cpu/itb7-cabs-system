import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, Download } from 'lucide-react'
import api from '@/api/axios'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export default function ReceiptPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const { data: reservation, isLoading, error } = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => api.get(`/reservations/${id}`).then(r => r.data),
  })

  const downloadPdf = () => {
    api.get(`/receipts/${id}`, { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
        const a   = document.createElement('a')
        a.href     = url
        a.download = `CABS-receipt-${reservation?.payment?.receipt_number || id}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => toast.error('Failed to download receipt.'))
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  if (error || !reservation) {
    return <div className="p-6 text-center text-red-500">Receipt not found.</div>
  }

  const r = reservation

  const duration = r.start_time && r.end_time
    ? (new Date(`2000-01-01T${r.end_time}`) - new Date(`2000-01-01T${r.start_time}`)) / 3_600_000
    : null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/reservations', { replace: true })}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="border-l-4 border-[#C0392B] pl-4">
            <h1 className="text-2xl font-bold text-[#1C2833]">Official Receipt</h1>
          </div>
          {r.payment?.receipt_number && (
            <p className="text-gray-400 text-sm mt-0.5 font-mono">{r.payment.receipt_number}</p>
          )}
        </div>
        <Button variant="outline" onClick={downloadPdf}>
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>

      <Card>
        {/* Header band */}
        <div className="bg-[#C0392B] text-white px-6 py-5 rounded-t-xl">
          <p className="font-bold text-lg">Cabuyao Athletes Basic School</p>
          <p className="text-white/70 text-sm">CABS Online Reservation System</p>
        </div>

        <CardContent className="space-y-6 pt-6">
          {/* Client */}
          {r.user && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Billed To</h3>
              <p className="font-semibold text-gray-900">{r.user.full_name}</p>
              <p className="text-sm text-gray-500">{r.user.email}</p>
              {r.user.contact_number && (
                <p className="text-sm text-gray-500">{r.user.contact_number}</p>
              )}
            </section>
          )}

          <div className="border-t border-gray-100" />

          {/* Booking */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Booking Details</h3>
            <dl className="space-y-2 text-sm">
              {[
                ['Reservation ID', `#${r.id}`],
                ['Facility',       r.facility?.name],
                ['Location',       r.facility?.location],
                ['Date',           r.reservation_date ? format(parseISO(r.reservation_date), 'MMMM d, yyyy') : '—'],
                ['Time',           r.start_time && r.end_time ? `${r.start_time.slice(0, 5)} – ${r.end_time.slice(0, 5)}` : '—'],
                ['Duration',       duration != null ? `${duration} hour${duration !== 1 ? 's' : ''}` : '—'],
                ['Participants',   r.number_of_participants],
                ['Purpose',        r.purpose],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <dt className="text-gray-400 w-36 shrink-0">{label}</dt>
                  <dd className="text-gray-900 font-medium">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="border-t border-gray-100" />

          {/* Payment */}
          {r.payment && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Payment Details</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Method',    r.payment.payment_method ?? '—'],
                  ['Status',    r.payment.status?.toUpperCase()],
                  ['Paid At',   r.payment.paid_at ? format(parseISO(r.payment.paid_at), 'MMMM d, yyyy h:mm a') : '—'],
                  ['Receipt #', r.payment.receipt_number ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt className="text-gray-400 w-36 shrink-0">{label}</dt>
                    <dd className="text-gray-900 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-900 text-sm">Total Amount Paid</span>
                <span className="text-2xl font-bold text-[#C0392B]">
                  ₱{Number(r.payment.amount).toLocaleString()}
                </span>
              </div>
            </section>
          )}

          <p className="text-center text-xs text-gray-400 pt-2 border-t border-gray-100">
            Thank you for booking with CABS. Please keep this receipt for your records.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
