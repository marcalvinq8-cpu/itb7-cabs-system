import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'block w-full rounded-lg border px-3 py-2 text-sm',
        'bg-white placeholder-gray-400 text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
        error
          ? 'border-red-400 focus:ring-red-400'
          : 'border-gray-300',
        className
      )}
      {...props}
    />
  )
})

export default Input
