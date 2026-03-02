# Polaroify

Turn songs into collectible polaroid-style posters.

![Polaroify Banner](./polaroify.png)

![Live](https://img.shields.io/badge/Live-polaroify.vercel.app-16a34a?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node-Express-111827?style=for-the-badge&logo=nodedotjs&logoColor=green)
![Spotify](https://img.shields.io/badge/Spotify-API-1DB954?style=for-the-badge&logo=spotify&logoColor=white)

## Live Site

**https://polaroify.vercel.app**

## What It Does

- Search Spotify tracks/albums in real time.
- Auto-fill cover art, metadata, date, and Spotify code.
- Auto-fetch lyrics (with manual override).
- Customize colors, typography, visibility, and image fit.
- Choose lyrics preview length (3 / 4 / 5 lines).
- Export as high-quality PNG (free).

## Tech Stack

- Frontend: HTML, CSS, Vanilla JS, Vite
- Backend: Node.js, Express
- APIs: Spotify Web API, lrclib, lyrics.ovh

## Local Setup

1. Install dependencies:
   `npm install`
2. Create `.env` and add:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
3. Run in dev:
   `npm run dev`
4. Open the local URL shown in terminal (usually `http://localhost:5173`).

## Authentication Model

- No user login required.
- No user token required.
- Server uses Spotify Client Credentials flow and caches app tokens.

## Notes

- Spotify preview audio is not guaranteed for every track (`preview_url` may be null).
- Spotify code image is generated from the selected Spotify URI.
- If lyrics are unavailable from one provider, fallback providers are used.
