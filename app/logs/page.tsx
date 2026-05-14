'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import QuickLog from '@/components/QuickLog'
import { LogEntry, MOODS, MOCK_MOVIES, storage } from '@/lib/data'
import { Plus, X, BookOpen, ImageOff } from 'lucide-react'

function PosterThumb({ movieId }: { movieId: string | null }) {
  const [err, setErr] = useState(false)
  const movie = movieId ? MOCK_MOVIES.find(m => m.id === movieId) : null
  const url = movie?.posterUrl || null

  if (!url || err) {
    return (
      <div className="flex-shrink-0 rounded flex items-center justify-center"
        style={{ width: 32, height: 46, background: '#1c1c1c', border: '1px solid rgba(212,168,83,0.15)' }}>
        <ImageOff size={11} style={{ color: 'rgba(212,168,83,0.35)' }} />
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" onError={() => setErr(true)}
    className="flex-shrink-0 rounded object-cover" style={{ width: 32, height: 46 }} />
}

function ScoreBadge({ score }: { score: number }) {
  const color = score === 0 ? 'var(--silver-ghost)'
    : score < 40  ? '#e74c3c'
    : score < 60  ? '#d4a853'
    : score < 80  ? '#f0c060'
    : '#27ae60'
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="font-display font-bold text-lg" style={{ color }}>{score}</span>
      <span className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>/100</span>
    </div>
  )
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)

  function load() { setLogs(storage.getLogs()) }
  useEffect(() => { load() }, [])

  function deleteLog(id: string) {
    const updated = logs.filter(l => l.id !== id)
    storage.saveLogs(updated)
    setLogs(updated)
  }

  return (
    <AppShell>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 fade-up">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--amber)' }}>
              — Your Cinema History
            </p>
            <h1 className="font-display text-4xl font-bold" style={{ color: 'var(--silver)' }}>
              Movie <span style={{ color: 'var(--amber)' }}>Logs</span>
            </h1>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${showAdd ? 'cin-btn-ghost' : 'cin-btn'}`}
          >
            {showAdd ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Entry</>}
          </button>
        </div>

        {/* Add entry panel */}
        {showAdd && (
          <div className="cin-card rounded-xl p-6 mb-6 fade-up">
            <h2 className="font-display font-semibold text-base mb-5" style={{ color: 'var(--silver)' }}>
              New Log Entry
            </h2>
            <QuickLog onSaved={() => { setShowAdd(false); load() }} />
          </div>
        )}

        {/* Logs */}
        {logs.length === 0 ? (
          <div className="cin-card rounded-xl p-16 text-center fade-up-1">
            <BookOpen size={32} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--silver)' }} />
            <p className="font-display text-xl mb-2" style={{ color: 'var(--silver-dim)' }}>No logs yet</p>
            <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
              Start tracking movies you&apos;ve watched
            </p>
          </div>
        ) : (
          <div className="cin-card rounded-xl overflow-hidden fade-up-1">
            {/* Table header */}
            <div className="grid px-5 py-3 text-xs font-mono uppercase tracking-widest"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 2fr 32px',
                background: 'rgba(212,168,83,0.05)',
                color: 'var(--silver-ghost)',
                borderBottom: '1px solid rgba(212,168,83,0.1)',
              }}>
              <div>Film</div>
              <div className="text-center">Score</div>
              <div>Mood</div>
              <div>Review</div>
              <div />
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(212,168,83,0.06)' }}>
              {logs.map((log) => {
                const moodData = MOODS.find(m => m.value === log.mood)
                return (
                  <div
                    key={log.id}
                    className="grid px-5 py-3 items-center hover:bg-white/[0.02] transition-colors group"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 2fr 32px' }}
                  >
                    {/* Film */}
                    <div className="flex items-center gap-3 min-w-0">
                      <PosterThumb movieId={log.movieId} />
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-sm leading-tight truncate" style={{ color: 'var(--silver)' }}>
                          {log.movieName}
                        </p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--silver-ghost)' }}>{log.date}</p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex justify-center">
                      <ScoreBadge score={log.rating} />
                    </div>

                    {/* Mood */}
                    <div>
                      {moodData && (
                        <span className="mood-tag" style={{ color: moodData.color, borderColor: `${moodData.color}60` }}>
                          {moodData.emoji} {moodData.label}
                        </span>
                      )}
                    </div>

                    {/* Review */}
                    <div>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--silver-dim)' }}>
                        {log.review || <span style={{ color: 'var(--silver-ghost)', fontStyle: 'italic' }}>No review</span>}
                      </p>
                    </div>

                    {/* Delete */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10"
                        style={{ color: 'var(--crimson)' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--silver-ghost)', borderTop: '1px solid rgba(212,168,83,0.06)' }}>
              {logs.length} {logs.length === 1 ? 'film' : 'films'} logged
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
