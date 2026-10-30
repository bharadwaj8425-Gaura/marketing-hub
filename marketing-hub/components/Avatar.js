import { initials, avatarColors } from '@/lib/avatar'

export default function Avatar({ name, id, size = 32, online, ring = true, className = '' }) {
  const { bg, fg } = avatarColors(id || name || '')
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span
        className={`flex h-full w-full items-center justify-center rounded-full font-semibold ${ring ? 'ring-2 ring-white' : ''}`}
        style={{ backgroundColor: bg, color: fg, fontSize: Math.max(10, size * 0.38) }}
        title={name}
      >
        {initials(name)}
      </span>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white ${
            online ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          style={{ width: size * 0.32, height: size * 0.32 }}
        />
      )}
    </span>
  )
}
