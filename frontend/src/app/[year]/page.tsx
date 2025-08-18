import NewsApp from '@/components/NewsApp'
import { Metadata } from 'next'

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
  
  return {
    title: `${year} Yılı Haberleri - SaatDakika.com`,
    description: `${year} yılına ait tüm haberler ve güncel gelişmeler`,
    keywords: `${year} haberleri, ${year} son dakika, türkiye ${year}`,
    openGraph: {
      title: `${year} Yılı Haberleri`,
      description: `${year} yılındaki tüm önemli haberler`,
      type: 'website'
    }
  }
}