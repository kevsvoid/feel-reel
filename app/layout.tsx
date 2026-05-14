import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FeelReel',
  description: 'Watch What You Feel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
