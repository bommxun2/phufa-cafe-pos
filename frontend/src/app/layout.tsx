import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'; // 👈 1. Import ToastProvider

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
      <body>
        <AuthProvider>
          <ToastProvider> {/* 👈 2. Wrap children (or AuthProvider) with ToastProvider */}
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}