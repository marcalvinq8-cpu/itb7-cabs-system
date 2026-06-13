import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'

const variants = {
  info:    { wrapper: 'bg-blue-50 border-blue-200 text-blue-800',   Icon: Info },
  success: { wrapper: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle2 },
  warning: { wrapper: 'bg-yellow-50 border-yellow-200 text-yellow-800', Icon: AlertCircle },
  error:   { wrapper: 'bg-red-50 border-red-200 text-red-800',       Icon: XCircle },
}

export default function Alert({ variant = 'info', title, children, className }) {
  const { wrapper, Icon } = variants[variant] ?? variants.info

  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', wrapper, className)}>
      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}
