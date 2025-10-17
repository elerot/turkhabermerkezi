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
  }>
  searchParams: Promise<{
    category?: string
  }>
}

export default async function SourcePage({ params, searchParams }: Props) {
  const { source } = await params
  const { category } = await searchParams

  return (
    <NewsApp 
      initialSource={source}
      initialYear="all"
      initialMonth="all"
      initialDay="all"
      initialPage={1}
    />
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source } = await params
  
  // Source slug'ını gerçek isme çevir (basit yaklaşım)
  const sourceName = source.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  // Canonical URL oluştur
  const canonicalUrl = `https://www.saatdakika.com/source/${source}`
  
  return {
    title: `${sourceName} Haberleri - SaatDakika.com`,
    description: `${sourceName} kaynağından son dakika haberleri`,
    keywords: `${sourceName}, haberler, son dakika`,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${sourceName} Haberleri`,
      description: `${sourceName} kaynağından son dakika haberleri`,
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
