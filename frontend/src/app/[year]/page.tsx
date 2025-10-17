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
  }>
}

export default async function YearPage({ params }: Props) {
  const { year } = await params

  return (
    <NewsApp 
      initialYear={year}
      initialMonth="all"
      initialDay="all"
      initialPage={1}
    />
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params

  // Canonical URL oluştur
  const canonicalUrl = `https://www.saatdakika.com/${year}`
  
  return {
    title: `${year} Yılı Haberleri - SaatDakika.com`,
    description: `${year} yılına ait tüm haberler ve güncel gelişmeler`,
    keywords: `${year} haberleri, ${year} son dakika, türkiye ${year}`,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${year} Yılı Haberleri`,
      description: `${year} yılındaki tüm önemli haberler`,
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