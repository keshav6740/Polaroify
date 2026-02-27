# Polaroify

Custom Spotify polaroid/poster generator.

## Run

1. Install dependencies:
   `npm install`
2. Create `.env` from `.env.example` and set:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
3. Start app:
   `npm run dev`
4. Open the Vite URL from terminal.
5. Search a track/album and pick a result.
6. Customize title, artist, lyrics, colors, typography, and layout toggles.

## Auth model

- Users do not log in.
- Users do not paste any token.
- Server uses Spotify Client Credentials flow and caches the app token.

## New poster behavior

- Search results collapse after selecting a song; use `Change Selection` to reopen.
- Track lyrics are auto-fetched from server providers (`lrclib` with fallback to `lyrics.ovh`).
- Users can still fully override lyrics manually.
- Poster is print-first (no action buttons on the polaroid).
- Spotify code is blended into bottom-left and color-matched to poster theme.
- Player timeline is decorative/customizable for design use.
- Use `Download PNG` to export the final polaroid.

## Notes

- Spotify preview audio is only available for some tracks (`preview_url` may be null).
- Spotify Code image is generated from the selected Spotify URI.
