import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Lock, ExternalLink, CreditCard, Smartphone, Building2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import api from '@/api/axios'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export default function PaymentPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [phase,       setPhase]       = useState('idle')   // idle | opened | verifying | success | failed
  const [checkoutUrl, setCheckoutUrl] = useState(null)

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => api.get(`/reservations/${id}`).then(r => r.data),
  })

  const createLinkMutation = useMutation({
    mutationFn: () => api.post(`/payments/${id}/create-link`),
    onSuccess: res => {
      const url = res.data.checkout_url
      if (url) {
        setCheckoutUrl(url)
        window.open(url, '_blank', 'noopener,noreferrer')
        setPhase('opened')
      } else {
        toast.error('No checkout URL returned. Please try again.')
      }
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create payment link.'),
  })

  const verifyMutation = useMutation({
    mutationFn: () => api.get(`/payments/${id}/status`),
    onSuccess: res => {
      if (res.data.status === 'paid') {
        setPhase('success')
      } else {
        setPhase('failed')
      }
    },
    onError: () => setPhase('failed'),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const r = reservation

  // ── Success state ──────────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-[#27AE60] mb-4" />
        <h1 className="text-2xl font-bold text-[#1C2833] mb-2">Payment Confirmed!</h1>
        <p className="text-[#1C2833] mb-8">Your reservation is now confirmed.</p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link to={`/reservations/${id}/receipt`} replace>
            <Button>View Receipt</Button>
          </Link>
          <Link to="/reservations" replace>
            <Button variant="outline">My Reservations</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Failed / not yet paid ──────────────────────────────────────────────────
  if (phase === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <XCircle className="h-16 w-16 text-[#C0392B] mb-4" />
        <h1 className="text-2xl font-bold text-[#1C2833] mb-2">Payment Not Confirmed</h1>
        <p className="text-[#1C2833] mb-2">Your payment hasn't been recorded yet.</p>
        <p className="text-sm text-[#1C2833] mb-8">
          If you already paid, please wait a moment and try verifying again.
          Otherwise, you can try paying again.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          {checkoutUrl && (
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4" /> Re-open PayMongo
              </Button>
            </a>
          )}
          <Button onClick={() => verifyMutation.mutate()} loading={verifyMutation.isPending}>
            <RefreshCw className="h-4 w-4" /> Verify Again
          </Button>
          <Button variant="outline" onClick={() => setPhase('idle')}>
            Start Over
          </Button>
        </div>
      </div>
    )
  }

  // ── After checkout tab opened ──────────────────────────────────────────────
  if (phase === 'opened') {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="border-l-4 border-[#C0392B] pl-4 mb-6">
          <h1 className="text-2xl font-bold text-[#1C2833]">Complete Your Payment</h1>
        </div>

        <Card className="mb-5 bg-[#EBF5FB] border-[#AED6F1]">
          <CardContent className="py-5">
            <p className="text-sm font-semibold text-[#1A5276] mb-2">PayMongo checkout opened in a new tab</p>
            <p className="text-sm text-[#1A5276]">
              Complete your payment there, then come back here and click <strong>I've Paid</strong> to confirm.
            </p>
            {checkoutUrl && (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#2980B9] hover:underline font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open checkout again
              </a>
            )}
          </CardContent>
        </Card>

        {r && (
          <Card className="mb-5 bg-[#FADBD8]/30 border-[#F1948A]/30">
            <CardContent className="py-4">
              <p className="text-sm font-semibold text-[#1C2833]">{r.facility?.name}</p>
              <p className="text-sm text-[#C0392B] mt-0.5">
                {r.reservation_date}
                {r.start_time && r.end_time && (
                  <> · {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}</>
                )}
              </p>
              <p className="text-3xl font-bold text-[#1C2833] mt-3">
                ₱{Number(r.payment?.amount ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full mb-3"
          size="lg"
          loading={verifyMutation.isPending}
          onClick={() => verifyMutation.mutate()}
        >
          <CheckCircle2 className="h-4 w-4" />
          {verifyMutation.isPending ? 'Verifying…' : "I've Paid — Verify Now"}
        </Button>

        <button
          onClick={() => navigate(-1)}
          className="w-full text-sm text-[#1C2833] hover:text-[#1C2833] py-2 transition-colors"
        >
          Cancel and go back
        </button>
      </div>
    )
  }

  // ── Idle: initial payment page ─────────────────────────────────────────────
  return (
    <div className="p-6 max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[#1C2833] hover:text-[#1C2833] mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="border-l-4 border-[#C0392B] pl-4 mb-1">
        <h1 className="text-2xl font-bold text-[#1C2833]">Complete Payment</h1>
      </div>
      <p className="text-[#1C2833] text-sm mb-6 flex items-center gap-1">
        <Lock className="h-3.5 w-3.5" /> Secured by PayMongo
      </p>

      {/* Order summary */}
      {r && (
        <Card className="mb-5 bg-[#FADBD8]/30 border-[#F1948A]/30">
          <CardContent className="py-5">
            <p className="text-sm font-semibold text-[#1C2833]">{r.facility?.name}</p>
            <p className="text-sm text-[#C0392B] mt-0.5">
              {r.reservation_date}
              {r.start_time && r.end_time && (
                <> · {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}</>
              )}
            </p>
            <p className="text-3xl font-bold text-[#1C2833] mt-3">
              ₱{Number(r.payment?.amount ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Accepted methods */}
      <Card className="mb-5">
        <CardContent className="py-4">
          <p className="text-xs font-semibold text-[#1C2833] uppercase tracking-wide mb-3">Accepted Payment Methods</p>
          <div className="flex flex-wrap gap-3 text-sm text-[#4A4A4A]">
            <span className="flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-[#2980B9]" /> GCash
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-[#8E44AD]" /> Maya
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-[#27AE60]" /> Online Banking
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-[#1C2833]" /> Card
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notice */}
      <div className="mb-5 flex items-start gap-2 bg-[#EBF5FB] border border-[#AED6F1] rounded-lg p-3">
        <ExternalLink className="h-4 w-4 text-[#2980B9] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#1A5276]">
          PayMongo checkout will open in a <strong>new tab</strong>. After paying, return here and click <strong>I've Paid</strong> to confirm your reservation.
        </p>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={createLinkMutation.isPending}
        loading={createLinkMutation.isPending}
        onClick={() => createLinkMutation.mutate()}
      >
        <ExternalLink className="h-4 w-4" />
        {createLinkMutation.isPending ? 'Opening PayMongo…' : 'Pay Now via PayMongo'}
      </Button>

      <p className="text-center text-xs text-[#1C2833] mt-4">
        Your payment is processed securely by PayMongo. CABS does not store your payment details.
      </p>
    </div>
  )
}
