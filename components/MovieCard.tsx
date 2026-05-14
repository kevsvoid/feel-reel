'use client'
import { Movie, MOODS, storage } from '@/lib/data'
import { useState, useEffect } from 'react'
import { Plus, Check, Star, ImageOff } from 'lucide-react'

function PosterImage({ url, title }: { url: string | null; title: string }) {
  const [errored, setErrored] = useState(false)

  if (!url || errored) {
    return (
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden flex flex-col items-center justify-center gap-1"
        style={{
          width: 64,
          height: 92,
          background: 'linear-gradient(160deg, #1c1c1c 0%, #111 100%)',
          border: '1px solid rgba(212,168,83,0.15)',
        }}
      >
        <ImageOff size={18} style={{ color: 'rgba(212,168,83,0.3)' }} />
        <span className="text-center px-1 leading-tight font-mono" style={{ fontSize: 8, color: 'rgba(212,168,83,0.35)', wordBreak: 'break-word' }}>
          TMDB
        </span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${title} poster`}
      onError={() => setErrored(true)}
      className="flex-shrink-0 rounded-lg object-cover"
      style={{ width: 64, height: 92, border: '1px solid rgba(212,168,83,0.15)' }}
    />
  )
}

export default function MovieCard({ movie, showAdd = true }: { movie: Movie; showAdd?: boolean }) {
  const [inWatchlist, setInWatchlist] = useState(false)

  useEffect(() => {
    const wl = storage.getWatchlist()
    setInWatchlist(wl.includes(movie.id))
  }, [movie.id])

  function toggleWatchlist() {
    const wl = storage.getWatchlist()
    if (inWatchlist) {
      storage.saveWatchlist(wl.filter(id => id !== movie.id))
      setInWatchlist(false)
    } else {
      if (!wl.includes(movie.id)) {
        storage.saveWatchlist([...wl, movie.id])
        setInWatchlist(true)
      }
    }
  }

  const moodColors = movie.mood.map(m => MOODS.find(x => x.value === m)?.color || '#888')

  return (
    <div className="cin-card rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{
        background: `linear-gradient(90deg, ${moodColors[0] || '#d4a853'}, transparent)`
      }} />

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

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {movie.mood.map(m => {
            const moodData = MOODS.find(x => x.value === m)
            return (
              <span key={m} className="mood-tag" style={{ color: moodData?.color || '#888', borderColor: moodData?.color || '#888' }}>
                {moodData?.emoji} {m}
              </span>
            )
          })}
        </div>
        {showAdd && (
          <button
            onClick={toggleWatchlist}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              inWatchlist ? 'text-green-400 border border-green-400/30 bg-green-400/5' : 'cin-btn-ghost'
            }`}
          >
            {inWatchlist ? <><Check size={11} /> Saved</> : <><Plus size={11} /> Watchlist</>}
          </button>
        )}
      </div>
    </div>
  )
}
