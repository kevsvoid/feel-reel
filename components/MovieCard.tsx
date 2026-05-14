'use client'
import { Movie, MOODS, Mood, LogEntry, storage } from '@/lib/data'
import { useState, useEffect } from 'react'
import { Plus, Check, Star, ImageOff, Eye, X, ChevronDown } from 'lucide-react'
import RatingSlider from '@/components/RatingSlider'

// ─── Poster ───────────────────────────────────────────────────────────────────
function PosterImage({ url, title }: { url: string | null; title: string }) {
  const [errored, setErrored] = useState(false)
  if (!url || errored) {
    return (
      <div className="flex-shrink-0 rounded-lg overflow-hidden flex flex-col items-center justify-center gap-1"
        style={{ width: 64, height: 92, background: 'linear-gradient(160deg,#1c1c1c 0%,#111 100%)', border: '1px solid rgba(212,168,83,0.15)' }}>
        <ImageOff size={18} style={{ color: 'rgba(212,168,83,0.3)' }} />
        <span className="font-mono text-center px-1 leading-tight" style={{ fontSize: 8, color: 'rgba(212,168,83,0.35)' }}>TMDB</span>
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={`${title} poster`} onError={() => setErrored(true)}
    className="flex-shrink-0 rounded-lg object-cover" style={{ width: 64, height: 92, border: '1px solid rgba(212,168,83,0.15)' }} />
}

// ─── Inline Log Drawer ────────────────────────────────────────────────────────
function LogDrawer({ movie, onSaved, onClose }: { movie: Movie; onSaved: () => void; onClose: () => void }) {
  const [rating, setRating]   = useState(0)
  const [mood, setMood]       = useState<Mood>('happy')
  const [review, setReview]   = useState('')
  const [saved, setSaved]     = useState(false)
  const [removeFromWl, setRemoveFromWl] = useState(true)

  function handleSave() {
    const entry: LogEntry = {
      id: Date.now().toString(),
      movieId: movie.id,
      movieName: movie.title,
      rating,
      mood,
      review: review.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    const logs = storage.getLogs()
    storage.saveLogs([entry, ...logs])

    if (removeFromWl) {
      const wl = storage.getWatchlist()
      storage.saveWatchlist(wl.filter(id => id !== movie.id))
    }

    setSaved(true)
    setTimeout(() => { onSaved() }, 1400)
  }

  return (
    <div className="mt-3 pt-4 border-t space-y-4" style={{ borderColor: 'rgba(212,168,83,0.15)' }}>
      {/* Drawer header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--amber)' }}>
          Log this watch
        </p>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5 transition-colors" style={{ color: 'var(--silver-ghost)' }}>
          <X size={13} />
        </button>
      </div>

      {/* Score */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Your Score
        </label>
        <RatingSlider value={rating} onChange={setRating} />
      </div>

      {/* Mood */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Your Mood
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map(m => (
            <button key={m.value} onClick={() => setMood(m.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                mood === m.value ? 'text-void font-medium' : 'border-transparent bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              style={mood === m.value ? { background: m.color, borderColor: m.color } : {}}>
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
        <textarea value={review} onChange={e => setReview(e.target.value)}
          placeholder="What did you think?"
          rows={2}
          className="cin-input w-full px-3 py-2 rounded-lg text-sm resize-none" />
      </div>

      {/* Remove from watchlist toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div
          onClick={() => setRemoveFromWl(!removeFromWl)}
          className="w-8 h-4 rounded-full transition-all relative flex-shrink-0"
          style={{ background: removeFromWl ? 'var(--amber)' : 'rgba(255,255,255,0.1)' }}
        >
          <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
            style={{ background: 'white', left: removeFromWl ? '17px' : '2px' }} />
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Remove from watchlist after logging
        </span>
      </label>

      {/* Save */}
      <button onClick={handleSave}
        className={`cin-btn w-full py-2.5 rounded-lg flex items-center justify-center gap-2 ${saved ? 'opacity-80' : ''}`}>
        {saved
          ? <><Check size={13} /> Logged!</>
          : <><Eye size={13} /> Save to Log</>}
      </button>
    </div>
  )
}

// ─── Movie Card ───────────────────────────────────────────────────────────────
export default function MovieCard({ movie, showAdd = true }: { movie: Movie; showAdd?: boolean }) {
  const [inWatchlist, setInWatchlist]     = useState(false)
  const [showLogDrawer, setShowLogDrawer] = useState(false)

  useEffect(() => {
    const wl = storage.getWatchlist()
    setInWatchlist(wl.includes(movie.id))
  }, [movie.id])

  function toggleWatchlist() {
    const wl = storage.getWatchlist()
    if (inWatchlist) {
      storage.saveWatchlist(wl.filter(id => id !== movie.id))
      setInWatchlist(false)
      setShowLogDrawer(false)
    } else {
      storage.saveWatchlist([...wl, movie.id])
      setInWatchlist(true)
    }
  }

  function handleLogged() {
    // Refresh watchlist state after log + possible removal
    setShowLogDrawer(false)
    const wl = storage.getWatchlist()
    setInWatchlist(wl.includes(movie.id))
  }

  const moodColors = movie.mood.map(m => MOODS.find(x => x.value === m)?.color || '#888')

  return (
    <div className="cin-card rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
      {/* Mood accent strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{
        background: `linear-gradient(90deg, ${moodColors[0] || '#d4a853'}, transparent)`
      }} />

      {/* Poster + info */}
      <div className="flex gap-3">
        <PosterImage url={movie.posterUrl} title={movie.title} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold text-sm leading-tight" style={{ color: 'var(--silver)' }}>
              {movie.title}
            </h3>
            <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(212,168,83,0.1)' }}>
              <Star size={9} fill="var(--amber)" style={{ color: 'var(--amber)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--amber)' }}>{movie.rating}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>{movie.year}</span>
            <span style={{ color: 'var(--silver-ghost)', fontSize: 10 }}>·</span>
            <span className="text-xs font-mono truncate" style={{ color: 'var(--silver-ghost)' }}>{movie.genre}</span>
          </div>
          <p className="text-xs leading-relaxed mt-2 line-clamp-3" style={{ color: 'var(--silver-dim)' }}>
            {movie.description}
          </p>
        </div>
      </div>

      {/* Mood tags + actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {movie.mood.map(m => {
            const md = MOODS.find(x => x.value === m)
            return (
              <span key={m} className="mood-tag" style={{ color: md?.color || '#888', borderColor: md?.color || '#888' }}>
                {md?.emoji} {m}
              </span>
            )
          })}
        </div>

        {showAdd && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Mark as Watched — only shown when saved to watchlist */}
            {inWatchlist && (
              <button
                onClick={() => setShowLogDrawer(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  showLogDrawer
                    ? 'border text-void'
                    : 'border'
                }`}
                style={showLogDrawer
                  ? { background: 'var(--amber)', borderColor: 'var(--amber)', color: 'var(--void)' }
                  : { borderColor: 'rgba(212,168,83,0.3)', color: 'var(--amber)' }}
              >
                <Eye size={11} />
                {showLogDrawer ? 'Cancel' : 'Watched'}
                {!showLogDrawer && <ChevronDown size={10} />}
              </button>
            )}

            {/* Watchlist toggle */}
            <button
              onClick={toggleWatchlist}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                inWatchlist
                  ? 'border border-green-400/30 bg-green-400/5 text-green-400'
                  : 'cin-btn-ghost'
              }`}
            >
              {inWatchlist ? <><Check size={11} /> Saved</> : <><Plus size={11} /> Watchlist</>}
            </button>
          </div>
        )}
      </div>

      {/* Inline log drawer */}
      {showLogDrawer && (
        <LogDrawer
          movie={movie}
          onSaved={handleLogged}
          onClose={() => setShowLogDrawer(false)}
        />
      )}
    </div>
  )
}
