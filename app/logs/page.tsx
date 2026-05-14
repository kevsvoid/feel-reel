'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import QuickLog from '@/components/QuickLog'
import RatingSlider from '@/components/RatingSlider'
import { LogEntry, MOODS, Mood, getLogs, deleteLog, updateLog } from '@/lib/data'
import { Plus, X, BookOpen, ImageOff, Pencil, Check } from 'lucide-react'

function PosterThumb({ posterUrl }: { posterUrl: string | null }) {
  const [err, setErr] = useState(false)
  const url = posterUrl

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

// ─── Inline edit panel (expands below the row) ────────────────────────────────
function InlineEditPanel({
  log,
  onSaved,
  onCancel,
}: {
  log: LogEntry
  onSaved: (updated: LogEntry) => void
  onCancel: () => void
}) {
  const [rating, setRating] = useState(log.rating)
  const [mood, setMood]     = useState<Mood>(log.mood)
  const [review, setReview] = useState(log.review)
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)

  async function handleSave() {
    if (saving) return
    setSaving(true)
    const updated = await updateLog(log.id, { rating, mood, review: review.trim() })
    setSaving(false)
    if (!updated) return
    setDone(true)
    setTimeout(() => onSaved(updated), 1000)
  }

  return (
    <div className="col-span-5 px-5 pb-4 pt-2 space-y-4"
      style={{ borderTop: '1px solid rgba(212,168,83,0.08)', background: 'rgba(212,168,83,0.02)' }}>
      <p className="text-xs font-mono uppercase tracking-widest pt-1" style={{ color: 'var(--amber)' }}>
        Editing — {log.movieName}
      </p>

      {/* Score */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Score
        </label>
        <RatingSlider value={rating} onChange={setRating} />
      </div>

      {/* Mood */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
          Mood
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

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className={`cin-btn flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${saving || done ? 'opacity-80' : ''}`}>
          {saving ? (
            <><span className="w-3 h-3 border-2 border-void border-t-transparent rounded-full animate-spin" /> Saving…</>
          ) : done ? (
            <><Check size={13} /> Updated!</>
          ) : (
            <><Pencil size={13} /> Save Changes</>
          )}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-mono border transition-colors"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--silver-ghost)' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function LogsPage() {
  const [logs, setLogs]         = useState<LogEntry[]>([])
  const [showAdd, setShowAdd]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const data = await getLogs()
    setLogs(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    setLogs(prev => prev.filter(l => l.id !== id))
    const ok = await deleteLog(id)
    if (!ok) load()
  }

  function handleEditSaved(updated: LogEntry) {
    setLogs(prev => prev.map(l => l.id === updated.id ? updated : l))
    setEditingId(null)
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

        {/* Loading */}
        {loading ? (
          <div className="cin-card rounded-xl p-16 text-center fade-up-1">
            <div className="w-6 h-6 rounded-full border-t-transparent animate-spin mx-auto"
              style={{ border: '2px solid var(--amber)' }} />
          </div>
        ) : logs.length === 0 ? (
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
                gridTemplateColumns: '2fr 1fr 1fr 2fr 64px',
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
                const isEditing = editingId === log.id
                return (
                  <div key={log.id}>
                    {/* Main row */}
                    <div
                      className="grid px-5 py-3 items-center hover:bg-white/[0.02] transition-colors group"
                      style={{ gridTemplateColumns: '2fr 1fr 1fr 2fr 64px' }}
                    >
                      {/* Film */}
                      <div className="flex items-center gap-3 min-w-0">
                        <PosterThumb posterUrl={log.posterUrl} />
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

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingId(isEditing ? null : log.id)}
                          className={`transition-opacity p-1 rounded hover:bg-amber-500/10 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          style={{ color: isEditing ? 'var(--amber)' : 'var(--silver-ghost)' }}
                          title="Edit log"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10"
                          style={{ color: 'var(--crimson)' }}
                          title="Delete log"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Inline edit panel */}
                    {isEditing && (
                      <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                        <InlineEditPanel
                          log={log}
                          onSaved={handleEditSaved}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    )}
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