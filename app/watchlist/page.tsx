'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import MovieCard from '@/components/MovieCard'
import { MOCK_MOVIES, MOODS, GENRES, Mood, Genre, Movie, detectEmotion, storage } from '@/lib/data'
import { Search, BookmarkX, SlidersHorizontal, X } from 'lucide-react'

type Tab = 'all' | 'watchlist'

export default function WatchlistPage() {
  const [tab, setTab]                     = useState<Tab>('all')
  const [searchText, setSearchText]       = useState('')
  const [selectedMood, setSelectedMood]   = useState<Mood | 'all'>('all')
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'all'>('all')
  const [watchlistIds, setWatchlistIds]   = useState<string[]>([])

  function loadWatchlist() { setWatchlistIds(storage.getWatchlist()) }
  useEffect(() => {
    loadWatchlist()
    const t = setInterval(loadWatchlist, 500)
    return () => clearInterval(t)
  }, [])

  const baseMovies: Movie[] = tab === 'watchlist'
    ? MOCK_MOVIES.filter(m => watchlistIds.includes(m.id))
    : MOCK_MOVIES

  const detectedMood = searchText.trim() ? detectEmotion(searchText) : null

  const filteredMovies = baseMovies.filter(movie => {
    const moodMatch  = selectedMood  === 'all' || movie.mood.includes(selectedMood as Mood)
    const genreMatch = selectedGenre === 'all' || movie.genres.includes(selectedGenre as Genre)
    if (!searchText.trim()) return moodMatch && genreMatch
    const searchMoodMatch = detectedMood ? movie.mood.includes(detectedMood) : false
    const titleMatch = movie.title.toLowerCase().includes(searchText.toLowerCase())
    return moodMatch && genreMatch && (searchMoodMatch || titleMatch)
  })

  const activeFilters = [
    selectedMood  !== 'all' && selectedMood,
    selectedGenre !== 'all' && selectedGenre,
  ].filter(Boolean) as string[]

  function clearFilters() {
    setSelectedMood('all')
    setSelectedGenre('all')
    setSearchText('')
  }

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
              className="px-5 py-2 rounded-md text-xs font-mono uppercase tracking-widest transition-all"
              style={tab === t
                ? { background: 'var(--amber)', color: 'var(--void)', fontWeight: 600 }
                : { color: 'var(--silver-ghost)' }}
            >
              {t === 'all' ? 'All Films' : `Saved (${watchlistIds.length})`}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-4 fade-up-2">
          {/* Search */}
          <div className="flex-1 min-w-48 relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--silver-ghost)' }} />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search by title or how you feel..."
              className="cin-input w-full pl-9 pr-4 py-2.5 rounded-lg text-sm"
            />
          </div>

          {/* Mood filter */}
          <div className="relative">
            <SlidersHorizontal size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--silver-ghost)' }} />
            <select
              value={selectedMood}
              onChange={e => setSelectedMood(e.target.value as Mood | 'all')}
              className="cin-input pl-9 pr-7 py-2.5 rounded-lg text-sm appearance-none cursor-pointer"
              style={{ minWidth: 140 }}
            >
              <option value="all">All Moods</option>
              {MOODS.map(m => (
                <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>

          {/* Genre filter */}
          <div className="relative">
            <SlidersHorizontal size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--silver-ghost)' }} />
            <select
              value={selectedGenre}
              onChange={e => setSelectedGenre(e.target.value as Genre | 'all')}
              className="cin-input pl-9 pr-7 py-2.5 rounded-lg text-sm appearance-none cursor-pointer"
              style={{ minWidth: 140 }}
            >
              <option value="all">All Genres</option>
              {GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter chips + emotion hint */}
        {(activeFilters.length > 0 || (searchText.trim() && detectedMood)) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {detectedMood && searchText.trim() && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full"
                style={{ background: `${MOODS.find(m => m.value === detectedMood)?.color}20`, color: MOODS.find(m => m.value === detectedMood)?.color }}>
                {MOODS.find(m => m.value === detectedMood)?.emoji} Mood detected: {detectedMood}
              </span>
            )}
            {activeFilters.map(f => (
              <span key={f} className="text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(212,168,83,0.1)', color: 'var(--amber)', border: '1px solid rgba(212,168,83,0.2)' }}>
                {f}
              </span>
            ))}
            <button onClick={clearFilters} className="text-xs font-mono flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white/5 transition-colors"
              style={{ color: 'var(--silver-ghost)' }}>
              <X size={10} /> Clear
            </button>
          </div>
        )}

        {/* Results count */}
        <p className="text-xs font-mono mb-4" style={{ color: 'var(--silver-ghost)' }}>
          {filteredMovies.length} {filteredMovies.length === 1 ? 'film' : 'films'} shown
        </p>

        {/* Grid */}
        {filteredMovies.length === 0 ? (
          <div className="cin-card rounded-xl p-16 text-center">
            <BookmarkX size={32} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--silver)' }} />
            <p className="font-display text-xl mb-2" style={{ color: 'var(--silver-dim)' }}>
              {tab === 'watchlist' ? 'Nothing saved yet' : 'No films match'}
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
              {tab === 'watchlist'
                ? 'Browse all films and add some to your watchlist'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMovies.map((movie, i) => (
              <div key={movie.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
