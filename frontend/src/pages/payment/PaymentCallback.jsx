import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import api from '@/api/axios'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const reservationId  = searchParams.get('reservation_id')

  const [status,      setStatus]      = useState('loading')
  const [reservation, setReservation] = useState(null)

  useEffect(() => {
    if (!reservationId) {
      setStatus('failed')
      return
    }

    api.get(`/payments/${reservationId}/status`)
      .then(res => {
        setReservation(res.data.reservation)
        setStatus(res.data.status === 'paid' ? 'success' : 'failed')
      })
      .catch(() => setStatus('failed'))
  }, [reservationId])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="lg" />
        <p className="text-gray-500">Verifying your payment…</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-2">Your reservation has been confirmed.</p>
        {reservation?.payment?.receipt_number && (
          <p className="text-sm text-gray-400 mb-8">
            Receipt: <strong className="text-gray-700">{reservation.payment.receipt_number}</strong>
          </p>
        )}
        <div className="flex gap-3 flex-wrap justify-center">
          {reservationId && (
            <Link to={`/reservations/${reservationId}/receipt`}>
              <Button>View Receipt</Button>
            </Link>
          )}
          <Link to="/reservations">
            <Button variant="outline">My Reservations</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <XCircle className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
      <p className="text-gray-500 mb-8">
        Your payment could not be processed. Please try again.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        {reservationId && (
          <Link to={`/reservations/${reservationId}/payment`}>
            <Button>Try Again</Button>
          </Link>
        )}
        <Link to="/reservations">
          <Button variant="outline">My Reservations</Button>
        </Link>
      </div>
    </div>
  )
}
