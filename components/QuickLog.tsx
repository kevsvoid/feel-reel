'use client'
import { useState, useRef, useEffect } from 'react'
import { Mood, MOODS, LogEntry, MOCK_MOVIES, Movie, storage } from '@/lib/data'
import RatingSlider from '@/components/RatingSlider'
import { Search, ChevronDown, ImageOff } from 'lucide-react'

function PosterThumb({ url, title }: { url: string | null; title: string }) {
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
  return <img src={url} alt={title} onError={() => setErr(true)}
    className="flex-shrink-0 rounded object-cover" style={{ width: 28, height: 40 }} />
}

export default function QuickLog({ onSaved }: { onSaved?: () => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [rating, setRating] = useState(0)
  const [mood, setMood] = useState<Mood>('happy')
  const [review, setReview] = useState('')
  const [saved, setSaved] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const suggestions = query.length > 0
    ? MOCK_MOVIES.filter(m => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : MOCK_MOVIES.slice(0, 6)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function selectMovie(m: Movie) {
    setSelectedMovie(m)
    setQuery(m.title)
    setOpen(false)
  }

  function handleSave() {
    if (!selectedMovie) return
    const entry: LogEntry = {
      id: Date.now().toString(),
      movieId: selectedMovie.id,
      movieName: selectedMovie.title,
      rating,
      mood,
      review: review.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    const logs = storage.getLogs()
    storage.saveLogs([entry, ...logs])
    setSaved(true)
    setQuery(''); setSelectedMovie(null); setRating(0); setMood('happy'); setReview('')
    setTimeout(() => { setSaved(false); onSaved?.() }, 1500)
  }

  return (
    <div className="space-y-5">

      {/* Movie search */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Select Movie
        </label>
        <div className="relative" ref={dropRef}>
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--silver-ghost)' }} />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); setSelectedMovie(null) }}
            onFocus={() => setOpen(true)}
            placeholder="Search from movie list..."
            className="cin-input w-full pl-9 pr-9 py-2.5 rounded-lg text-sm"
          />
          <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--silver-ghost)' }} />

          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50 shadow-2xl"
              style={{ background: 'var(--frame)', border: '1px solid rgba(212,168,83,0.2)' }}>
              {suggestions.length === 0 ? (
                <div className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>No movies found</div>
              ) : suggestions.map(m => (
                <button
                  key={m.id}
                  onClick={() => selectMovie(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <PosterThumb url={m.posterUrl} title={m.title} />
                  <div className="min-w-0">
                    <p className="text-sm font-display font-semibold truncate" style={{ color: 'var(--silver)' }}>{m.title}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>{m.year} · {m.genre}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedMovie && (
          <p className="text-xs mt-1.5 font-mono" style={{ color: 'var(--amber)' }}>
            ✓ {selectedMovie.title} ({selectedMovie.year})
          </p>
        )}
      </div>

      {/* Rating slider */}
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
        disabled={!selectedMovie}
        className={`cin-btn w-full py-2.5 rounded-lg transition-all ${!selectedMovie ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {saved ? '✓ Saved to Log' : 'Save Log'}
      </button>
    </div>
  )
}
