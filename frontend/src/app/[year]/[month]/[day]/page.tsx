import NewsApp from '@/components/NewsApp'
import { Metadata } from 'next'

// 🚀 FORCE DYNAMIC - Her istekte fresh content
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

interface Props {
  params: Promise<{
    year: string
    month: string
    day: string
  }>
}

export default async function DayPage({ params }: Props) {
  const { year, month, day } = await params

  return (
    <NewsApp 
      initialYear={year}
      initialMonth={month}
      initialDay={day}
      initialPage={1}
    />
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, month, day } = await params
  
  // Tarih formatla
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const formattedDate = date.toLocaleDateString('tr-TR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  // Canonical URL oluştur
  const canonicalUrl = `https://www.saatdakika.com/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`
  
  return {
    title: `${formattedDate} Haberleri - SaatDakika.com`,
    description: `${formattedDate} tarihli son dakika haberleri ve güncel gelişmeler`,
    keywords: `${formattedDate}, ${day}/${month}/${year} haberleri, günlük haberler`,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${formattedDate} Haberleri`,
      description: `${formattedDate} tarihindeki tüm önemli haberler`,
      type: 'website',
      url: canonicalUrl
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
    // Cache control headers
    other: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    }
  }
}