# Candidate Profile Shortlisting System

Full-stack MERN-style app for storing candidates, matching them against job requirements, and using OpenRouter AI to explain and improve rankings.

## Features

- Add and list candidate profiles
- Search and filter candidates
- Basic shortlist ranking by required skill overlap and experience
- Preferred skill boost
- OpenRouter AI shortlist recommendations with explanations
- AI-generated interview questions
- Match score chart
- Save shortlisted candidates in browser storage

## Local Setup

1. Install dependencies:

```bash
npm.cmd run install:all
```

2. Update backend env values in `backend/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
OPENROUTER_API_KEY=your_openrouter_key
FRONTEND_URL=http://localhost:5173
```

3. Start backend:

```bash
npm.cmd run dev:backend
```

4. Start frontend in another terminal:

```bash
npm.cmd run dev:frontend
```

Backend runs on `http://localhost:5000`; frontend runs on `http://localhost:5173`.

## Deployment

Backend options: Render, Railway, Cyclic, Fly.io, or an Express-compatible Node host.

Set these environment variables on the backend host:

- `MONGODB_URI`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`, optional
- `FRONTEND_URL`
- `PORT`, usually provided by the host

Frontend options: Vercel, Netlify, or Render Static Site.

Set this frontend environment variable:

- `VITE_API_URL=https://your-backend-url.com`

Then build with:

```bash
npm.cmd run build --prefix frontend
```

Deploy the generated `frontend/dist` folder.
