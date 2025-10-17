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
  }>
}

export default async function MonthPage({ params }: Props) {
  const { year, month } = await params

  return (
    <NewsApp 
      initialYear={year}
      initialMonth={month}
      initialDay="all"
      initialPage={1}
    />
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, month } = await params
  
  // Ay ismini al
  const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
    .toLocaleDateString('tr-TR', { month: 'long' })

  // Canonical URL oluştur
  const canonicalUrl = `https://www.saatdakika.com/${year}/${month.padStart(2, '0')}`
  
  return {
    title: `${monthName} ${year} Haberleri - SaatDakika.com`,
    description: `${monthName} ${year} ayına ait güncel haberler ve son dakika gelişmeleri`,
    keywords: `${monthName} ${year}, ${monthName} haberleri, ${year} ${monthName}`,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${monthName} ${year} Haberleri`,
      description: `${monthName} ${year} ayındaki tüm önemli haberler`,
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