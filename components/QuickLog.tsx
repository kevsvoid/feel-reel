'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Mood, MOODS, addLog } from '@/lib/data'
import { searchMovies, getPosterUrl, TMDBMovie } from '@/lib/tmdb'
import RatingSlider from '@/components/RatingSlider'
import { Search, ChevronDown, ImageOff, Loader2 } from 'lucide-react'

function PosterThumb({ url }: { url: string | null }) {
  const [err, setErr] = useState(false)
  if (!url || err) {
    return (
      <div className="flex-shrink-0 rounded flex items-center justify-center"
        style={{ width: 28, height: 40, background: '#1c1c1c', border: '1px solid rgba(212,168,83,0.15)' }}>
        <ImageOff size={10} style={{ color: 'rgba(212,168,83,0.4)' }} />
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" onError={() => setErr(true)}
    className="flex-shrink-0 rounded object-cover" style={{ width: 28, height: 40 }} />
}

export default function QuickLog({ onSaved }: { onSaved?: () => void }) {
  const [query, setQuery]               = useState('')
  const [open, setOpen]                 = useState(false)
  const [results, setResults]           = useState<TMDBMovie[]>([])
  const [searching, setSearching]       = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null)
  const [rating, setRating]             = useState(0)
  const [mood, setMood]                 = useState<Mood>('happy')
  const [review, setReview]             = useState('')
  const [saved, setSaved]               = useState(false)
  const [saving, setSaving]             = useState(false)
  const dropRef  = useRef<HTMLDivElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const data = await searchMovies(q)
    setResults(data.slice(0, 7))
    setSearching(false)
  }, [])

  function handleQueryChange(val: string) {
    setQuery(val)
    setSelectedMovie(null)
    setOpen(true)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => doSearch(val), 350)
  }

  function selectMovie(m: TMDBMovie) {
    setSelectedMovie(m)
    setQuery(m.title)
    setOpen(false)
  }

  async function handleSave() {
    if (!selectedMovie || saving) return
    setSaving(true)
    const year = selectedMovie.release_date?.split('-')[0] ?? ''
    const posterUrl = getPosterUrl(selectedMovie.poster_path)

    const result = await addLog({
      movieId:   String(selectedMovie.id),
      movieName: selectedMovie.title,
      posterUrl: posterUrl,
      rating,
      mood,
      review: review.trim(),
    })

    setSaving(false)
    if (!result) return

    setSaved(true)
    setQuery(''); setSelectedMovie(null); setRating(0); setMood('happy'); setReview('')
    setTimeout(() => { setSaved(false); onSaved?.() }, 1500)
    void year // suppress lint
  }

  const year = selectedMovie?.release_date?.split('-')[0]

  return (
    <div className="space-y-5">

      {/* Movie search */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Search Movie
        </label>
        <div className="relative" ref={dropRef}>
          {searching
            ? <Loader2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin pointer-events-none" style={{ color: 'var(--amber)' }} />
            : <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--silver-ghost)' }} />
          }
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => { setOpen(true); if (query && !results.length) doSearch(query) }}
            placeholder="Search any movie…"
            className="cin-input w-full pl-9 pr-9 py-2.5 rounded-lg text-sm"
          />
          <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--silver-ghost)' }} />

          {open && (results.length > 0 || searching) && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50 shadow-2xl"
              style={{ background: 'var(--frame)', border: '1px solid rgba(212,168,83,0.2)', maxHeight: 300, overflowY: 'auto' }}>
              {results.map(m => {
                const yr = m.release_date?.split('-')[0]
                const poster = getPosterUrl(m.poster_path, 'w92')
                return (
                  <button
                    key={m.id}
                    onClick={() => selectMovie(m)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  >
                    <PosterThumb url={poster} />
                    <div className="min-w-0">
                      <p className="text-sm font-display font-semibold truncate" style={{ color: 'var(--silver)' }}>{m.title}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
                        {yr}{yr && m.vote_average ? ' · ' : ''}{m.vote_average ? `${Math.round(m.vote_average * 10)}/100` : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {selectedMovie && (
          <p className="text-xs mt-1.5 font-mono" style={{ color: 'var(--amber)' }}>
            ✓ {selectedMovie.title}{year ? ` (${year})` : ''}
          </p>
        )}
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Your Score
        </label>
        <RatingSlider value={rating} onChange={setRating} />
      </div>

      {/* Mood */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Your Mood While Watching
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                mood === m.value ? 'text-void font-medium' : 'border-transparent bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              style={mood === m.value ? { background: m.color, borderColor: m.color } : {}}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Review */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Review <span style={{ opacity: 0.5 }}>(optional)</span>
        </label>
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          placeholder="What did you think?"
          rows={2}
          className="cin-input w-full px-4 py-2.5 rounded-lg text-sm resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!selectedMovie || saving}
        className={`cin-btn w-full py-2.5 rounded-lg transition-all ${!selectedMovie || saving ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-void border-t-transparent rounded-full animate-spin" />
            Saving…
          </span>
        ) : saved ? '✓ Saved to Log' : 'Save Log'}
      </button>
    </div>
  )
}