import type { Metadata } from 'next'
import { Geist_Mono, Jua } from 'next/font/google'
import './globals.css'

// Primary body font — playful, rounded, handwritten feel.
const jua = Jua({
  variable: '--font-jua',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '수진프레시',
  description: '냉장고 속 재료를 관리하세요',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10b981',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${jua.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
