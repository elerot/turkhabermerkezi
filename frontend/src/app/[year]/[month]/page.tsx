import NewsApp from '@/components/NewsApp'
import { Metadata } from 'next'

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
  
  return {
    title: `${monthName} ${year} Haberleri - SaatDakika.com`,
    description: `${monthName} ${year} ayına ait güncel haberler ve son dakika gelişmeleri`,
    keywords: `${monthName} ${year}, ${monthName} haberleri, ${year} ${monthName}`,
    openGraph: {
      title: `${monthName} ${year} Haberleri`,
      description: `${monthName} ${year} ayındaki tüm önemli haberler`,
      type: 'website'
    }
  }
}