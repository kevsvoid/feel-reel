'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'
import { Film, LayoutDashboard, BookOpen, Star, LogOut } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/logs',      label: 'Logs',      icon: BookOpen },
  { href: '/watchlist', label: 'Watchlist',  icon: Star },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login')
      } else {
        setUser(data.session.user)
      }
      setLoading(false)
    })

    // Listen for auth state changes (logout from another tab, token refresh, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login')
        setUser(null)
      } else {
        setUser(session.user)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  async function handleLogout() {
    try {
      await signOut()
    } catch {
      // Sign out locally even if server call fails
    }
    router.push('/login')
  }

  // Loading / not authed state
  if (loading || !user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: '#080808' }}>
      <span
        className="font-display text-2xl font-bold"
        style={{ color: '#d4a853' }}
      >
        FeelReel
      </span>
      <div className="w-6 h-6 rounded-full border-t-transparent animate-spin"
        style={{ border: '2px solid #d4a853' }} />
    </div>
  )

  const displayName = user.user_metadata?.display_name || user.email || 'Cinephile'
  const initials    = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen bg-void">

      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r py-8 px-4" style={{
        background: 'var(--reel)',
        borderColor: 'rgba(212,168,83,0.1)',
      }}>

        {/* Logo */}
        <div className="mb-10 px-2">
          <div className="flex items-center gap-2">
            <Film size={20} style={{ color: 'var(--amber)' }} />
            <span className="font-display text-xl font-bold" style={{ color: 'var(--amber)' }}>FeelReel</span>
          </div>
          <p className="text-xs mt-1 font-mono tracking-widest" style={{ color: 'var(--silver-ghost)' }}>
            watch what you feel
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link ${pathname === href ? 'active' : ''}`}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="mt-auto pt-6 border-t" style={{ borderColor: 'rgba(212,168,83,0.1)' }}>
          <div className="flex items-center gap-2.5 px-2 mb-3">
            {/* Avatar circle */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono"
              style={{ background: 'rgba(212,168,83,0.15)', color: 'var(--amber)', border: '1px solid rgba(212,168,83,0.2)' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--silver)' }}>
                {user.user_metadata?.display_name || 'Cinephile'}
              </p>
              <p className="text-xs truncate font-mono" style={{ color: 'var(--silver-ghost)', fontSize: 10 }}>
                {user.email}
              </p>
            </div>
          </div>

          <button onClick={handleLogout} className="nav-link w-full text-left" style={{ color: 'var(--silver-ghost)' }}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
