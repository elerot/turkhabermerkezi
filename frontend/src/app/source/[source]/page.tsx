import NewsApp from '@/components/NewsApp'
import { Metadata } from 'next'

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
  
  return {
    title: `${sourceName} Haberleri - SaatDakika.com`,
    description: `${sourceName} kaynağından son dakika haberleri`,
    keywords: `${sourceName}, haberler, son dakika`,
    openGraph: {
      title: `${sourceName} Haberleri`,
      description: `${sourceName} kaynağından son dakika haberleri`,
      type: 'website'
    }
  }
}
