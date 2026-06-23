'use client'

import { ChevronDown } from 'lucide-react'

type Option = { value: string; label: string }

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  icon?: React.ReactNode
  accentColor?: 'cyan' | 'coral' | 'emerald' | 'amber'
  className?: string
  disabled?: boolean
}

const accentFocusMap = {
  cyan: 'focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10',
  coral: 'focus:border-alert-coral focus:ring-4 focus:ring-alert-coral/10',
  emerald: 'focus:border-cashflow-emerald focus:ring-4 focus:ring-cashflow-emerald/10',
  amber: 'focus:border-neon-amber focus:ring-4 focus:ring-neon-amber/10',
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  icon,
  accentColor = 'cyan',
  className = '',
  disabled = false,
}: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-gray">
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full bg-cosmic-midnight border border-white/10 rounded-xl px-4 py-3 text-polar-white focus:outline-none appearance-none transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed ${accentFocusMap[accentColor]} ${icon ? 'pl-11' : ''}`}
      >
        {placeholder && (
          <option value="" disabled className="bg-cosmic-midnight text-muted-gray">{placeholder}</option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-cosmic-midnight text-polar-white">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-gray">
        <ChevronDown size={16} />
      </div>
    </div>
  )
}
