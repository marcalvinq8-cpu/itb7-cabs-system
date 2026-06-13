import { cn } from '@/lib/utils'

export default function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse bg-gray-200 rounded-lg', className)} />
  )
}
