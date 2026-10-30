// Har insaan ka ek fixed rang (naam se) + initials
const PALETTE = [
  ['#eef2ff', '#4338ca'],
  ['#fdf2f8', '#be185d'],
  ['#ecfdf5', '#047857'],
  ['#fff7ed', '#c2410c'],
  ['#f0f9ff', '#0369a1'],
  ['#f5f3ff', '#6d28d9'],
  ['#fefce8', '#a16207'],
  ['#fef2f2', '#b91c1c'],
]

export function initials(name = '') {
  const parts = String(name).replace(/@.*/, '').trim().split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function avatarColors(key = '') {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  const [bg, fg] = PALETTE[h % PALETTE.length]
  return { bg, fg }
}
