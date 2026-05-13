'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { storage } from '@/lib/data'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const user = storage.getUser()
    if (user) router.replace('/dashboard')
    else router.replace('/login')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-void">
      <div className="w-6 h-6 border border-amber rounded-full border-t-transparent animate-spin" />
    </div>
  )
}
