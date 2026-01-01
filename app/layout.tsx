import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Draw it, Pass it!',
  description: 'The ultimate Chinese Pictionary game - draw, write, and laugh with friends!',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
        {children}
      </body>
    </html>
  )
}
