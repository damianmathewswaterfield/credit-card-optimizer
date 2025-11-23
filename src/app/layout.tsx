import type { Metadata } from 'next'
import './globals.css'
import { Navigation } from '@/components/layout/Navigation'

export const metadata: Metadata = {
  title: 'Credit Card Optimizer',
  description: 'Maximize your credit card benefits',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">{children}</main>
          <footer className="border-t border-neutral-200 py-6 text-center text-sm text-neutral-600">
            <p>&copy; {new Date().getFullYear()} Credit Card Optimizer</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
