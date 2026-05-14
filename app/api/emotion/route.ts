// app/api/emotion/route.ts
// Server-side proxy to HuggingFace Inference API
// Model: j-hartmann/emotion-english-distilroberta-base

import { NextRequest, NextResponse } from 'next/server'

const HF_MODEL = 'j-hartmann/emotion-english-distilroberta-base'

// The legacy api-inference.huggingface.co/models/ URL returns 404 for
// read tokens on newer HF infrastructure — use the router URL instead
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`

const HF_TO_MOOD: Record<string, string> = {
  joy:      'happy',
  sadness:  'sad',
  anger:    'angry',
  fear:     'anxious',
  disgust:  'bored',
  surprise: 'excited',
  neutral:  'bored',
}

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  const hfKey = process.env.HF_API_KEY
  if (!hfKey) {
    return NextResponse.json({ error: 'HF_API_KEY not set' }, { status: 500 })
  }

  try {
    const res = await fetch(HF_URL, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${hfKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true },
      }),
    })

    if (res.status === 503) {
      // Model still loading — client will retry
      return NextResponse.json({ error: 'model_loading' }, { status: 503 })
    }

    if (!res.ok) {
      const body = await res.text()
      console.error(`HF ${res.status}:`, body)
      return NextResponse.json(
        { error: `HF error ${res.status}: ${body}` },
        { status: res.status }
      )
    }

    // HF returns [[{ label, score }, ...]]
    const raw: Array<Array<{ label: string; score: number }>> = await res.json()
    const scores = raw[0] ?? []
    const top = scores.reduce((a, b) => (b.score > a.score ? b : a), scores[0])

    return NextResponse.json({
      hfLabel: top.label.toLowerCase(),
      mood:    HF_TO_MOOD[top.label.toLowerCase()] ?? 'bored',
      score:   top.score,
      all:     scores.map(s => ({
        hfLabel: s.label.toLowerCase(),
        mood:    HF_TO_MOOD[s.label.toLowerCase()] ?? 'bored',
        score:   s.score,
      })),
      fallback: false,
    })
  } catch (e) {
    console.error('HF fetch threw:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}