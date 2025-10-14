import './globals.css'

export const metadata = {
  title: 'SubManager - 구독 서비스 관리',
  description: '모든 구독 서비스를 한 곳에서 관리하고, 불필요한 지출을 줄여보세요',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
