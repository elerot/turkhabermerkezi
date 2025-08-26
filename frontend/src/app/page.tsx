import { redirect } from 'next/navigation'

export default async function HomePage() {
 try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/today`, {
      cache: 'no-store' // Her zaman fresh data
    });
    
    if (response.ok) {
      const { today } = await response.json();
      const [year, month, day] = today.split('-');
      redirect(`/${year}/${month}/${day}`);
    }
  } catch (error) {
    console.error('Failed to get today date from API:', error);
  }

  const today = new Date()
  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  
  redirect(`/${year}/${month}/${day}`)
}