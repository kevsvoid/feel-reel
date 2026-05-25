// lib/tmdb.ts
// All TMDB calls go through /api/tmdb (server-side proxy) to avoid
// browser CORS issues and TMDB key allowlist restrictions.

export interface TMDBMovie {
  id:           number
  title:        string
  release_date: string
  poster_path:  string | null
  overview:     string
  vote_average: number   // 0–10 from TMDB
  genre_ids:    number[]
}

/** Build a full poster URL from TMDB poster_path. */
export function getPosterUrl(posterPath: string | null, size = 'w185'): string | null {
  if (!posterPath) return null
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}

/** Convert TMDB 0–10 to 0–100. */
export function tmdbRatingTo100(voteAverage: number): number {
  return Math.round(voteAverage * 10)
}

// ─── Genre mapping ────────────────────────────────────────────────────────────
// FeelReel genre name → TMDB genre ID
export const GENRE_TO_TMDB_ID: Record<string, number> = {
  Action:    28,
  Animation: 16,
  Comedy:    35,
  Drama:     18,
  Musical:   10402,
  Romance:   10749,
  'Sci-Fi':  878,
  Thriller:  53,
  Adventure: 12,
}

// Mood → TMDB genre IDs (OR logic via pipe separator)
// Mapped from HuggingFace j-hartmann/emotion-english-distilroberta-base outputs
const MOOD_TO_GENRE_IDS: Record<string, number[]> = {
  angry:     [28, 53, 80, 18],          // Action, Thriller, Crime, Drama
  disgusted: [27, 53, 9648, 18],        // Horror, Thriller, Mystery, Drama
  scared:    [27, 53, 9648, 878],       // Horror, Thriller, Mystery, Sci-Fi
  happy:     [35, 10751, 16, 12],       // Comedy, Family, Animation, Adventure
  bored:     [12, 35, 878, 28],         // Adventure, Comedy, Sci-Fi, Action
  sad:       [18, 10749, 10402],        // Drama, Romance, Music
  shocked:   [878, 9648, 53, 28],       // Sci-Fi, Mystery, Thriller, Action
}

// ─── Core fetch via proxy ─────────────────────────────────────────────────────

async function tmdbFetch(params: Record<string, string>): Promise<TMDBMovie[]> {
  const qs = new URLSearchParams({ endpoint: 'discover/movie', ...params })
  const res = await fetch(`/api/tmdb?${qs.toString()}`)
  if (!res.ok) return []
  const json = await res.json()
  return (json.results ?? []) as TMDBMovie[]
}

/** Search TMDB by query string. */
export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  if (!query.trim()) return []
  const qs = new URLSearchParams({
    endpoint: 'search/movie',
    query: query,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  })
  const res = await fetch(`/api/tmdb?${qs.toString()}`)
  if (!res.ok) return []
  const json = await res.json()
  return (json.results ?? []) as TMDBMovie[]
}

/**
 * Discover movies — date-seeded page (stable within a day), refreshable.
 * Uses OR logic (pipe) for genre IDs so results are never empty.
 */
export async function discoverMovies(opts: {
  genre?: string
  mood?: string
  seed?: number
  limit?: number
}): Promise<TMDBMovie[]> {
  const { genre, mood, seed = 0, limit = 20 } = opts

  // Day-of-year gives stable page, seed increments it for refresh
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  )
  const page = ((dayOfYear + seed) % 10) + 1

  const params: Record<string, string> = {
    include_adult:      'false',
    include_video:      'false',
    language:           'en-US',
    sort_by:            'popularity.desc',
    'vote_count.gte':   '50',        // lowered from 100 to get more results
    'vote_average.gte': '5.5',       // lowered from 6 to get more results
    page:               String(page),
  }

  // Build genre list with OR logic (pipe = OR in TMDB)
  const genreIds: number[] = []

  if (genre && genre !== 'all' && GENRE_TO_TMDB_ID[genre]) {
    genreIds.push(GENRE_TO_TMDB_ID[genre])
  }
  if (mood && mood !== 'all' && MOOD_TO_GENRE_IDS[mood]) {
    for (const id of MOOD_TO_GENRE_IDS[mood]) {
      if (!genreIds.includes(id)) genreIds.push(id)
    }
  }

  if (genreIds.length > 0) {
    // Pipe = OR: movie just needs ONE of these genres
    params['with_genres'] = genreIds.join('|')
  }

  const movies = await tmdbFetch(params)
  return movies.slice(0, limit)
}

/**
 * Get movies by mood for dashboard — shuffled daily, refreshable by seed.
 */
export async function getMoviesByMoodFromTMDB(
  mood: string,
  limit = 3,
  seed = 0
): Promise<TMDBMovie[]> {
  const movies = await discoverMovies({ mood, seed, limit: 20 })
  // Daily shuffle: same order all day, changes next day
  const today = new Date()
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + seed
  const shuffled = [...movies].sort((a, b) => ((a.id * daySeed) % 97) - ((b.id * daySeed) % 97))
  return shuffled.slice(0, limit)
}