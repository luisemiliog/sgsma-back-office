import { type InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-['JetBrains_Mono'] text-[#94A3B8] uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full bg-[#0D1520] border rounded-md px-3 py-2.5
          text-white font-['Outfit'] text-sm placeholder:text-[#475569]
          transition-all duration-150 outline-none
          ${error
            ? 'border-[#FF6B35]/50 focus:border-[#FF6B35] focus:shadow-[0_0_0_2px_rgba(255,107,53,0.15)]'
            : 'border-[#1E3A5F] focus:border-[#00D9B8]/60 focus:shadow-[0_0_0_2px_rgba(0,217,184,0.1)]'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-[#FF6B35] font-['JetBrains_Mono']">{error}</span>
      )}
    </div>
  )
)

Input.displayName = 'Input'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-['JetBrains_Mono'] text-[#94A3B8] uppercase tracking-widest">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={4}
        className={`
          w-full bg-[#0D1520] border rounded-md px-3 py-2.5
          text-white font-['Outfit'] text-sm placeholder:text-[#475569] resize-none
          transition-all duration-150 outline-none
          ${error
            ? 'border-[#FF6B35]/50 focus:border-[#FF6B35]'
            : 'border-[#1E3A5F] focus:border-[#00D9B8]/60 focus:shadow-[0_0_0_2px_rgba(0,217,184,0.1)]'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-[#FF6B35] font-['JetBrains_Mono']">{error}</span>
      )}
    </div>
  )
)

Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-['JetBrains_Mono'] text-[#94A3B8] uppercase tracking-widest">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full bg-[#0D1520] border rounded-md px-3 py-2.5
          text-white font-['Outfit'] text-sm
          transition-all duration-150 outline-none
          ${error
            ? 'border-[#FF6B35]/50'
            : 'border-[#1E3A5F] focus:border-[#00D9B8]/60'
          }
          ${className}
        `}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-[#FF6B35] font-['JetBrains_Mono']">{error}</span>
      )}
    </div>
  )
)

Select.displayName = 'Select'
