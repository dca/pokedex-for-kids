import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AppLayout from '@/components/AppLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pokédx for Kids',
  description: 'Interactive Pokédx for kids to learn about Pokemon with games, learning, and audio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
