import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import api from '@/api/axios'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'

const STEPS = ['Schedule', 'Details', 'Terms', 'Review']

const TERMS = [
  {
    heading: '1. Reservation Policy',
    body: 'All reservations are subject to availability and must be approved by CABS administration. A booking is only confirmed after approval and full payment of the booking fee.',
  },
  {
    heading: '2. Payment',
    body: 'Full payment is required to confirm your booking. Accepted methods include GCash, Maya, and online banking. Payment must be completed within 24 hours of approval or the reservation may be forfeited.',
  },
  {
    heading: '3. Cancellation & Refund',
    body: 'Cancellations made before payment are free of charge. Once payment has been made, no refunds will be issued. CABS reserves the right to cancel any reservation for maintenance or emergency situations.',
  },
  {
    heading: '4. Facility Use Rules',
    body: 'Users must maintain cleanliness and order within the facility. No food or beverages inside courts unless specified. Participants must wear appropriate athletic attire and footwear.',
  },
  {
    heading: '5. Liability',
    body: 'CABS is not liable for any injury, loss, or damage incurred during the use of the facilities. Users are responsible for any damage caused to the facilities or equipment.',
  },
  {
    heading: '6. Compliance',
    body: 'All users must comply with CABS rules and regulations. Non-compliance may result in immediate termination of the reservation without refund and may affect future booking privileges.',
  },
]

const fmt12 = t => {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function NewReservationModal({ onClose, preselectedFacility = '' }) {
  const queryClient = useQueryClient()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    facility_id:            preselectedFacility || '',
    reservation_date:       '',
    start_time:             '',
    end_time:               '',
    purpose:                '',
    number_of_participants: '',
    selected_amenities:     [],
  })
  const [errors,  setErrors]  = useState({})
  const [agreed,  setAgreed]  = useState(false)

  const { data: facilities = [], isLoading: loadingFacilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => api.get('/facilities').then(r => r.data),
    select: data => data.filter(f => f.status === 'available'),
    enabled: !preselectedFacility,
  })

  const { data: facilityDetail } = useQuery({
    queryKey: ['facility', form.facility_id],
    queryFn: () => api.get(`/facilities/${form.facility_id}`).then(r => r.data),
    enabled: Boolean(form.facility_id),
  })

  const { data: bookedSlots = [] } = useQuery({
    queryKey: ['availability', form.facility_id, form.reservation_date],
    queryFn: () =>
      api.get(`/facilities/${form.facility_id}/availability`, {
        params: { date: form.reservation_date },
      }).then(r => r.data),
    enabled: Boolean(form.facility_id && form.reservation_date),
  })

  const mutation = useMutation({
    mutationFn: data => api.post('/reservations', data),
    onSuccess: () => {
      toast.success('Reservation submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      onClose()
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to submit reservation.'),
  })

  const setField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const toggleAmenity = id => {
    setForm(f => ({
      ...f,
      selected_amenities: f.selected_amenities.includes(id)
        ? f.selected_amenities.filter(x => x !== id)
        : [...f.selected_amenities, id],
    }))
  }

  const hasConflict = () => {
    if (!form.start_time || !form.end_time) return false
    return bookedSlots.some(s => form.start_time < s.end_time && form.end_time > s.start_time)
  }

  const validateStep0 = () => {
    const errs = {}
    if (!form.facility_id)      errs.facility_id      = 'Please select a facility.'
    if (!form.reservation_date) errs.reservation_date = 'Please select a date.'
    if (!form.start_time)       errs.start_time       = 'Please enter a start time.'
    if (!form.end_time)         errs.end_time         = 'Please enter an end time.'
    if (form.start_time && form.end_time && form.start_time >= form.end_time)
      errs.end_time = 'End time must be after start time.'
    if (hasConflict())
      errs.start_time = 'This time slot conflicts with an existing booking.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep1 = () => {
    const errs = {}
    if (!form.purpose.trim()) errs.purpose = 'Please describe the purpose.'
    const n = Number(form.number_of_participants)
    if (!form.number_of_participants || n < 1) errs.number_of_participants = 'Participants must be at least 1.'
    if (facilityDetail?.capacity && n > facilityDetail.capacity)
      errs.number_of_participants = `Exceeds facility capacity of ${facilityDetail.capacity}.`
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    if (!agreed) {
      setErrors({ agreed: 'You must agree to the terms before proceeding.' })
      return false
    }
    return true
  }

  const goNext = () => {
    if (step === 0 && !validateStep0()) return
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }

  const submit = () => {
    mutation.mutate({
      facility_id:            Number(form.facility_id),
      reservation_date:       form.reservation_date,
      start_time:             form.start_time,
      end_time:               form.end_time,
      purpose:                form.purpose,
      number_of_participants: Number(form.number_of_participants),
      selected_amenities:     form.selected_amenities,
      terms_acknowledged:     true,
    })
  }

  const today          = new Date().toISOString().split('T')[0]
  const activeFacility = facilityDetail

  const durationHours = form.start_time && form.end_time
    ? (new Date(`2000-01-01T${form.end_time}`) - new Date(`2000-01-01T${form.start_time}`)) / 3_600_000
    : 0

  const estimatedCost = durationHours > 0 && activeFacility
    ? durationHours * Number(activeFacility.price_per_hour)
    : 0

  const footer = (
    <div className="flex justify-between items-center">
      {step > 0 ? (
        <Button variant="outline" onClick={() => setStep(s => s - 1)}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
      ) : (
        <div />
      )}
      {step < STEPS.length - 1 ? (
        <Button onClick={goNext}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={submit} loading={mutation.isPending} disabled={mutation.isPending}>
          Submit Reservation
        </Button>
      )}
    </div>
  )

  return (
    <Modal title="New Reservation" onClose={onClose} size="2xl" footer={footer}>

      {/* Stepper */}
      <div className="flex items-center mb-6">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
              i <= step ? 'bg-[#C0392B] text-white' : 'bg-[#F2F3F4] text-[#717D7E]'
            }`}>
              {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`ml-1.5 text-xs font-medium hidden sm:inline ${i <= step ? 'text-[#C0392B]' : 'text-[#717D7E]'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-[#C0392B]' : 'bg-[#E5E7E9]'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">

        {/* ── Step 0: Schedule ── */}
        {step === 0 && (
          <>
            {!preselectedFacility ? (
              <div>
                <Label>Facility *</Label>
                {loadingFacilities ? (
                  <div className="mt-1"><Spinner size="sm" /></div>
                ) : (
                  <select
                    value={form.facility_id}
                    onChange={e => setField('facility_id', e.target.value)}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FADBD8] focus:border-[#C0392B] bg-white ${
                      errors.facility_id ? 'border-[#C0392B]' : 'border-[#E5E7E9]'
                    }`}
                  >
                    <option value="">— Select a facility —</option>
                    {facilities.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} — ₱{Number(f.price_per_hour).toLocaleString()}/hr
                      </option>
                    ))}
                  </select>
                )}
                {errors.facility_id && <p className="text-red-500 text-xs mt-1">{errors.facility_id}</p>}
              </div>
            ) : (
              activeFacility && (
                <div className="flex items-center gap-3 p-3 bg-[#FADBD8]/30 rounded-lg border border-[#F1948A]/30">
                  <div className="flex-1">
                    <p className="font-medium text-[#1C2833]">{activeFacility.name}</p>
                    <p className="text-sm text-[#C0392B]">₱{Number(activeFacility.price_per_hour).toLocaleString()}/hr</p>
                  </div>
                  <Badge status={activeFacility.status} />
                </div>
              )
            )}

            <div>
              <Label>Date *</Label>
              <Input type="date" min={today} value={form.reservation_date}
                onChange={e => setField('reservation_date', e.target.value)}
                error={!!errors.reservation_date} className="mt-1" />
              {errors.reservation_date && <p className="text-red-500 text-xs mt-1">{errors.reservation_date}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input type="time" value={form.start_time}
                  onChange={e => setField('start_time', e.target.value)}
                  error={!!errors.start_time} className="mt-1" />
                {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>}
              </div>
              <div>
                <Label>End Time *</Label>
                <Input type="time" value={form.end_time}
                  onChange={e => setField('end_time', e.target.value)}
                  error={!!errors.end_time} className="mt-1" />
                {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>}
              </div>
            </div>

            {durationHours > 0 && activeFacility && (
              <div className="p-3 bg-[#EAFAF1] rounded-lg border border-[#A9DFBF] text-sm">
                <span className="text-[#1E8449] font-medium">
                  Duration: {durationHours}h — Estimated Cost: ₱{estimatedCost.toLocaleString()}
                </span>
              </div>
            )}

            {bookedSlots.length > 0 && (
              <div className="p-3 bg-[#FEF9E7] rounded-lg border border-[#F9E79F] text-sm">
                <p className="font-semibold text-[#B7950B] mb-2">Already booked on this date:</p>
                <ul className="space-y-1">
                  {bookedSlots.map((s, i) => (
                    <li key={i} className="text-[#B7950B]">
                      {fmt12(s.start_time)} – {fmt12(s.end_time)}
                      <span className="ml-2 capitalize text-[#F39C12]">({s.status})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <>
            <div>
              <Label>Purpose of Use *</Label>
              <textarea
                rows={3}
                value={form.purpose}
                onChange={e => setField('purpose', e.target.value)}
                placeholder="e.g. Basketball practice, team training, school event…"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FADBD8] focus:border-[#C0392B] resize-none ${
                  errors.purpose ? 'border-[#C0392B]' : 'border-[#E5E7E9]'
                }`}
              />
              {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
            </div>

            <div>
              <Label>
                Number of Participants *
                {facilityDetail?.capacity && (
                  <span className="text-gray-400 font-normal ml-1">(max {facilityDetail.capacity})</span>
                )}
              </Label>
              <Input type="number" min={1} max={facilityDetail?.capacity}
                value={form.number_of_participants}
                onChange={e => setField('number_of_participants', e.target.value)}
                error={!!errors.number_of_participants} className="mt-1" placeholder="e.g. 10" />
              {errors.number_of_participants && <p className="text-red-500 text-xs mt-1">{errors.number_of_participants}</p>}
            </div>

            {facilityDetail?.amenities?.filter(a => a.is_available).length > 0 && (
              <div>
                <Label>Amenities (optional)</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {facilityDetail.amenities.filter(a => a.is_available).map(a => (
                    <label key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="rounded border-[#E5E7E9] text-[#C0392B] h-4 w-4"
                        checked={form.selected_amenities.includes(a.id)}
                        onChange={() => toggleAmenity(a.id)} />
                      <div>
                        <span className="text-sm text-gray-700 font-medium">{a.name}</span>
                        <span className="text-xs text-gray-400 ml-1">×{a.quantity}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Terms & Conditions ── */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-[#C0392B]" />
              <h3 className="font-semibold text-[#1C2833]">Terms and Conditions</h3>
            </div>
            <p className="text-xs text-[#717D7E] mb-3">Please read and accept the terms before submitting your reservation.</p>

            <div className="border border-[#E5E7E9] rounded-lg divide-y divide-[#F2F3F4] max-h-56 overflow-y-auto">
              {TERMS.map(({ heading, body }) => (
                <div key={heading} className="px-4 py-3">
                  <h4 className="text-xs font-semibold text-gray-900 mb-0.5">{heading}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer mt-3 transition-colors ${
              agreed ? 'bg-[#EAFAF1] border-[#A9DFBF]' : 'bg-[#FADBD8]/20 border-[#F1948A]/30'
            }`}>
              <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); setErrors({}) }}
                className="mt-0.5 h-4 w-4 rounded border-[#E5E7E9] text-[#C0392B] shrink-0" />
              <span className="text-sm text-gray-700">
                I have read and agree to the Terms and Conditions. I understand that payment is required
                to confirm my reservation, and that cancellations after payment are non-refundable.
              </span>
            </label>
            {errors.agreed && <p className="text-red-500 text-xs mt-1">{errors.agreed}</p>}
          </>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Review Your Reservation</h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden text-sm">
              {[
                ['Facility',     activeFacility?.name],
                ['Date',         form.reservation_date],
                ['Time',         form.start_time && form.end_time ? `${fmt12(form.start_time)} – ${fmt12(form.end_time)}` : '—'],
                ['Duration',     durationHours > 0 ? `${durationHours}h` : '—'],
                ['Est. Cost',    estimatedCost > 0 ? `₱${estimatedCost.toLocaleString()}` : '—'],
                ['Purpose',      form.purpose],
                ['Participants', form.number_of_participants],
                ['Amenities',
                  form.selected_amenities.length > 0
                    ? facilityDetail?.amenities?.filter(a => form.selected_amenities.includes(a.id)).map(a => a.name).join(', ')
                    : 'None',
                ],
                ['Terms',        <span key="t" className="text-[#27AE60] font-medium">Accepted</span>],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-4 py-2.5">
                  <span className="font-medium text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-gray-900">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#717D7E] bg-[#FADBD8]/20 p-3 rounded-lg border border-[#F1948A]/20">
              After submission, your reservation will be <strong>pending admin approval</strong>.
              Once approved, you can proceed directly to payment.
            </p>
          </div>
        )}

      </div>
    </Modal>
  )
}
