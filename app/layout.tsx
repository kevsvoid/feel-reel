import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FeelReel — Watch What You Feel',
  description: 'Mood-based movie recommendations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
