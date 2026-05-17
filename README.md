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

## Deploy On Render

This repo includes a `render.yaml` Blueprint for Render. Push the project to GitHub, then in Render choose **New > Blueprint** and select this repository.

Render will create two services:

- `candidate-shortlisting-api`: Node/Express backend from `backend`
- `candidate-shortlisting-frontend`: Vite static site from `frontend`

When Render asks for secret values, add these backend variables:

Set these environment variables on the backend host:

- `MONGODB_URI`
- `OPENROUTER_API_KEY`
- `FRONTEND_URL`: set this after the static site is created, for example `https://candidate-shortlisting-frontend.onrender.com`

The backend uses:

- Build command: `npm install`
- Start command: `npm start`
- Root directory: `backend`

For the frontend static site, set:

- `VITE_API_URL`: your Render backend URL, for example `https://candidate-shortlisting-api.onrender.com`

The frontend uses:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Root directory: `frontend`

After both services exist, update the backend `FRONTEND_URL` to the frontend URL and redeploy the backend. Update the frontend `VITE_API_URL` to the backend URL and redeploy the frontend.

Do not upload `backend/.env` to GitHub or Render. Add secrets in the Render dashboard only.
