# 🎬 FeelReel — Mood-Based Movie Recommendation App

FeelReel is a full-stack web application that recommends movies based on a user’s current emotional state. 

---

## Live Demo
 https://feel-reel.vercel.app/

---

## Features

-  **Emotion-Based Recommendations**
  - Users describe how they feel
  - HuggingFace model detects emotion
  - Movies are recommended based on mood

-  **Manual Mood Selection**
  - Choose mood directly

- **Movie Logging**
  - Rate movies (0–100)
  - Add mood tags and reviews

- **Watchlist**
  - Save movies for later
  - Manage personal list

- **Authentication**
  - Secure login/signup using Supabase

---

## Tech Stack

| Layer       | Technology |
|------------|------------|
| Frontend   | Next.js 14, React, TypeScript |
| Styling    | Tailwind CSS |
| Backend    | Next.js API Routes |
| Database   | Supabase (PostgreSQL) |
| AI Model   | HuggingFace (emotion classification) |
| API        | TMDB (movie data) |
| Deployment | Vercel |

---

## How It Works

1. User inputs a mood description
2. Request sent to `/api/emotion`
3. HuggingFace model returns emotion label
4. Emotion is mapped to internal mood category
5. `/api/tmdb` fetches movies based on mood
6. Results displayed to user

---

## Deployment

The application is deployed on **Vercel**, utilizing:

- Serverless API routes
- Edge caching (`revalidate: 300`)
- Global CDN
- GitHub CI/CD integration

---

## Performance

Measured using **Google Lighthouse**:

| Metric        | Score |
|--------------|------|
| Performance  | 88   |
| Accessibility| 82   |
| Best Practices | 100 |
| SEO          | 100  |

### Core Web Vitals
- FCP: 0.7s  
- LCP: 0.8s  
- TBT: 190ms  
- CLS: 0.000  

---

## Known Limitations

- HuggingFace API cold-start latency (~3s)
- Minor accessibility issues (labels, contrast)
- Some unused JavaScript in bundle

---

## Done Setup (Local Development)

### 1. Clone the repo
```bash
git clone https://github.com/kevsvoid/feel-reel.git
cd feel-reel
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` with environment variables for

```
NEXT_PUBLIC_TMDB_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
HF_API_KEY
```

### 4. Run locally
```bash
npm run dev
```

---

## Project Structure

```
app/
  dashboard/
  logs/
  watchlist/
  api/
    emotion/
    tmdb/
components/
lib/
```

---

## 👤 Author

**Kevin DS. Lugue**  
Polytechnic University of the Philippines  
BS Computer Science  

---

## 📄 License

This project is for academic purposes.
