import NewsApp from '@/components/NewsApp'
import { Metadata } from 'next'

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
  
  return {
    title: `${formattedDate} Haberleri - SaatDakika.com`,
    description: `${formattedDate} tarihli son dakika haberleri ve güncel gelişmeler`,
    keywords: `${formattedDate}, ${day}/${month}/${year} haberleri, günlük haberler`,
    openGraph: {
      title: `${formattedDate} Haberleri`,
      description: `${formattedDate} tarihindeki tüm önemli haberler`,
      type: 'website'
    }
  }
}