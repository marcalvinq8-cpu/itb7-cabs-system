import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import Spinner from './Spinner'

const variants = {
  primary:   'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary-pale',
  secondary: 'bg-white text-primary border border-primary hover:bg-primary-pale focus-visible:ring-primary-pale',
  danger:    'bg-primary-light text-white hover:bg-primary-dark focus-visible:ring-primary-pale',
  outline:   'border border-neutral-border bg-white text-neutral-dark hover:bg-neutral-light focus-visible:ring-neutral-border',
  ghost:     'text-neutral-muted hover:bg-neutral-light focus-visible:ring-neutral-border',
  info:      'bg-accent text-white hover:bg-accent-dark focus-visible:ring-accent-light',
}
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}
const Button = forwardRef(function Button({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) {
  return (
    <button ref={ref} disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
})
export default Button
