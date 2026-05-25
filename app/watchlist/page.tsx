'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import AppShell from '@/components/AppShell'
import RatingSlider from '@/components/RatingSlider'
import { MOODS, Mood } from '@/lib/data'
import { getLogs, addLog, updateLog, LogEntry } from '@/lib/data'
import { getMoviesByMoodWithSynopsisFilter, searchMovies, getPosterUrl, tmdbRatingTo100, TMDBMovie } from '@/lib/tmdb'
import { Search, BookmarkX, SlidersHorizontal, X, RefreshCw, ImageOff, PenLine, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Tab = 'all' | 'watchlist'

interface WatchlistRow {
  movie_id:   string
  movie_name: string
  poster_url: string | null
  added_at:   string
}

// ─── Small shared components ──────────────────────────────────────────────────

function TMDBPoster({ url, title }: { url: string | null; title: string }) {
  const [err, setErr] = useState(false)
  if (!url || err) {
    return (
      <div className="flex-shrink-0 rounded-lg flex flex-col items-center justify-center gap-1"
        style={{ width: 56, height: 80, background: 'linear-gradient(160deg,#1c1c1c 0%,#111 100%)', border: '1px solid rgba(212,168,83,0.15)' }}>
        <ImageOff size={16} style={{ color: 'rgba(212,168,83,0.3)' }} />
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={`${title} poster`} onError={() => setErr(true)}
    className="flex-shrink-0 rounded-lg object-cover" style={{ width: 56, height: 80, border: '1px solid rgba(212,168,83,0.15)' }} />
}

function ScoreBadge({ score }: { score: number }) {
  const color = score === 0 ? 'var(--silver-ghost)'
    : score < 50 ? '#e74c3c'
    : score < 65 ? '#d4a853'
    : score < 80 ? '#f0c060'
    : '#27ae60'
  return (
    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {score}/100
    </span>
  )
}

// ─── Inline log / review drawer ───────────────────────────────────────────────

interface LogDrawerProps {
  movieId:   string
  movieName: string
  posterUrl: string | null
  existingLog: LogEntry | null   // null = new log
  onDone: (log: LogEntry) => void
  onCancel: () => void
}

function LogDrawer({ movieId, movieName, posterUrl, existingLog, onDone, onCancel }: LogDrawerProps) {
  const [rating, setRating] = useState(existingLog?.rating ?? 70)
  const [mood,   setMood]   = useState<Mood>(existingLog?.mood ?? 'happy')
  const [review, setReview] = useState(existingLog?.review ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    let result: LogEntry | null
    if (existingLog) {
      result = await updateLog(existingLog.id, { rating, mood, review })
    } else {
      result = await addLog({ movieId, movieName, posterUrl, rating, mood, review })
    }
    setSaving(false)
    if (result) onDone(result)
  }

  return (
    <div className="mt-3 p-4 rounded-xl space-y-3"
      style={{ background: 'rgba(212,168,83,0.04)', border: '1px solid rgba(212,168,83,0.12)' }}>
      <p className="text-xs font-mono font-semibold" style={{ color: 'var(--amber)' }}>
        {existingLog ? 'Edit Review' : 'Log Film'}
        <span className="font-normal ml-2" style={{ color: 'var(--silver-ghost)' }}>— {movieName}</span>
      </p>

      {/* Rating */}
      <div>
        <p className="text-xs font-mono mb-2" style={{ color: 'var(--silver-ghost)' }}>Your rating</p>
        <RatingSlider value={rating} onChange={setRating} />
      </div>

      {/* Mood */}
      <div>
        <p className="text-xs font-mono mb-2" style={{ color: 'var(--silver-ghost)' }}>How did it make you feel?</p>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map(m => (
            <button key={m.value} onClick={() => setMood(m.value)}
              className="px-2.5 py-1 rounded-full text-xs font-mono transition-all"
              style={mood === m.value
                ? { background: `${m.color}20`, color: m.color, border: `1px solid ${m.color}40` }
                : { background: 'transparent', color: 'var(--silver-ghost)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Review */}
      <div>
        <p className="text-xs font-mono mb-2" style={{ color: 'var(--silver-ghost)' }}>Review <span style={{ opacity: 0.5 }}>(optional)</span></p>
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          rows={3}
          placeholder="What did you think?"
          className="cin-input w-full px-3 py-2 rounded-lg text-sm resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving}
          className="cin-btn px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5"
          style={{ opacity: saving ? 0.6 : 1 }}>
          {saving
            ? <span className="w-3 h-3 border border-void border-t-transparent rounded-full animate-spin" />
            : <CheckCircle2 size={12} />}
          {existingLog ? 'Save changes' : 'Log film'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-mono transition-colors"
          style={{ color: 'var(--silver-ghost)', border: '1px solid rgba(255,255,255,0.06)' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const [tab, setTab]                     = useState<Tab>('all')
  const [searchText, setSearchText]       = useState('')
  const [selectedMood, setSelectedMood]   = useState<Mood | 'all'>('all')
  const [filteringSynopsis, setFilteringSynopsis] = useState(false)

  // All Films (TMDB discover or search)
  const [tmdbMovies, setTmdbMovies]       = useState<TMDBMovie[]>([])
  const [tmdbLoading, setTmdbLoading]     = useState(false)
  const [refreshSeed, setRefreshSeed]     = useState(0)
  const [isSearchMode, setIsSearchMode]   = useState(false)

  // Saved watchlist
  const [watchlistRows, setWatchlistRows] = useState<WatchlistRow[]>([])
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  // Logs (to know which movies are already logged)
  const [logMap, setLogMap]               = useState<Record<string, LogEntry>>({})

  // Drawer state: which movie row has the drawer open
  const [openDrawer, setOpenDrawer]       = useState<string | null>(null)

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFetching     = useRef(false)
  const [wIds, setWIds] = useState<string[]>([])

  // ── Load logs so we know watched status ──
  const loadLogs = useCallback(async () => {
    const entries = await getLogs()
    const map: Record<string, LogEntry> = {}
    for (const e of entries) {
      if (e.movieId) map[e.movieId] = e
    }
    setLogMap(map)
  }, [])

  // ── Load TMDB discover (no search text) ──
  const loadDiscover = useCallback(async () => {
    if (isFetching.current) return
    isFetching.current = true
    setTmdbLoading(true)
    setIsSearchMode(false)

    if (selectedMood !== 'all') {
      // Use synopsis-based filter when a mood is selected
      setFilteringSynopsis(true)
      const movies = await getMoviesByMoodWithSynopsisFilter(selectedMood, 20, refreshSeed)
      setFilteringSynopsis(false)
      setTmdbMovies(movies)
    } else {
      const qs = new URLSearchParams({
        endpoint:         'discover/movie',
        include_adult:    'false',
        include_video:    'false',
        language:         'en-US',
        sort_by:          'popularity.desc',
        'vote_count.gte': '50',
        'vote_average.gte': '5.5',
        page:             String(((Math.floor((Date.now() / 86400000)) + refreshSeed) % 10) + 1),
      })
      const res   = await fetch(`/api/tmdb?${qs}`)
      const json  = res.ok ? await res.json() : {}
      setTmdbMovies((json.results ?? []).slice(0, 20))
    }

    setTmdbLoading(false)
    isFetching.current = false
  }, [selectedMood, refreshSeed])

  // ── TMDB search ──
  const runSearch = useCallback(async (q: string) => {
    if (isFetching.current) return
    isFetching.current = true
    setTmdbLoading(true)
    setIsSearchMode(true)
    const results = await searchMovies(q)
    setTmdbMovies(results.slice(0, 20))
    setTmdbLoading(false)
    isFetching.current = false
  }, [])

  // ── Search debounce — when text changes ──
  useEffect(() => {
    if (tab !== 'all') return
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (!searchText.trim()) {
      loadDiscover()
      return
    }
    searchDebounce.current = setTimeout(() => {
      runSearch(searchText.trim())
    }, 400)
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, tab])

  // ── Load discover when filters/seed change (only if not in search mode) ──
  useEffect(() => {
    if (!searchText.trim()) loadDiscover()
  }, [loadDiscover, searchText])

  // ── Saved watchlist ──
  const loadWatchlist = useCallback(async () => {
    setWatchlistLoading(true)
    const { data } = await supabase
      .from('watchlist')
      .select('movie_id, movie_name, poster_url, added_at')
      .order('added_at', { ascending: false })
    setWatchlistRows(data ?? [])
    setWIds((data ?? []).map((r: WatchlistRow) => r.movie_id))
    setWatchlistLoading(false)
  }, [])

  useEffect(() => {
    loadLogs()
    loadWatchlist()
    const onFocus = () => { loadLogs(); loadWatchlist() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadLogs, loadWatchlist])

  // ── Watchlist toggle ──
  async function toggleWatchlist(movie: TMDBMovie) {
    const id = String(movie.id)
    const inList = wIds.includes(id)
    if (inList) {
      await supabase.from('watchlist').delete().eq('movie_id', id)
      setWIds(prev => prev.filter(x => x !== id))
      setWatchlistRows(prev => prev.filter(r => r.movie_id !== id))
    } else {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const posterUrl = getPosterUrl(movie.poster_path)
      await supabase.from('watchlist').upsert(
        { user_id: session.user.id, movie_id: id, movie_name: movie.title, poster_url: posterUrl },
        { onConflict: 'user_id,movie_id', ignoreDuplicates: true }
      )
      setWIds(prev => [...prev, id])
      await loadWatchlist()
    }
  }

  async function removeFromWatchlist(movieId: string) {
    await supabase.from('watchlist').delete().eq('movie_id', movieId)
    setWIds(prev => prev.filter(x => x !== movieId))
    setWatchlistRows(prev => prev.filter(r => r.movie_id !== movieId))
  }

  function handleLogDone(log: LogEntry) {
    setLogMap(prev => ({ ...prev, [log.movieId ?? '']: log }))
    setOpenDrawer(null)
  }

  function clearFilters() {
    setSelectedMood('all')
    setSearchText('')
  }

  // Filtered saved watchlist (client-side only — it's the user's own list)
  const filteredWatchlist = watchlistRows.filter(r => {
    if (!searchText.trim()) return true
    return r.movie_name.toLowerCase().includes(searchText.toLowerCase())
  })

  const activeFilters = [
    selectedMood !== 'all' && selectedMood,
  ].filter(Boolean) as string[]

  // ─── Render a single "All Films" row ──────────────────────────────────────

  function AllFilmRow({ movie, idx }: { movie: TMDBMovie; idx: number }) {
    const id       = String(movie.id)
    const poster   = getPosterUrl(movie.poster_path, 'w92')
    const score    = tmdbRatingTo100(movie.vote_average)
    const year     = movie.release_date?.split('-')[0]
    const inWl     = wIds.includes(id)
    const logged   = logMap[id] ?? null
    const isOpen   = openDrawer === id
    return (
      <div className="fade-up" style={{ animationDelay: `${idx * 0.03}s` }}>
        <div className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
          <TMDBPoster url={poster} title={movie.title} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display font-bold text-sm leading-tight truncate" style={{ color: 'var(--silver)' }}>
                  {movie.title}
                </p>
                <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--silver-ghost)' }}>{year}</p>
              </div>
              <ScoreBadge score={score} />
            </div>
            {movie.overview && (
              <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--silver-dim)' }}>
                {movie.overview}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {/* Watchlist toggle */}
            <button
              onClick={() => toggleWatchlist(movie)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                inWl
                  ? 'border-green-400/30 bg-green-400/5 text-green-400'
                  : 'border-amber-500/20 text-amber-400 hover:bg-amber-500/5'
              }`}
            >
              {inWl ? '✓ Saved' : '+ Save'}
            </button>

            {/* Log / Edit review / Add review */}
            {logged ? (
              <button
                onClick={() => setOpenDrawer(isOpen ? null : id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border"
                style={{ borderColor: 'rgba(212,168,83,0.2)', color: 'var(--amber)', background: isOpen ? 'rgba(212,168,83,0.08)' : 'transparent' }}
              >
                <PenLine size={11} />
                Edit review
              </button>
            ) : (
              <button
                onClick={() => setOpenDrawer(isOpen ? null : id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border"
                style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--silver-ghost)', background: isOpen ? 'rgba(255,255,255,0.04)' : 'transparent' }}
              >
                <Clock size={11} />
                Log film
              </button>
            )}
          </div>
        </div>

        {/* Inline drawer */}
        {isOpen && (
          <div className="px-5 pb-4">
            <LogDrawer
              movieId={id}
              movieName={movie.title}
              posterUrl={getPosterUrl(movie.poster_path)}
              existingLog={logged}
              onDone={handleLogDone}
              onCancel={() => setOpenDrawer(null)}
            />
          </div>
        )}
      </div>
    )
  }

  // ─── Render a single "Saved" row ──────────────────────────────────────────

  function SavedRow({ row, idx }: { row: WatchlistRow; idx: number }) {
    const logged = logMap[row.movie_id] ?? null
    const isOpen = openDrawer === row.movie_id
    const [synopsis, setSynopsis] = useState<string | null>(null)

    useEffect(() => {
      async function fetchSynopsis() {
        try {
          const qs = new URLSearchParams({ endpoint: `movie/${row.movie_id}`, language: 'en-US' })
          const res = await fetch(`/api/tmdb?${qs}`)
          const json = res.ok ? await res.json() : {}
          setSynopsis(json.overview ?? '')
        } catch {
          setSynopsis('')
        }
      }
      fetchSynopsis()
    }, [row.movie_id])

    return (
      <div className="fade-up" style={{ animationDelay: `${idx * 0.03}s` }}>
        <div className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
          <TMDBPoster url={row.poster_url} title={row.movie_name} />
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm leading-tight truncate" style={{ color: 'var(--silver)' }}>
              {row.movie_name}
            </p>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--silver-ghost)' }}>
              Saved {new Date(row.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {logged && (
              <p className="text-xs font-mono mt-1" style={{ color: 'var(--amber)', opacity: 0.7 }}>
                ★ {logged.rating}/100 · {logged.mood}
              </p>
            )}
            {synopsis === null ? (
              <p className="text-xs font-mono italic mt-1.5" style={{ color: 'var(--silver-ghost)' }}>Loading synopsis…</p>
            ) : synopsis ? (
              <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--silver-dim)' }}>{synopsis}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {/* Log / Add review / Edit review */}
            {logged ? (
              <button
                onClick={() => setOpenDrawer(isOpen ? null : row.movie_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border"
                style={{ borderColor: 'rgba(212,168,83,0.2)', color: 'var(--amber)', background: isOpen ? 'rgba(212,168,83,0.08)' : 'transparent' }}
              >
                <PenLine size={11} />
                Edit review
              </button>
            ) : (
              <button
                onClick={() => setOpenDrawer(isOpen ? null : row.movie_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border"
                style={{ borderColor: 'rgba(212,168,83,0.2)', color: 'var(--amber)', background: isOpen ? 'rgba(212,168,83,0.08)' : 'transparent' }}
              >
                <CheckCircle2 size={11} />
                Mark watched
              </button>
            )}

            {/* Remove */}
            <button
              onClick={() => removeFromWatchlist(row.movie_id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
            >
              <X size={11} /> Remove
            </button>
          </div>
        </div>

        {/* Inline drawer */}
        {isOpen && (
          <div className="px-5 pb-4">
            <LogDrawer
              movieId={row.movie_id}
              movieName={row.movie_name}
              posterUrl={row.poster_url}
              existingLog={logged}
              onDone={handleLogDone}
              onCancel={() => setOpenDrawer(null)}
            />
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────

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
              {t === 'all'
                ? 'All Films'
                : watchlistLoading ? 'Saved (…)' : `Saved (${wIds.length})`}
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
              placeholder={tab === 'all' ? 'Search TMDB…' : 'Filter saved…'}
              className="cin-input w-full pl-9 pr-4 py-2.5 rounded-lg text-sm"
            />
            {searchText && (
              <button onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--silver-ghost)' }}>
                <X size={13} />
              </button>
            )}
          </div>

          {tab === 'all' && !isSearchMode && (
            <>
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

              {/* Refresh */}
              <button
                onClick={() => setRefreshSeed(s => s + 1)}
                disabled={tmdbLoading}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-mono transition-all cin-btn-ghost"
                title="Load different movies"
              >
                <RefreshCw size={13} className={tmdbLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </>
          )}

          {/* Search mode back to browse */}
          {tab === 'all' && isSearchMode && !searchText && (
            <button
              onClick={loadDiscover}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-mono transition-all cin-btn-ghost"
            >
              ← Browse all
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && !isSearchMode && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
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
          {tab === 'all'
            ? isSearchMode
              ? `${tmdbMovies.length} results for "${searchText}"`
              : `${tmdbMovies.length} films from TMDB`
            : `${filteredWatchlist.length} saved ${filteredWatchlist.length === 1 ? 'film' : 'films'}`}
        </p>

        {/* ── ALL FILMS (TMDB) ── */}
        {tab === 'all' && (
          tmdbLoading ? (
            <div className="cin-card rounded-xl p-16 text-center">
              <div className="w-6 h-6 rounded-full border-t-transparent animate-spin mx-auto"
                style={{ border: '2px solid var(--amber)' }} />
              <p className="text-xs font-mono mt-4" style={{ color: 'var(--silver-ghost)' }}>
                {isSearchMode
                  ? `Searching for "${searchText}"…`
                  : filteringSynopsis
                  ? 'Analysing synopses for your mood…'
                  : 'Fetching from TMDB…'}
              </p>
            </div>
          ) : tmdbMovies.length === 0 ? (
            <div className="cin-card rounded-xl p-16 text-center">
              <BookmarkX size={32} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--silver)' }} />
              <p className="font-display text-xl mb-2" style={{ color: 'var(--silver-dim)' }}>No films found</p>
              <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
                {isSearchMode ? 'Try a different title' : 'Try adjusting your filters or refreshing'}
              </p>
            </div>
          ) : (
            <div className="cin-card rounded-xl overflow-hidden fade-up-1">
              <div className="divide-y" style={{ borderColor: 'rgba(212,168,83,0.06)' }}>
                {tmdbMovies.map((movie, i) => (
                  <AllFilmRow key={movie.id} movie={movie} idx={i} />
                ))}
              </div>
            </div>
          )
        )}

        {/* ── SAVED WATCHLIST ── */}
        {tab === 'watchlist' && (
          watchlistLoading ? (
            <div className="cin-card rounded-xl p-16 text-center">
              <div className="w-6 h-6 rounded-full border-t-transparent animate-spin mx-auto"
                style={{ border: '2px solid var(--amber)' }} />
            </div>
          ) : filteredWatchlist.length === 0 ? (
            <div className="cin-card rounded-xl p-16 text-center">
              <BookmarkX size={32} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--silver)' }} />
              <p className="font-display text-xl mb-2" style={{ color: 'var(--silver-dim)' }}>
                {wIds.length === 0 ? 'Nothing saved yet' : 'No films match'}
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
                {wIds.length === 0
                  ? 'Browse All Films and save some to your watchlist'
                  : 'Try clearing your search'}
              </p>
            </div>
          ) : (
            <div className="cin-card rounded-xl overflow-hidden fade-up-1">
              <div className="divide-y" style={{ borderColor: 'rgba(212,168,83,0.06)' }}>
                {filteredWatchlist.map((row, i) => (
                  <SavedRow key={row.movie_id} row={row} idx={i} />
                ))}
              </div>
              <div className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--silver-ghost)', borderTop: '1px solid rgba(212,168,83,0.06)' }}>
                {wIds.length} {wIds.length === 1 ? 'film' : 'films'} saved
              </div>
            </div>
          )
        )}
      </div>
    </AppShell>
  )
}