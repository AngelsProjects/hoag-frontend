import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'File Explorer',
  description: 'Filesystem tree visualizer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#1e1e1e] text-[#cccccc] antialiased">{children}</body>
    </html>
  )
}
