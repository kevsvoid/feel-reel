// lib/data.ts

export type Mood = 'happy' | 'sad' | 'anxious' | 'excited' | 'nostalgic' | 'angry' | 'romantic' | 'bored' | 'inspired'

export interface Movie {
  id: string
  title: string
  year: number
  mood: Mood[]
  genre: string
  poster: string // emoji stand-in
  description: string
  rating: number
}

export interface LogEntry {
  id: string
  movieName: string
  rating: number
  mood: Mood
  review: string
  date: string
}

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

export const MOCK_MOVIES: Movie[] = [
  { id: '1',  title: 'Amélie',                  year: 2001, mood: ['happy','nostalgic','romantic'], genre: 'Romance/Comedy',  poster: '🎠', description: 'A whimsical Parisian tale of an imaginative woman who orchestrates the lives of those around her.',      rating: 8.3 },
  { id: '2',  title: 'Blade Runner 2049',        year: 2017, mood: ['bored','inspired','anxious'],  genre: 'Sci-Fi',          poster: '🌆', description: 'A young blade runner discovers a secret that could plunge society into chaos.',                        rating: 8.0 },
  { id: '3',  title: 'La La Land',               year: 2016, mood: ['romantic','sad','nostalgic'],  genre: 'Musical/Drama',   poster: '🌃', description: 'A jazz musician and an aspiring actress fall in love while pursuing their dreams in Los Angeles.',       rating: 8.0 },
  { id: '4',  title: 'Mad Max: Fury Road',       year: 2015, mood: ['excited','angry','anxious'],   genre: 'Action',          poster: '🏜️', description: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler.',                           rating: 8.1 },
  { id: '5',  title: 'Eternal Sunshine',         year: 2004, mood: ['sad','romantic','nostalgic'],  genre: 'Drama/Sci-Fi',    poster: '🧠', description: 'A couple undergoes a medical procedure to erase each other from their memories.',                      rating: 8.3 },
  { id: '6',  title: 'The Grand Budapest Hotel', year: 2014, mood: ['happy','excited','nostalgic'], genre: 'Comedy/Adventure', poster: '🏨', description: 'The adventures of a legendary hotel concierge and his protégé.',                                      rating: 8.1 },
  { id: '7',  title: 'Requiem for a Dream',      year: 2000, mood: ['sad','anxious','angry'],       genre: 'Drama',           poster: '🪞', description: 'The drug-induced utopias of four Coney Island people are juxtaposed against their grim realities.',    rating: 8.3 },
  { id: '8',  title: 'Spirited Away',            year: 2001, mood: ['inspired','nostalgic','happy'],genre: 'Animation',       poster: '🏮', description: 'A young girl wanders into a world ruled by gods, witches, and spirits.',                                rating: 8.6 },
  { id: '9',  title: 'Whiplash',                 year: 2014, mood: ['inspired','angry','anxious'],  genre: 'Drama/Music',     poster: '🥁', description: 'A promising young drummer enrolls at a cutthroat music conservatory.',                                 rating: 8.5 },
  { id: '10', title: 'Before Sunrise',           year: 1995, mood: ['romantic','happy','nostalgic'],genre: 'Romance/Drama',   poster: '🌅', description: 'A young man and woman meet on a train in Europe and spend one night walking through Vienna.',           rating: 8.1 },
  { id: '11', title: 'Parasite',                 year: 2019, mood: ['anxious','excited','angry'],   genre: 'Thriller/Drama',  poster: '🏚️', description: 'Greed and class discrimination threaten a symbiotic relationship between two families.',                rating: 8.5 },
  { id: '12', title: 'Cinema Paradiso',          year: 1988, mood: ['nostalgic','sad','romantic'],  genre: 'Drama',           poster: '📽️', description: 'A filmmaker recalls his childhood in a Sicilian village and his friendship with the local projectionist.', rating: 8.5 },
  { id: '13', title: 'Interstellar',             year: 2014, mood: ['inspired','anxious','sad'],    genre: 'Sci-Fi',          poster: '🌌', description: 'A team of explorers travel through a wormhole in space to ensure humanity\'s survival.',                  rating: 8.6 },
  { id: '14', title: 'Clueless',                 year: 1995, mood: ['happy','bored','romantic'],    genre: 'Comedy/Romance',  poster: '👗', description: 'A rich high school student tries to boost a new pupil\'s popularity while learning life lessons.',         rating: 7.1 },
  { id: '15', title: 'Drive',                    year: 2011, mood: ['excited','romantic','bored'],  genre: 'Action/Drama',    poster: '🚗', description: 'A mysterious Hollywood stunt driver moonlights as a getaway driver.',                                    rating: 7.8 },
]

// Keyword → mood mapping for simple emotion detection
const MOOD_KEYWORDS: Record<Mood, string[]> = {
  happy:     ['happy','joy','great','good','wonderful','excited','amazing','cheerful','elated','fun'],
  sad:       ['sad','down','depressed','crying','unhappy','blue','lonely','heartbroken','gloomy','miserable'],
  anxious:   ['anxious','stressed','nervous','worried','tense','overwhelmed','panic','uneasy','restless'],
  excited:   ['excited','pumped','hyped','thrilled','energetic','can\'t wait','stoked','fired up'],
  nostalgic: ['nostalgic','miss','remember','childhood','old','past','memories','vintage','throwback'],
  angry:     ['angry','mad','furious','annoyed','frustrated','irritated','rage','pissed','hate'],
  romantic:  ['romantic','love','crush','date','partner','relationship','affection','heart','miss you'],
  bored:     ['bored','boring','nothing','lazy','meh','whatever','dull','unmotivated','slow'],
  inspired:  ['inspired','motivated','creative','productive','driven','ambitious','energized','focused'],
}

export function detectEmotion(text: string): Mood {
  const lower = text.toLowerCase()
  const scores: Record<Mood, number> = {} as Record<Mood, number>
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    scores[mood as Mood] = keywords.filter(k => lower.includes(k)).length
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  return (sorted[0][1] > 0 ? sorted[0][0] : 'bored') as Mood
}

export function getMoviesByMood(mood: Mood, limit = 3): Movie[] {
  return MOCK_MOVIES.filter(m => m.mood.includes(mood)).slice(0, limit)
}

// localStorage helpers
export const storage = {
  getLogs: (): LogEntry[] => {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem('feelreel_logs') || '[]')
  },
  saveLogs: (logs: LogEntry[]) => {
    localStorage.setItem('feelreel_logs', JSON.stringify(logs))
  },
  getWatchlist: (): string[] => {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem('feelreel_watchlist') || '[]')
  },
  saveWatchlist: (ids: string[]) => {
    localStorage.setItem('feelreel_watchlist', JSON.stringify(ids))
  },
  getUser: () => {
    if (typeof window === 'undefined') return null
    const u = localStorage.getItem('feelreel_user')
    return u ? JSON.parse(u) : null
  },
  setUser: (user: { email: string }) => {
    localStorage.setItem('feelreel_user', JSON.stringify(user))
  },
  clearUser: () => {
    localStorage.removeItem('feelreel_user')
  },
}
