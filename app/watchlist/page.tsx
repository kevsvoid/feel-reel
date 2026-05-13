'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import MovieCard from '@/components/MovieCard'
import { MOCK_MOVIES, MOODS, Mood, Movie, detectEmotion, storage } from '@/lib/data'
import { Search, SlidersHorizontal, BookmarkX } from 'lucide-react'

type Tab = 'all' | 'watchlist'

export default function WatchlistPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [searchText, setSearchText] = useState('')
  const [selectedMood, setSelectedMood] = useState<Mood | 'all'>('all')
  const [watchlistIds, setWatchlistIds] = useState<string[]>([])

  function loadWatchlist() {
    setWatchlistIds(storage.getWatchlist())
  }

  useEffect(() => {
    loadWatchlist()
    const interval = setInterval(loadWatchlist, 500)
    return () => clearInterval(interval)
  }, [])

  // Derived: filtered movies
  const baseMovies: Movie[] = tab === 'watchlist'
    ? MOCK_MOVIES.filter(m => watchlistIds.includes(m.id))
    : MOCK_MOVIES

  const filteredMovies = baseMovies.filter(movie => {
    const moodMatch = selectedMood === 'all' || movie.mood.includes(selectedMood as Mood)
    if (!searchText.trim()) return moodMatch

    // Search: try emotion detection on input
    const detectedMood = detectEmotion(searchText)
    const searchMoodMatch = movie.mood.includes(detectedMood)
    const titleMatch = movie.title.toLowerCase().includes(searchText.toLowerCase())
    return moodMatch && (searchMoodMatch || titleMatch)
  })

  return (
    <AppShell>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 fade-up">
          <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--amber)' }}>
            — Coming Attractions
          </p>
          <h1 className="font-display text-4xl font-bold" style={{ color: 'var(--silver)' }}>
            Your <span style={{ color: 'var(--amber)' }}>Watchlist</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit fade-up-1" style={{ background: 'var(--frame)' }}>
          {(['all', 'watchlist'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-md text-xs font-mono uppercase tracking-widest transition-all ${
                tab === t ? 'text-void font-medium' : ''
              }`}
              style={tab === t ? { background: 'var(--amber)', color: 'var(--void)' } : { color: 'var(--silver-ghost)' }}
            >
              {t === 'all' ? 'All Films' : `Saved (${watchlistIds.length})`}
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-6 fade-up-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--silver-ghost)' }} />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search by title or describe how you feel..."
              className="cin-input w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--silver-ghost)' }} />
            <select
              value={selectedMood}
              onChange={e => setSelectedMood(e.target.value as Mood | 'all')}
              className="cin-input pl-10 pr-8 py-2.5 rounded-lg text-sm appearance-none cursor-pointer"
              style={{ minWidth: 150 }}
            >
              <option value="all">All Moods</option>
              {MOODS.map(m => (
                <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search mood hint */}
        {searchText.trim() && (
          <div className="mb-4 text-xs font-mono fade-up" style={{ color: 'var(--silver-ghost)' }}>
            Emotion detected: <span style={{ color: 'var(--amber)' }}>
              {MOODS.find(m => m.value === detectEmotion(searchText))?.emoji}{' '}
              {detectEmotion(searchText)}
            </span>
            {' '}— showing matching films
          </div>
        )}

        {/* Movie grid */}
        {filteredMovies.length === 0 ? (
          <div className="cin-card rounded-xl p-16 text-center">
            <BookmarkX size={32} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--silver)' }} />
            <p className="font-display text-xl mb-2" style={{ color: 'var(--silver-dim)' }}>
              {tab === 'watchlist' ? 'Nothing saved yet' : 'No films match'}
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
              {tab === 'watchlist'
                ? 'Browse all films and add some to your watchlist'
                : 'Try adjusting your mood filter or search'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMovies.map((movie, i) => (
              <div key={movie.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
