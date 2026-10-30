'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

// variant 'dialog' (centered) or 'drawer' (slides in from the right)
export default function Modal({ title, header, onClose, children, wide = false, variant = 'dialog' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (variant === 'drawer') {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/25"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <aside className="absolute inset-y-0 right-0 flex w-full max-w-[640px] animate-slide-in flex-col border-l border-slate-200 bg-white shadow-[-14px_0_36px_rgba(0,0,0,.16)]">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3">
            <div className="min-w-0 flex-1 truncate text-[13px] text-slate-500">{header ?? title}</div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            >
              <X size={17} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </aside>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`max-h-[90vh] w-full animate-pop overflow-y-auto rounded-xl bg-white p-6 shadow-xl ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
