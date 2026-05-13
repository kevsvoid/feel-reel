'use client'
import { Movie, MOODS, storage } from '@/lib/data'
import { useState, useEffect } from 'react'
import { Plus, Check, Star } from 'lucide-react'

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
    <div className="cin-card rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
      {/* Accent strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{
        background: `linear-gradient(90deg, ${moodColors[0] || '#d4a853'}, transparent)`
      }} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{movie.poster}</span>
          <div>
            <h3 className="font-display font-bold text-base leading-tight" style={{ color: 'var(--silver)' }}>
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>{movie.year}</span>
              <span className="text-xs" style={{ color: 'var(--silver-ghost)' }}>·</span>
              <span className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>{movie.genre}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Star size={11} fill="var(--amber)" style={{ color: 'var(--amber)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--amber)' }}>{movie.rating}</span>
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--silver-dim)' }}>{movie.description}</p>

      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-wrap gap-1">
          {movie.mood.map(m => {
            const moodData = MOODS.find(x => x.value === m)
            return (
              <span key={m} className="mood-tag text-xs" style={{ color: moodData?.color || '#888', borderColor: moodData?.color || '#888' }}>
                {moodData?.emoji} {m}
              </span>
            )
          })}
        </div>

        {showAdd && (
          <button
            onClick={toggleWatchlist}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
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
