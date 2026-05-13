'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { storage } from '@/lib/data'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Both fields are required.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      storage.setUser({ email })
      router.push('/dashboard')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center relative overflow-hidden">
      {/* Background film strips */}
      <div className="absolute left-0 top-0 bottom-0 w-16 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0px, transparent 20px, #d4a853 20px, #d4a853 22px)',
        backgroundSize: '100% 44px'
      }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0px, transparent 20px, #d4a853 20px, #d4a853 22px)',
        backgroundSize: '100% 44px'
      }} />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,168,83,0.05) 0%, transparent 70%)'
      }} />

      <div className="w-full max-w-sm px-6 fade-up">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">📽️</span>
          </div>
          <h1 className="font-display text-5xl font-black tracking-tight amber-glow" style={{ color: 'var(--amber)' }}>
            FeelReel
          </h1>
          <p className="text-xs mt-2 tracking-widest uppercase font-mono" style={{ color: 'var(--silver-ghost)' }}>
            watch what you feel
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@cinema.com"
              className="cin-input w-full px-4 py-3 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="cin-input w-full px-4 py-3 rounded-lg text-sm"
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--crimson-glow)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cin-btn w-full py-3 rounded-lg mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" />
            ) : (
              'Enter the Screening Room'
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-xs" style={{ color: 'var(--silver-ghost)' }}>
          Any credentials will work — this is a prototype.
        </p>
      </div>
    </div>
  )
}
