// app/api/emotion-filter/route.ts
// Uses HuggingFace emotion model to analyze movie synopses and filter
// those that match the target mood (or its emotionally adjacent moods).

import { NextRequest, NextResponse } from 'next/server'

const HF_MODEL = 'j-hartmann/emotion-english-distilroberta-base'
const HF_URL   = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`

// Map each app mood to the HF labels it considers a "match"
// (primary + adjacent emotions that make sense for that mood's content)
const MOOD_TO_HF_LABELS: Record<string, string[]> = {
  angry:     ['anger', 'disgust'],
  disgusted: ['disgust', 'anger'],
  scared:    ['fear', 'surprise'],
  happy:     ['joy'],
  bored:     ['neutral', 'joy'],
  sad:       ['sadness', 'neutral'],
  shocked:   ['surprise', 'fear'],
}

export interface MovieInput {
  id:       number
  overview: string
}

export interface FilterResult {
  id:       number
  matched:  boolean
  topLabel: string
  score:    number
}

// Score a single synopsis and return top HF label + score
async function scoreSynopsis(
  overview: string,
  hfKey: string
): Promise<{ topLabel: string; score: number }> {
  // HF model handles short texts best — truncate very long overviews
  const text = overview.slice(0, 512)

  const res = await fetch(HF_URL, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${hfKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs:  text,
      options: { wait_for_model: true },
    }),
  })

  if (!res.ok) {
    throw new Error(`HF ${res.status}: ${await res.text()}`)
  }

  const raw: Array<Array<{ label: string; score: number }>> = await res.json()
  const scores = raw[0] ?? []
  const top    = scores.reduce((a, b) => (b.score > a.score ? b : a), scores[0])

  return {
    topLabel: top.label.toLowerCase(),
    score:    top.score,
  }
}

export async function POST(req: NextRequest) {
  const { mood, movies }: { mood: string; movies: MovieInput[] } = await req.json()

  if (!mood || !Array.isArray(movies) || movies.length === 0) {
    return NextResponse.json({ error: 'mood and movies[] are required' }, { status: 400 })
  }

  const hfKey = process.env.HF_API_KEY
  if (!hfKey) {
    return NextResponse.json({ error: 'HF_API_KEY not set' }, { status: 500 })
  }

  const targetLabels = MOOD_TO_HF_LABELS[mood] ?? ['neutral']

  // Filter out movies with no overview (can't analyze)
  const scoreable = movies.filter(m => m.overview?.trim().length > 20)
  const unscored  = movies.filter(m => !m.overview?.trim() || m.overview.trim().length <= 20)

  // Score all synopses concurrently (rate-limit to 5 at a time to be safe)
  const BATCH = 5
  const results: FilterResult[] = []

  for (let i = 0; i < scoreable.length; i += BATCH) {
    const batch = scoreable.slice(i, i + BATCH)
    const scored = await Promise.all(
      batch.map(async movie => {
        try {
          const { topLabel, score } = await scoreSynopsis(movie.overview, hfKey)
          return {
            id:      movie.id,
            matched: targetLabels.includes(topLabel),
            topLabel,
            score,
          } as FilterResult
        } catch {
          // On HF error, include the movie (fail open)
          return { id: movie.id, matched: true, topLabel: 'error', score: 0 } as FilterResult
        }
      })
    )
    results.push(...scored)
  }

  // Unscored movies always pass through (no overview to filter against)
  for (const m of unscored) {
    results.push({ id: m.id, matched: true, topLabel: 'unknown', score: 0 })
  }

  return NextResponse.json({ results })
}
