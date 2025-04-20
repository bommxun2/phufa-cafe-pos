import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Phufa Cafe POS',
  description: 'Point of Sale system for Phufa Cafe',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 