'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import QuickLog from '@/components/QuickLog'
import { LogEntry, MOODS, storage } from '@/lib/data'
import { Plus, X, BookOpen } from 'lucide-react'

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)

  function load() {
    setLogs(storage.getLogs())
  }

  useEffect(() => { load() }, [])

  function deleteLog(id: string) {
    const updated = logs.filter(l => l.id !== id)
    storage.saveLogs(updated)
    setLogs(updated)
  }

  return (
    <AppShell>
      <div className="p-8 max-w-4xl mx-auto">
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

        {/* Logs table */}
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
            <div className="grid grid-cols-12 px-5 py-3 text-xs font-mono uppercase tracking-widest"
              style={{ background: 'rgba(212,168,83,0.05)', color: 'var(--silver-ghost)', borderBottom: '1px solid rgba(212,168,83,0.1)' }}>
              <div className="col-span-4">Film</div>
              <div className="col-span-2 text-center">Rating</div>
              <div className="col-span-2">Mood</div>
              <div className="col-span-3">Review</div>
              <div className="col-span-1"></div>
            </div>

            {/* Rows */}
            <div className="divide-y" style={{ borderColor: 'rgba(212,168,83,0.06)' }}>
              {logs.map((log, i) => {
                const moodData = MOODS.find(m => m.value === log.mood)
                return (
                  <div
                    key={log.id}
                    className="grid grid-cols-12 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors group"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="col-span-4">
                      <p className="font-display font-semibold text-sm leading-tight" style={{ color: 'var(--silver)' }}>
                        {log.movieName}
                      </p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--silver-ghost)' }}>{log.date}</p>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className="text-sm" style={{ color: n <= log.rating ? 'var(--amber)' : 'var(--silver-ghost)', opacity: n <= log.rating ? 1 : 0.3 }}>★</span>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2">
                      {moodData && (
                        <span className="mood-tag" style={{ color: moodData.color, borderColor: `${moodData.color}60` }}>
                          {moodData.emoji} {moodData.label}
                        </span>
                      )}
                    </div>

                    <div className="col-span-3">
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--silver-dim)' }}>
                        {log.review || <span style={{ color: 'var(--silver-ghost)', fontStyle: 'italic' }}>No review</span>}
                      </p>
                    </div>

                    <div className="col-span-1 flex justify-end">
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
