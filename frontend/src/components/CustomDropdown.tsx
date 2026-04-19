import { useState, useRef, useEffect } from 'react'

export function CustomDropdown<T extends string | number>({ 
  value, 
  options, 
  onChange, 
  placeholder,
  style
}: { 
  value: T | '', 
  options: { value: T | '', label: string }[], 
  onChange: (val: T | '') => void,
  placeholder: string,
  style?: React.CSSProperties
}) {
  const [isOpen, setIsOpen] = useState(false)
  const currentLabel = options.find(o => o.value === value)?.label || placeholder
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: isOpen ? 20 : 1, ...style }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.2)',
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border)', 
          borderRadius: '0.5rem',
          color: 'var(--text)', fontSize: '1rem',
          cursor: 'pointer', width: '100%', justifyContent: 'space-between',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none'
        }}
      >
        <span>{currentLabel}</span>
        <svg 
          style={{ width: '1.1rem', height: '1.1rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="custom-dropdown-content"
          style={{
            position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, width: '100%',
            background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(16px)',
            border: '1px solid var(--border)', borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', zIndex: 101, padding: '0.35rem',
            maxHeight: '250px', overflowY: 'auto'
          }}
        >
          {options.map(opt => (
            <button
              key={opt.label}
              type="button"
              className="dropdown-option"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                border: 'none', background: value === opt.value ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: value === opt.value ? 'var(--primary)' : 'var(--text)', fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
            >
              {opt.label}
              {value === opt.value && (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
