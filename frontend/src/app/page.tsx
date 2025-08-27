import { redirect } from 'next/navigation'

// 🚀 FORCE DYNAMIC - Her istekte çalışacak
export const dynamic = 'force-dynamic'
export const revalidate = 0

// 🚫 NEVER CACHE this page
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

export default async function HomePage() {
  console.log('🏠 HomePage rendering at:', new Date().toISOString())
  
  // Server-side'da her zaman fresh date al
  const today = new Date()
  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  
  const redirectUrl = `/${year}/${month}/${day}`
  console.log(`📍 Redirecting to: ${redirectUrl}`)
  
  redirect(redirectUrl)
}

// Bu page için metadata da asla cache edilmemeli
export async function generateMetadata() {
  const today = new Date()
  const formattedDate = today.toLocaleDateString('tr-TR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  return {
    title: `SaatDakika.com - ${formattedDate} Son Dakika Haberleri`,
    description: `Türkiye'nin en güncel haber sitesi. ${formattedDate} son dakika haberleri ve gelişmeleri.`,
    keywords: `son dakika, haberler, türkiye, ${formattedDate}, güncel haberler`,
    openGraph: {
      title: `SaatDakika.com - ${formattedDate} Haberleri`,
      description: `${formattedDate} son dakika haberleri ve güncel gelişmeler`,
      type: 'website'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Cache control
    other: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
}