'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { storage } from '@/lib/data'
import { Film, LayoutDashboard, BookOpen, Star, LogOut } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/logs',      label: 'Logs',      icon: BookOpen },
  { href: '/watchlist', label: 'Watchlist',  icon: Star },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    const u = storage.getUser()
    if (!u) router.replace('/login')
    else setUser(u)
  }, [router])

  function logout() {
    storage.clearUser()
    router.push('/login')
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-void">
      <div className="w-6 h-6 border border-amber rounded-full border-t-transparent animate-spin" />
    </div>
  )

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
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="mt-auto pt-6 border-t" style={{ borderColor: 'rgba(212,168,83,0.1)' }}>
          <p className="text-xs mb-3 px-2 truncate font-mono" style={{ color: 'var(--silver-ghost)' }}>
            {user.email}
          </p>
          <button onClick={logout} className="nav-link w-full text-left" style={{ color: 'var(--silver-ghost)' }}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
