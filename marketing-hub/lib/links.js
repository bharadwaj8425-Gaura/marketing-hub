export const LINK_KINDS = [
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'drive', label: 'Google Drive', icon: '📁' },
  { value: 'vimeo', label: 'Vimeo', icon: '🎬' },
  { value: 'podcast', label: 'Podcast', icon: '🎙️' },
  { value: 'raw', label: 'Raw footage', icon: '🎞️' },
  { value: 'thumbnail', label: 'Thumbnail', icon: '🖼️' },
  { value: 'script', label: 'Script', icon: '📝' },
  { value: 'other', label: 'Other link', icon: '🔗' },
]

export const kindOf = (value) => LINK_KINDS.find((k) => k.value === value) || LINK_KINDS[7]

// Sirf http / https links allowed (javascript: jaise links block)
export function normalizeUrl(input) {
  let u = (input || '').trim()
  if (!u) return null
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u
  try {
    const url = new URL(u)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function safeUrl(input) {
  return /^https?:\/\//i.test(input || '') ? input : '#'
}

export function detectLinkKind(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'youtube'
    if (host === 'drive.google.com' || host === 'docs.google.com') return 'drive'
    if (host.endsWith('vimeo.com')) return 'vimeo'
    if (
      host.endsWith('spotify.com') ||
      host === 'podcasts.apple.com' ||
      host.endsWith('anchor.fm') ||
      host.endsWith('podbean.com')
    )
      return 'podcast'
  } catch {}
  return 'other'
}

export function youtubeId(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
    if (host.endsWith('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v')
      const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)
      if (m) return m[1]
    }
  } catch {}
  return null
}
