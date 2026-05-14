// lib/data.ts
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Mood = 'happy' | 'sad' | 'anxious' | 'excited' | 'nostalgic' | 'angry' | 'romantic' | 'bored' | 'inspired'

export interface LogEntry {
  id: string
  movieId: string | null
  movieName: string
  posterUrl: string | null  // stored from TMDB
  rating: number            // 0–100
  mood: Mood
  review: string
  date: string              // display string e.g. "May 12, 2025"
}

export const GENRES = [
  'Action', 'Animation', 'Comedy', 'Drama', 'Musical',
  'Romance', 'Sci-Fi', 'Thriller', 'Adventure',
] as const
export type Genre = typeof GENRES[number]

export const MOODS: { value: Mood; label: string; emoji: string; color: string }[] = [
  { value: 'happy',     label: 'Happy',     emoji: '☀️',  color: '#d4a853' },
  { value: 'sad',       label: 'Sad',       emoji: '🌧️',  color: '#4a7fa5' },
  { value: 'anxious',   label: 'Anxious',   emoji: '⚡',  color: '#9b59b6' },
  { value: 'excited',   label: 'Excited',   emoji: '🔥',  color: '#e74c3c' },
  { value: 'nostalgic', label: 'Nostalgic', emoji: '🎞️',  color: '#a0856c' },
  { value: 'angry',     label: 'Angry',     emoji: '🌋',  color: '#c0392b' },
  { value: 'romantic',  label: 'Romantic',  emoji: '🌹',  color: '#e91e8c' },
  { value: 'bored',     label: 'Bored',     emoji: '🌀',  color: '#607d8b' },
  { value: 'inspired',  label: 'Inspired',  emoji: '✨',  color: '#27ae60' },
]

// ─── Supabase helpers ─────────────────────────────────────────────────────────
// RLS on the DB ensures every query is automatically scoped to the signed-in user —
// no need to pass user_id manually anywhere in the UI.

/** Fetch all logs for the current user, newest first. */
export async function getLogs(): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getLogs:', error.message)
    return []
  }

  return (data ?? []).map(row => ({
    id:        row.id,
    movieId:   row.movie_id,
    movieName: row.movie_name,
    posterUrl: row.poster_url ?? null,
    rating:    row.rating,
    mood:      row.mood as Mood,
    review:    row.review ?? '',
    date:      new Date(row.created_at).toLocaleDateString('en-US', {
                 month: 'short', day: 'numeric', year: 'numeric'
               }),
  }))
}

/** Add a new log. Returns the saved entry or null on error. */
export async function addLog(entry: Omit<LogEntry, 'id' | 'date'>): Promise<LogEntry | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('logs')
    .insert({
      user_id:    session.user.id,
      movie_id:   entry.movieId,
      movie_name: entry.movieName,
      poster_url: entry.posterUrl ?? null,
      rating:     entry.rating,
      mood:       entry.mood,
      review:     entry.review || null,
    })
    .select()
    .single()

  if (error) {
    console.error('addLog:', error.message)
    return null
  }

  return {
    id:        data.id,
    movieId:   data.movie_id,
    movieName: data.movie_name,
    posterUrl: data.poster_url ?? null,
    rating:    data.rating,
    mood:      data.mood as Mood,
    review:    data.review ?? '',
    date:      new Date(data.created_at).toLocaleDateString('en-US', {
                 month: 'short', day: 'numeric', year: 'numeric'
               }),
  }
}

/** Find an existing log for a specific movie_id (returns null if none). */
export async function getLogForMovie(movieId: string): Promise<LogEntry | null> {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('movie_id', movieId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    id:        data.id,
    movieId:   data.movie_id,
    movieName: data.movie_name,
    posterUrl: data.poster_url ?? null,
    rating:    data.rating,
    mood:      data.mood as Mood,
    review:    data.review ?? '',
    date:      new Date(data.created_at).toLocaleDateString('en-US', {
                 month: 'short', day: 'numeric', year: 'numeric'
               }),
  }
}

/** Update an existing log row in place (no new row created). */
export async function updateLog(
  id: string,
  patch: { rating: number; mood: Mood; review: string }
): Promise<LogEntry | null> {
  const { data, error } = await supabase
    .from('logs')
    .update({
      rating: patch.rating,
      mood:   patch.mood,
      review: patch.review || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateLog:', error.message)
    return null
  }

  return {
    id:        data.id,
    movieId:   data.movie_id,
    movieName: data.movie_name,
    posterUrl: data.poster_url ?? null,
    rating:    data.rating,
    mood:      data.mood as Mood,
    review:    data.review ?? '',
    date:      new Date(data.created_at).toLocaleDateString('en-US', {
                 month: 'short', day: 'numeric', year: 'numeric'
               }),
  }
}

/** Delete a log by its UUID. */
export async function deleteLog(id: string): Promise<boolean> {
  const { error } = await supabase.from('logs').delete().eq('id', id)
  if (error) {
    console.error('deleteLog:', error.message)
    return false
  }
  return true
}

/** Fetch the current user's watchlist as an array of movie_id strings. */
export async function getWatchlist(): Promise<string[]> {
  const { data, error } = await supabase
    .from('watchlist')
    .select('movie_id')

  if (error) {
    console.error('getWatchlist:', error.message)
    return []
  }
  return (data ?? []).map(r => r.movie_id)
}

/** Add a TMDB movie to the watchlist. Silently ignores duplicates (unique constraint). */
export async function addToWatchlist(movie: {
  id: string
  title: string
  posterUrl: string | null
}): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  const { error } = await supabase
    .from('watchlist')
    .upsert(
      {
        user_id:    session.user.id,
        movie_id:   movie.id,
        movie_name: movie.title,
        poster_url: movie.posterUrl,
      },
      { onConflict: 'user_id,movie_id', ignoreDuplicates: true }
    )

  if (error) {
    console.error('addToWatchlist:', error.message)
    return false
  }
  return true
}

/** Remove a movie from the watchlist by movie_id string. */
export async function removeFromWatchlist(movieId: string): Promise<boolean> {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('movie_id', movieId)

  if (error) {
    console.error('removeFromWatchlist:', error.message)
    return false
  }
  return true
}