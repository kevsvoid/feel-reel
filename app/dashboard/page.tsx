'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import MovieCard from '@/components/MovieCard'
import QuickLog from '@/components/QuickLog'
import { detectEmotion, getMoviesByMood, MOODS, Mood, Movie } from '@/lib/data'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

export default function DashboardPage() {
  const [input, setInput] = useState('')
  const [detectedMood, setDetectedMood] = useState<Mood | null>(null)
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [showQuickLog, setShowQuickLog] = useState(false)

  function analyze() {
    if (!input.trim()) return
    setAnalyzing(true)
    setTimeout(() => {
      const mood = detectEmotion(input)
      const movies = getMoviesByMood(mood, 3)
      setDetectedMood(mood)
      setRecommendations(movies)
      setAnalyzing(false)
    }, 900)
  }

  const moodData = detectedMood ? MOODS.find(m => m.value === detectedMood) : null

  return (
    <AppShell>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 fade-up">
          <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--amber)' }}>
            — How are you feeling?
          </p>
          <h1 className="font-display text-4xl font-bold" style={{ color: 'var(--silver)' }}>
            Tonight&apos;s <span style={{ color: 'var(--amber)' }}>Screening</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Emotion input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Emotion input card */}
            <div className="cin-card rounded-xl p-6 fade-up-1">
              <h2 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--silver)' }}>
                Tell me how you feel
              </h2>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="I'm feeling restless and nostalgic, like I want to cry a little but also feel hopeful..."
                rows={4}
                className="cin-input w-full px-4 py-3 rounded-lg text-sm resize-none mb-4"
              />
              <button
                onClick={analyze}
                disabled={!input.trim() || analyzing}
                className={`cin-btn px-6 py-2.5 rounded-lg flex items-center gap-2 ${!input.trim() || analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {analyzing ? (
                  <span className="w-3.5 h-3.5 border-2 border-void border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Analyze Emotion
              </button>
            </div>

            {/* Results */}
            {detectedMood && moodData && (
              <div className="space-y-4 fade-up">
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-full text-sm font-mono font-medium flex items-center gap-2"
                    style={{ background: `${moodData.color}20`, color: moodData.color, border: `1px solid ${moodData.color}40` }}>
                    <span className="text-lg">{moodData.emoji}</span>
                    Detected: <strong>{moodData.label}</strong>
                  </div>
                  <hr className="reel-divider flex-1" />
                </div>

                <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
                  Recommended for your current mood
                </p>

                {recommendations.map((movie, i) => (
                  <div key={movie.id} style={{ animationDelay: `${i * 0.1}s` }} className="fade-up">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Quick log */}
          <div className="space-y-4 fade-up-2">
            <div className="cin-card rounded-xl overflow-hidden">
              <button
                onClick={() => setShowQuickLog(!showQuickLog)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--silver)' }}>Quick Log</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--silver-ghost)' }}>Log a movie you watched</p>
                </div>
                {showQuickLog ? <ChevronUp size={16} style={{ color: 'var(--silver-ghost)' }} /> : <ChevronDown size={16} style={{ color: 'var(--silver-ghost)' }} />}
              </button>
              {showQuickLog && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: 'rgba(212,168,83,0.1)' }}>
                  <div className="pt-4">
                    <QuickLog onSaved={() => setShowQuickLog(false)} />
                  </div>
                </div>
              )}
            </div>

            {/* Mood palette */}
            <div className="cin-card rounded-xl p-5">
              <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--silver)' }}>Mood Palette</h3>
              <div className="grid grid-cols-3 gap-2">
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setDetectedMood(m.value)
                      setRecommendations(getMoviesByMood(m.value, 3))
                    }}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all hover:bg-white/5"
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-xs font-mono capitalize" style={{ color: m.color }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
