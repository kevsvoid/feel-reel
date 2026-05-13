'use client'
import { useState } from 'react'
import { Mood, MOODS, LogEntry, storage } from '@/lib/data'

export default function QuickLog({ onSaved }: { onSaved?: () => void }) {
  const [movieName, setMovieName] = useState('')
  const [rating, setRating] = useState(0)
  const [mood, setMood] = useState<Mood>('happy')
  const [review, setReview] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (!movieName.trim()) return
    const entry: LogEntry = {
      id: Date.now().toString(),
      movieName: movieName.trim(),
      rating,
      mood,
      review: review.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    const logs = storage.getLogs()
    storage.saveLogs([entry, ...logs])
    setSaved(true)
    setMovieName(''); setRating(0); setMood('happy'); setReview('')
    setTimeout(() => { setSaved(false); onSaved?.() }, 1500)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Movie Name
        </label>
        <input
          value={movieName}
          onChange={e => setMovieName(e.target.value)}
          placeholder="What did you watch?"
          className="cin-input w-full px-4 py-2.5 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Rating
        </label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`text-xl transition-all ${n <= rating ? 'scale-110' : 'opacity-30'}`}
              style={{ color: n <= rating ? 'var(--amber)' : 'var(--silver-ghost)' }}
            >★</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Your Mood
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                mood === m.value
                  ? 'text-void font-medium'
                  : 'border-transparent bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              style={mood === m.value ? { background: m.color, borderColor: m.color } : {}}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Review <span style={{ color: 'var(--silver-ghost)', opacity: 0.5 }}>(optional)</span>
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
        disabled={!movieName.trim()}
        className={`cin-btn w-full py-2.5 rounded-lg transition-all ${!movieName.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {saved ? '✓ Saved to Log' : 'Save Log'}
      </button>
    </div>
  )
}
