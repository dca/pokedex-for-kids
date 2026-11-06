import './globals.css'
import type { Metadata, Viewport } from 'next'
import { UiScale } from '@/components/UiScale'
import { UI_SCALE_SCRIPT } from '@/components/scale'

export const metadata: Metadata = {
  title: '注音島',
  description: '跟寶可夢一起學注音',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#9AD8FF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: UI_SCALE_SCRIPT }} />
      </head>
      <body>
        <UiScale />
        {children}
      </body>
    </html>
  )
}
