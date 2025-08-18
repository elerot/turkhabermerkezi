import NewsApp from '@/components/NewsApp'
import { Metadata } from 'next'

interface Props {
  params: Promise<{
    year: string
    month: string
    day: string
    page: string
  }>
}

export default async function DayPageWithPagination({ params }: Props) {
  const { year, month, day, page } = await params

  return (
    <NewsApp 
      initialYear={year}
      initialMonth={month}
      initialDay={day}
      initialPage={parseInt(page)}
    />
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, month, day, page } = await params
  
  // Tarih formatla
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const formattedDate = date.toLocaleDateString('tr-TR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  return {
    title: `${formattedDate} Haberleri - Sayfa ${page} - SaatDakika.com`,
    description: `${formattedDate} tarihli haberlerin ${page}. sayfası`,
    keywords: `${formattedDate}, sayfa ${page}, günlük haberler`,
    openGraph: {
      title: `${formattedDate} Haberleri - Sayfa ${page}`,
      description: `${formattedDate} tarihindeki haberlerin ${page}. sayfası`,
      type: 'website'
    }
  }
}