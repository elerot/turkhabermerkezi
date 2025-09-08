import NewsApp from '@/components/NewsApp'
import { Metadata } from 'next'

interface Props {
  params: Promise<{
    source: string
  }>
  searchParams: Promise<{
    year?: string
    month?: string
    day?: string
    page?: string
    category?: string
  }>
}

export default async function SourcePage({ params, searchParams }: Props) {
  const { source } = await params
  const { year, month, day, page, category } = await searchParams

  return (
    <NewsApp 
      initialSource={source}
      initialYear={year || "all"}
      initialMonth={month || "all"}
      initialDay={day || "all"}
      initialPage={page ? parseInt(page) : 1}
    />
  )
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { source } = await params
  const { year, month, day } = await searchParams
  
  // Source slug'ını gerçek isme çevir (basit yaklaşım)
  const sourceName = source.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  let title = `${sourceName} Haberleri - SaatDakika.com`
  let description = `${sourceName} kaynağından son dakika haberleri`
  
  if (year && year !== "all") {
    title = `${sourceName} ${year} Haberleri - SaatDakika.com`
    description = `${sourceName} kaynağından ${year} yılı haberleri`
    
    if (month && month !== "all") {
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('tr-TR', { month: 'long' })
      title = `${sourceName} ${monthName} ${year} Haberleri - SaatDakika.com`
      description = `${sourceName} kaynağından ${monthName} ${year} haberleri`
      
      if (day && day !== "all") {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const formattedDate = date.toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        title = `${sourceName} ${formattedDate} Haberleri - SaatDakika.com`
        description = `${sourceName} kaynağından ${formattedDate} tarihli haberler`
      }
    }
  }
  
  return {
    title,
    description,
    keywords: `${sourceName}, haberler, ${year || ''}, son dakika`,
    openGraph: {
      title,
      description,
      type: 'website'
    }
  }
}
