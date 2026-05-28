interface Props {
  label: string
  variant?: 'cyan' | 'orange' | 'slate' | 'green' | 'yellow'
}

const variants = {
  cyan: 'bg-[#00D9B8]/10 text-[#00D9B8] border-[#00D9B8]/20',
  orange: 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20',
  slate: 'bg-white/5 text-[#94A3B8] border-white/10',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

export function Badge({ label, variant = 'slate' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider border ${variants[variant]}`}
    >
      {label}
    </span>
  )
}
