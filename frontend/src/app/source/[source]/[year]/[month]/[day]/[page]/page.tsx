import NewsApp from '@/components/NewsApp'
import { Metadata } from 'next'

// 🚀 FORCE DYNAMIC - Her istekte fresh content
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

interface Props {
  params: Promise<{
    source: string
    year: string
    month: string
    day: string
    page: string
  }>
}

export default async function SourceDayPageWithPagination({ params }: Props) {
  const { source, year, month, day, page } = await params
  
  // URL slug'ından kaynak adını geri çevir
  const sourceName = source
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <NewsApp 
      initialSource={sourceName}
      initialYear={year}
      initialMonth={month}
      initialDay={day}
      initialPage={parseInt(page)}
    />
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source, year, month, day, page } = await params
  
  // URL slug'ından kaynak adını geri çevir
  const sourceName = source
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  // Tarih formatla
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const formattedDate = date.toLocaleDateString('tr-TR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  // Canonical URL oluştur
  const canonicalUrl = `https://www.saatdakika.com/source/${source}/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}/${page}`
  
  return {
    title: `${sourceName} - ${formattedDate} Haberleri - Sayfa ${page} - SaatDakika.com`,
    description: `${sourceName} kaynağından ${formattedDate} tarihli haberlerin ${page}. sayfası`,
    keywords: `${sourceName}, ${formattedDate}, sayfa ${page}, ${sourceName} haberleri`,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${sourceName} - ${formattedDate} Haberleri - Sayfa ${page}`,
      description: `${sourceName} kaynağından ${formattedDate} tarihli haberlerin ${page}. sayfası`,
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
