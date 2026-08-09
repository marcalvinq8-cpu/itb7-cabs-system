import { cn } from '@/lib/utils'

const statusMap = {
  pending:           'bg-[#FEF9E7] text-[#B7950B] border-[#F9E79F]',
  approved:          'bg-[#D6EAF8] text-[#1A5276] border-[#AED6F1]',
  confirmed:         'bg-[#EAFAF1] text-[#1E8449] border-[#A9DFBF]',
  completed:         'bg-[#EAFAF1] text-[#1E8449] border-[#A9DFBF]',
  rejected:          'bg-[#FADBD8] text-[#96281B] border-[#F1948A]',
  cancelled:         'bg-[#F2F3F4] text-[#1C2833] border-[#E5E7E9]',
  paid:              'bg-[#EAFAF1] text-[#1E8449] border-[#A9DFBF]',
  failed:            'bg-[#FADBD8] text-[#96281B] border-[#F1948A]',
  expired:           'bg-[#F2F3F4] text-[#1C2833] border-[#E5E7E9]',
  available:         'bg-[#EAFAF1] text-[#1E8449] border-[#A9DFBF]',
  under_maintenance: 'bg-[#FEF9E7] text-[#B7950B] border-[#F9E79F]',
  unavailable:       'bg-[#FADBD8] text-[#96281B] border-[#F1948A]',
  closed:            'bg-[#F2F3F4] text-[#1C2833] border-[#E5E7E9]',
  administrator:     'bg-[#E8DAEF] text-[#6C3483] border-[#C39BD3]',
  staff:             'bg-[#D6EAF8] text-[#1A5276] border-[#AED6F1]',
  client:            'bg-[#F2F3F4] text-[#1C2833] border-[#E5E7E9]',
}
const labels = { under_maintenance: 'Maintenance' }

export default function Badge({ status, className }) {
  const style = statusMap[status] ?? 'bg-[#F2F3F4] text-[#1C2833] border-[#E5E7E9]'
  const label = labels[status] ?? (status?.replace(/_/g, ' ') ?? 'Unknown')
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize', style, className)}>
      {label}
    </span>
  )
}
