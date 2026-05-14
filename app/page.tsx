'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
      else router.replace('/login')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-void">
      <div className="w-6 h-6 rounded-full border-t-transparent animate-spin"
        style={{ border: '2px solid var(--amber)' }} />
    </div>
  )
}
