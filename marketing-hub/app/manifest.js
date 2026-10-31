export default function manifest() {
  return {
    name: 'FinStreet Marketing Hub',
    short_name: 'FinStreet Hub',
    description: 'Tasks, approvals, campaigns, videos and chat for the FinStreet marketing team',
    start_url: '/',
    display: 'standalone',
    background_color: '#EDF1EF',
    theme_color: '#10231E',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcuts: [{ name: 'New task', url: '/?new=1' }],
  }
}
