import './globals.css'

export const metadata = {
  title: 'Pittsburgh Ruff Ryders',
  description: 'Chapter attendance tracker',
  manifest: '/manifest.json',
  themeColor: '#C0392B',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
