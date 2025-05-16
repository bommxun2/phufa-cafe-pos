// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext';

// 1. Import the font function from next/font/google
import { Sarabun } from 'next/font/google' // Or Kanit, Prompt, etc.

// 2. Configure the font
// Specify subsets: 'thai' is crucial, 'latin' is good for English text.
// Specify weights you plan to use.
const sarabunFont = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['200', '300', '400', '500', '600'], // Light, Regular, Medium, SemiBold, Bold
  display: 'swap', // Ensures text is visible while font loads
  variable: '--font-mitr' // Optional: CSS Variable for more flexibility
})

export const metadata: Metadata = {
  title: 'Phufa Cafe POS',
  description: 'Point of Sale system for Phufa Cafe, by Group 15',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 3. Apply the font class to the <html> or <body> tag
    //    If using a CSS variable, you don't need to add the className here,
    //    but rather set it in globals.css. Using className is often simpler for a single primary font.
    <html lang="th" className={sarabunFont.className}> {/* Apply to html for broadest coverage. lang="th" is good practice. */}
      <body>
        {/* Or, if you used the variable option:
        <html lang="th" className={`${sarabunFont.variable}`}>
        And then in globals.css:
        body { font-family: var(--font-sarabun), sans-serif; }
        But applying className directly is often easier.
        */}
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}