import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-[#00D9B8] text-[#060B0F] hover:bg-[#00D9B8]/90 font-semibold shadow-[0_0_20px_rgba(0,217,184,0.3)]',
  ghost: 'bg-transparent text-[#94A3B8] hover:bg-white/5 hover:text-white',
  danger: 'bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/30 hover:bg-[#FF6B35]/20',
  outline: 'border border-[#1E3A5F] text-[#94A3B8] hover:border-[#00D9B8]/50 hover:text-[#00D9B8]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-md font-['Outfit'] transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
