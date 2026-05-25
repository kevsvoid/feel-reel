'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import QuickLog from '@/components/QuickLog'
import { MOODS, Mood } from '@/lib/data'
import { getMoviesForDetectedMood, getMoviesByMoodWithSynopsisFilter, getPosterUrl, tmdbRatingTo100, TMDBMovie } from '@/lib/tmdb'
import { Sparkles, ChevronDown, ChevronUp, ImageOff, RefreshCw, AlertTriangle } from 'lucide-react'

function TMDBMovieCard({ movie }: { movie: TMDBMovie }) {
  const [imgErr, setImgErr] = useState(false)
  const poster = getPosterUrl(movie.poster_path, 'w185')
  const score  = tmdbRatingTo100(movie.vote_average)
  const year   = movie.release_date?.split('-')[0]
  const scoreColor = score < 50 ? '#e74c3c' : score < 65 ? '#d4a853' : score < 80 ? '#f0c060' : '#27ae60'

  return (
    <div className="cin-card rounded-xl p-4 flex flex-col gap-3">
      <div className="flex gap-3">
        {poster && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={movie.title} onError={() => setImgErr(true)}
            className="flex-shrink-0 rounded-lg object-cover"
            style={{ width: 64, height: 92, border: '1px solid rgba(212,168,83,0.15)' }} />
        ) : (
          <div className="flex-shrink-0 rounded-lg flex items-center justify-center"
            style={{ width: 64, height: 92, background: '#1c1c1c', border: '1px solid rgba(212,168,83,0.15)' }}>
            <ImageOff size={18} style={{ color: 'rgba(212,168,83,0.3)' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold text-sm leading-tight" style={{ color: 'var(--silver)' }}>
              {movie.title}
            </h3>
            <span className="flex-shrink-0 font-mono text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${scoreColor}18`, color: scoreColor, border: `1px solid ${scoreColor}30` }}>
              {score}/100
            </span>
          </div>
          {year && <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--silver-ghost)' }}>{year}</p>}
          {movie.overview && (
            <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--silver-dim)' }}>
              {movie.overview}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [input, setInput]                     = useState('')
  const [detectedMood, setDetectedMood]       = useState<Mood | null>(null)
  const [hfLabel, setHfLabel]                 = useState<string | null>(null)
  const [hfConfidence, setHfConfidence]       = useState<number | null>(null)
  const [usedFallback, setUsedFallback]       = useState(false)
  const [recommendations, setRecommendations] = useState<TMDBMovie[]>([])
  const [analyzing, setAnalyzing]             = useState(false)
  const [filteringBySynopsis, setFilteringBySynopsis] = useState(false)
  const [refreshing, setRefreshing]           = useState(false)
  const [refreshSeed, setRefreshSeed]         = useState(0)
  const [showQuickLog, setShowQuickLog]       = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  async function fetchRecs(mood: Mood, seed: number, fromTyped = false) {
    if (fromTyped) {
      // Typed emotion path: use HF synopsis analysis
      setFilteringBySynopsis(true)
      const movies = await getMoviesForDetectedMood(mood, 3, seed)
      setRecommendations(movies)
      setFilteringBySynopsis(false)
    } else {
      // Mood palette path: also use synopsis filter
      setFilteringBySynopsis(true)
      const movies = await getMoviesByMoodWithSynopsisFilter(mood, 3, seed)
      setRecommendations(movies)
      setFilteringBySynopsis(false)
    }
  }

  async function analyze() {
    if (!input.trim() || analyzing) return
    setAnalyzing(true)
    setError(null)

    try {
      const tryFetch = () => fetch('/api/emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      })

      let res = await tryFetch()

      // Model warming up — retry once after 3 s
      if (res.status === 503) {
        await new Promise(r => setTimeout(r, 3000))
        res = await tryFetch()
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }

      const data = await res.json()
      const mood = data.mood as Mood
      setDetectedMood(mood)
      setHfLabel(data.hfLabel)
      setHfConfidence(Math.round(data.score * 100))
      setUsedFallback(data.fallback ?? false)
      setRefreshSeed(0)
      await fetchRecs(mood, 0, true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleRefresh() {
    if (!detectedMood || refreshing) return
    setRefreshing(true)
    const next = refreshSeed + 1
    setRefreshSeed(next)
    await fetchRecs(detectedMood, next)
    setRefreshing(false)
  }

  function pickMood(mood: Mood) {
    setDetectedMood(mood)
    setHfLabel(null)
    setHfConfidence(null)
    setUsedFallback(false)
    setRefreshSeed(0)
    setRecommendations([])
    fetchRecs(mood, 0, false)
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
          {/* Left: Emotion input + results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="cin-card rounded-xl p-6 fade-up-1">
              <h2 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--silver)' }}>
                Tell me how you feel
              </h2>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyze() }}
                placeholder="I'm feeling really down and empty, like nothing could cheer me up right now..."
                rows={4}
                className="cin-input w-full px-4 py-3 rounded-lg text-sm resize-none mb-4"
              />
              <button
                onClick={analyze}
                disabled={!input.trim() || analyzing}
                className={`cin-btn px-6 py-2.5 rounded-lg flex items-center gap-2 ${!input.trim() || analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {analyzing
                  ? <span className="w-3.5 h-3.5 border-2 border-void border-t-transparent rounded-full animate-spin" />
                  : <Sparkles size={14} />}
                Analyze Emotion
              </button>
              {error && (
                <p className="text-xs font-mono mt-3 px-3 py-2 rounded-lg"
                  style={{ color: '#e74c3c', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)' }}>
                  {error}
                </p>
              )}
            </div>

            {/* Results */}
            {detectedMood && moodData && (
              <div className="space-y-4 fade-up">
                {/* Mood badge + refresh */}
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-full text-sm font-mono font-medium flex items-center gap-2"
                    style={{ background: `${moodData.color}20`, color: moodData.color, border: `1px solid ${moodData.color}40` }}>
                    <span className="text-lg">{moodData.emoji}</span>
                    Detected: <strong>{moodData.label}</strong>
                    {hfLabel && hfConfidence !== null && (
                      <span style={{ opacity: 0.55, fontSize: 11 }}>· {hfLabel} {hfConfidence}%</span>
                    )}
                  </div>
                  <hr className="reel-divider flex-1" />
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing || recommendations.length === 0}
                    title="Refresh recommendations (same mood)"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cin-btn-ghost"
                    style={{ opacity: refreshing ? 0.5 : 1 }}
                  >
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {/* Fallback notice */}
                {usedFallback && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
                    style={{ background: 'rgba(212,168,83,0.06)', color: 'var(--silver-ghost)', border: '1px solid rgba(212,168,83,0.12)' }}>
                    <AlertTriangle size={11} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                    AI model offline — using keyword detection instead
                  </div>
                )}

                <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
                  Recommended for your current mood — from TMDB
                </p>

                {recommendations.length === 0 ? (
                  <div className="cin-card rounded-xl p-8 text-center">
                    <div className="w-5 h-5 rounded-full border-t-transparent animate-spin mx-auto mb-3"
                      style={{ border: '2px solid var(--amber)' }} />
                    <p className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>
                      {filteringBySynopsis
                        ? 'Analysing synopses for your mood…'
                        : 'Loading recommendations…'}
                    </p>
                  </div>
                ) : recommendations.map((movie, i) => (
                  <div key={`${movie.id}-${refreshSeed}`} style={{ animationDelay: `${i * 0.08}s` }} className="fade-up">
                    <TMDBMovieCard movie={movie} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Quick log + mood palette */}
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
                {showQuickLog
                  ? <ChevronUp size={16} style={{ color: 'var(--silver-ghost)' }} />
                  : <ChevronDown size={16} style={{ color: 'var(--silver-ghost)' }} />}
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
                    onClick={() => pickMood(m.value)}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all hover:bg-white/5"
                    style={detectedMood === m.value
                      ? { background: `${m.color}15`, outline: `1px solid ${m.color}40` }
                      : {}}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-xs font-mono capitalize" style={{ color: m.color }}>{m.label}</span>
                  </button>
                ))}
              </div>
              {detectedMood && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono transition-all cin-btn-ghost"
                  style={{ opacity: refreshing ? 0.5 : 1 }}
                >
                  <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                  Different picks
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}