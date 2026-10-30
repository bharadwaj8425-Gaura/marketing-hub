import './globals.css'

export const metadata = {
  title: 'FinStreet Marketing Hub',
  description: 'Task assignment, chat, approvals and time tracking for the marketing team',
}

export const viewport = {
  themeColor: '#10231e',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
        />
      </head>
      <body className="font-sans text-slate-900 antialiased">{children}</body>
    </html>
  )
}
