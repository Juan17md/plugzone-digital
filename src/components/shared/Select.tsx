'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

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

const accentBorderMap = {
  cyan: 'border-electric-cyan/50 ring-4 ring-electric-cyan/10',
  coral: 'border-alert-coral/50 ring-4 ring-alert-coral/10',
  emerald: 'border-cashflow-emerald/50 ring-4 ring-cashflow-emerald/10',
  amber: 'border-neon-amber/50 ring-4 ring-neon-amber/10',
}

const accentActiveMap = {
  cyan: 'bg-electric-cyan/15 text-electric-cyan',
  coral: 'bg-alert-coral/15 text-alert-coral',
  emerald: 'bg-cashflow-emerald/15 text-cashflow-emerald',
  amber: 'bg-neon-amber/15 text-neon-amber',
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
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selectedIndex = options.findIndex(o => o.value === value)
  const selectedOption = options.find(o => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(opt: Option) {
    onChange(opt.value)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(prev => !prev)
      return
    }

    if (e.key === 'Escape') {
      setOpen(false)
      return
    }

    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = Math.min(selectedIndex + 1, options.length - 1)
        if (next >= 0) onChange(options[next].value)
        scrollToIndex(next)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = Math.max(selectedIndex - 1, 0)
        onChange(options[prev].value)
        scrollToIndex(prev)
        return
      }
    }
  }

  function scrollToIndex(index: number) {
    requestAnimationFrame(() => {
      if (!listRef.current) return
      const item = listRef.current.children[index] as HTMLElement
      if (item) item.scrollIntoView({ block: 'nearest' })
    })
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center gap-2 bg-cosmic-midnight border rounded-xl px-4 py-3 text-left transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed ${focus && open ? accentBorderMap[accentColor] : 'border-white/10 hover:border-white/20'} ${icon ? 'pl-11' : ''}`}
      >
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-gray">
            {icon}
          </div>
        )}
        <span className={`flex-1 truncate ${selectedOption ? 'text-polar-white' : 'text-muted-gray'}`}>
          {selectedOption ? selectedOption.label : (placeholder || 'Seleccionar')}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-gray transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1.5 w-full min-w-[160px] bg-titanium-slate border border-white/10 rounded-xl shadow-2xl backdrop-blur-2xl overflow-y-auto max-h-56 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-gray text-center">Sin opciones</div>
          )}
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={() => handleSelect(opt)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                  ${isSelected ? `${accentActiveMap[accentColor]} font-semibold` : 'text-polar-white hover:bg-white/5'}
                  ${i > 0 ? 'border-t border-white/5' : ''}`}
              >
                <span className={`w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors
                  ${isSelected ? `${accentBorderMap[accentColor].split(' ')[0]} bg-current` : 'border-white/20'}`}
                >
                  {isSelected && <Check size={10} className="text-cosmic-midnight" />}
                </span>
                <span className="flex-1 truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
