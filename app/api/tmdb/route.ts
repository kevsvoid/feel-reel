// app/api/tmdb/route.ts
// Server-side TMDB proxy — avoids browser CORS / allowlist issues
import { NextRequest, NextResponse } from 'next/server'

const BASE  = 'https://api.themoviedb.org/3'
const TOKEN = process.env.NEXT_PUBLIC_TMDB_KEY || ''

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint') || 'discover/movie'

  // Forward all other params to TMDB
  const tmdbParams = new URLSearchParams()
  searchParams.forEach((val, key) => {
    if (key !== 'endpoint') tmdbParams.set(key, val)
  })

  const url = `${BASE}/${endpoint}?${tmdbParams.toString()}`

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // cache 5 min
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}